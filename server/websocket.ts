import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "./storage";

interface WebSocketMessage {
  type: string;
  data: any;
  userId?: string;
  attemptId?: string;
}

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  role: string;
  attemptId?: string;
}

const connectedClients = new Map<string, ConnectedClient>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message: Buffer) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'authenticate':
            handleAuthentication(ws, data);
            break;
          case 'join_exam':
            handleJoinExam(ws, data);
            break;
          case 'leave_exam':
            handleLeaveExam(ws, data);
            break;
          case 'proctoring_event':
            handleProctoringEvent(ws, data);
            break;
          case 'exam_progress':
            handleExamProgress(ws, data);
            break;
          case 'ping':
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong' }));
            }
            break;
          default:
            console.warn('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

function handleAuthentication(ws: WebSocket, data: WebSocketMessage) {
  const { userId, role, attemptId } = data.data;
  
  connectedClients.set(userId, {
    ws,
    userId,
    role,
    attemptId,
  });

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'authentication_success',
      data: { userId, role },
    }));
  }

  console.log(`User ${userId} authenticated with role ${role}`);
}

function handleJoinExam(ws: WebSocket, data: WebSocketMessage) {
  const { userId, attemptId, quizId } = data.data;
  
  // Update client info
  const client = connectedClients.get(userId);
  if (client) {
    client.attemptId = attemptId;
  }

  // Notify exam monitors
  broadcastToExamMonitors(quizId, {
    type: 'student_joined',
    data: { userId, attemptId, timestamp: new Date().toISOString() },
  });

  console.log(`User ${userId} joined exam ${quizId}`);
}

function handleLeaveExam(ws: WebSocket, data: WebSocketMessage) {
  const { userId, attemptId, quizId } = data.data;
  
  // Notify exam monitors
  broadcastToExamMonitors(quizId, {
    type: 'student_left',
    data: { userId, attemptId, timestamp: new Date().toISOString() },
  });

  console.log(`User ${userId} left exam ${quizId}`);
}

async function handleProctoringEvent(ws: WebSocket, data: WebSocketMessage) {
  const { userId, attemptId, eventType, eventData, severity } = data.data;
  
  try {
    // Save proctoring log to database
    const proctoringLog = await storage.createProctoringLog({
      attemptId,
      eventType,
      eventData,
      severity: severity || 'medium',
    });

    // Get the quiz attempt to find the quiz ID
    const attempt = await storage.getQuizAttempt(attemptId);
    if (attempt) {
      // Broadcast to exam monitors
      broadcastToExamMonitors(attempt.quizId, {
        type: 'proctoring_alert',
        data: {
          userId,
          attemptId,
          eventType,
          severity,
          timestamp: new Date().toISOString(),
          logId: proctoringLog.id,
        },
      });

      // Create notification for administrators
      await storage.createNotification({
        userId: attempt.studentId,
        type: 'proctoring',
        title: 'Proctoring Alert',
        message: `${eventType} detected during exam`,
        metadata: { attemptId, severity, logId: proctoringLog.id },
      });
    }
  } catch (error) {
    console.error('Error handling proctoring event:', error);
  }
}

function handleExamProgress(ws: WebSocket, data: WebSocketMessage) {
  const { userId, attemptId, quizId, currentQuestion, totalQuestions, timeSpent } = data.data;
  
  // Broadcast progress to exam monitors
  broadcastToExamMonitors(quizId, {
    type: 'exam_progress',
    data: {
      userId,
      attemptId,
      currentQuestion,
      totalQuestions,
      timeSpent,
      timestamp: new Date().toISOString(),
    },
  });
}

function handleDisconnection(ws: WebSocket) {
  // Find and remove the disconnected client
  for (const [userId, client] of connectedClients.entries()) {
    if (client.ws === ws) {
      connectedClients.delete(userId);
      console.log(`User ${userId} disconnected`);
      break;
    }
  }
}

function broadcastToExamMonitors(quizId: string, message: any) {
  // Broadcast to all connected teachers/administrators monitoring this quiz
  for (const [userId, client] of connectedClients.entries()) {
    if (client.role === 'teacher' || client.role === 'admin') {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          ...message,
          quizId,
        }));
      }
    }
  }
}

export function broadcastNotification(userId: string, notification: any) {
  const client = connectedClients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({
      type: 'notification',
      data: notification,
    }));
  }
}

export function broadcastToAllUsers(message: any) {
  for (const [userId, client] of connectedClients.entries()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }
}
