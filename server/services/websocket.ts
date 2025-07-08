import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from '../storage-simple';

interface WebSocketConnection {
  ws: WebSocket;
  userId: string;
  role: string;
  examId?: string;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocketConnection> = new Map();
  private examRooms: Map<string, Set<string>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: (info) => {
        // Add authentication verification here if needed
        return true;
      }
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket, req: any) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role');
    const examId = url.searchParams.get('examId');

    if (!userId || !role) {
      ws.close(1008, 'Missing required parameters');
      return;
    }

    const connectionId = `${userId}-${Date.now()}`;
    const connection: WebSocketConnection = {
      ws,
      userId,
      role,
      examId: examId || undefined
    };

    this.connections.set(connectionId, connection);

    // Join exam room if specified
    if (examId) {
      this.joinExamRoom(connectionId, examId);
    }

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(connectionId, message);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(connectionId);
    });

    // Send connection confirmation
    this.sendToConnection(connectionId, {
      type: 'connected',
      data: { connectionId, userId, role }
    });
  }

  private handleMessage(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'join_exam':
        this.joinExamRoom(connectionId, message.examId);
        break;
      
      case 'leave_exam':
        this.leaveExamRoom(connectionId, message.examId);
        break;
      
      case 'proctoring_event':
        this.handleProctoringEvent(connectionId, message.data);
        break;
      
      case 'exam_progress':
        this.handleExamProgress(connectionId, message.data);
        break;
      
      case 'ping':
        this.sendToConnection(connectionId, { type: 'pong' });
        break;
      
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleDisconnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Leave all exam rooms
      for (const [examId, participants] of this.examRooms.entries()) {
        if (participants.has(connectionId)) {
          participants.delete(connectionId);
          this.broadcastToExamRoom(examId, {
            type: 'participant_left',
            data: { userId: connection.userId, connectionId }
          });
        }
      }
      
      this.connections.delete(connectionId);
    }
  }

  private joinExamRoom(connectionId: string, examId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (!this.examRooms.has(examId)) {
      this.examRooms.set(examId, new Set());
    }

    const participants = this.examRooms.get(examId)!;
    participants.add(connectionId);
    connection.examId = examId;

    // Notify other participants
    this.broadcastToExamRoom(examId, {
      type: 'participant_joined',
      data: { 
        userId: connection.userId, 
        role: connection.role, 
        connectionId 
      }
    }, connectionId);

    // Send current participants to new joiner
    const otherParticipants = Array.from(participants)
      .filter(id => id !== connectionId)
      .map(id => {
        const conn = this.connections.get(id);
        return conn ? { userId: conn.userId, role: conn.role } : null;
      })
      .filter(p => p !== null);

    this.sendToConnection(connectionId, {
      type: 'exam_joined',
      data: { examId, participants: otherParticipants }
    });
  }

  private leaveExamRoom(connectionId: string, examId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const participants = this.examRooms.get(examId);
    if (participants) {
      participants.delete(connectionId);
      
      this.broadcastToExamRoom(examId, {
        type: 'participant_left',
        data: { userId: connection.userId, connectionId }
      });

      if (participants.size === 0) {
        this.examRooms.delete(examId);
      }
    }

    connection.examId = undefined;
  }

  private async handleProctoringEvent(connectionId: string, eventData: any) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.examId) return;

    try {
      // Log the proctoring event
      await storage.createProctoringLog({
        attemptId: eventData.attemptId,
        eventType: eventData.type,
        eventData: eventData,
        severity: eventData.severity || 'low',
        flagged: eventData.severity === 'high'
      });

      // Notify proctors (teachers/admins) in the exam room
      this.broadcastToExamRoom(connection.examId, {
        type: 'proctoring_alert',
        data: {
          studentId: connection.userId,
          event: eventData,
          timestamp: new Date().toISOString()
        }
      }, connectionId, ['teacher', 'admin']);

      // Create notification for high severity events
      if (eventData.severity === 'high') {
        const quiz = await storage.getQuiz(connection.examId);
        if (quiz) {
          await storage.createNotification({
            userId: quiz.creatorId,
            type: 'proctoring_alert',
            title: 'High Priority Proctoring Alert',
            message: `Suspicious activity detected in ${quiz.title}`,
            metadata: { examId: connection.examId, studentId: connection.userId, eventType: eventData.type }
          });
        }
      }
    } catch (error) {
      console.error('Error handling proctoring event:', error);
    }
  }

  private handleExamProgress(connectionId: string, progressData: any) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.examId) return;

    // Broadcast progress to proctors
    this.broadcastToExamRoom(connection.examId, {
      type: 'student_progress',
      data: {
        studentId: connection.userId,
        progress: progressData,
        timestamp: new Date().toISOString()
      }
    }, connectionId, ['teacher', 'admin']);
  }

  private sendToConnection(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  }

  private broadcastToExamRoom(
    examId: string, 
    message: any, 
    excludeConnectionId?: string,
    targetRoles?: string[]
  ) {
    const participants = this.examRooms.get(examId);
    if (!participants) return;

    participants.forEach(connectionId => {
      if (connectionId === excludeConnectionId) return;
      
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      if (targetRoles && !targetRoles.includes(connection.role)) return;

      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }

  public broadcastToUser(userId: string, message: any) {
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.userId === userId && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    }
  }

  public broadcastToRole(role: string, message: any) {
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.role === role && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    }
  }

  public getExamParticipants(examId: string): WebSocketConnection[] {
    const participants = this.examRooms.get(examId);
    if (!participants) return [];

    return Array.from(participants)
      .map(connectionId => this.connections.get(connectionId))
      .filter(conn => conn !== undefined) as WebSocketConnection[];
  }

  public getActiveExams(): string[] {
    return Array.from(this.examRooms.keys());
  }
}

export let wsManager: WebSocketManager;

export function initializeWebSocket(server: Server): void {
  wsManager = new WebSocketManager(server);
}

export { WebSocketManager };
