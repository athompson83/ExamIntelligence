import express from 'express';
import { DatabaseStorage } from './storage-simple';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface SecurityEvent {
  type: 'tab_switch' | 'window_blur' | 'copy_paste' | 'screenshot_attempt' | 'network_disconnect' | 'multiple_tabs' | 'unauthorized_software' | 'suspicious_timing' | 'biometric_fail';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  metadata?: any;
}

interface StudentSession {
  userId: string;
  examId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  securityEvents: SecurityEvent[];
  isActive: boolean;
  warnings: number;
  flags: string[];
  browserFingerprint: string;
  ipAddress: string;
  connectionStrength: number;
}

interface BiometricData {
  faceMatch: boolean;
  confidence: number;
  timestamp: Date;
}

interface ProctorAlert {
  id: string;
  studentId: string;
  examId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  resolved: boolean;
  proctorActions: string[];
}

export class ProctorSecurityService {
  private activeSessions: Map<string, StudentSession> = new Map();
  private wsServer: WebSocketServer;
  private storage: DatabaseStorage;
  private proctorConnections: Map<string, WebSocket> = new Map();
  private alerts: Map<string, ProctorAlert> = new Map();

  constructor(server: Server, storage: DatabaseStorage) {
    this.storage = storage;
    this.wsServer = new WebSocketServer({ 
      server,
      path: '/proctoring',
      verifyClient: this.verifyClient.bind(this)
    });
    
    this.wsServer.on('connection', this.handleConnection.bind(this));
    this.startPeriodicChecks();
  }

  private verifyClient(info: any): boolean {
    // Verify WebSocket connection has proper authentication
    const url = new URL(info.req.url, 'ws://localhost');
    const token = url.searchParams.get('token');
    
    // In production, validate JWT token here
    return !!token;
  }

  private handleConnection(ws: WebSocket, req: express.Request) {
    const url = new URL(req.url!, 'ws://localhost');
    const userId = url.searchParams.get('userId');
    const examId = url.searchParams.get('examId');
    const role = url.searchParams.get('role');
    
    if (role === 'proctor') {
      this.proctorConnections.set(userId!, ws);
      this.sendProctorUpdate(userId!);
    } else {
      this.initializeStudentSession(ws, userId!, examId!, req);
    }

    ws.on('message', (data) => {
      this.handleMessage(ws, userId!, data.toString());
    });

    ws.on('close', () => {
      this.handleDisconnection(userId!, examId!);
    });
  }

  private initializeStudentSession(ws: WebSocket, userId: string, examId: string, req: express.Request) {
    const session: StudentSession = {
      userId,
      examId,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      lastActivity: new Date(),
      securityEvents: [],
      isActive: true,
      warnings: 0,
      flags: [],
      browserFingerprint: this.generateBrowserFingerprint(req),
      ipAddress: this.getClientIP(req),
      connectionStrength: 100
    };

    this.activeSessions.set(userId, session);
    
    // Send initial security requirements to client
    ws.send(JSON.stringify({
      type: 'security_init',
      requirements: {
        fullscreen: true,
        disableRightClick: true,
        preventCopyPaste: true,
        trackMouseMovement: true,
        requireFocus: true,
        biometricCheck: true
      }
    }));

    this.logSecurityEvent(userId, {
      type: 'network_disconnect',
      severity: 'low',
      description: 'Student session initialized',
      timestamp: new Date()
    });
  }

  private handleMessage(ws: WebSocket, userId: string, message: string) {
    try {
      const data = JSON.parse(message);
      const session = this.activeSessions.get(userId);
      
      if (!session) return;

      session.lastActivity = new Date();

      switch (data.type) {
        case 'security_event':
          this.handleSecurityEvent(userId, data.event);
          break;
        case 'heartbeat':
          this.handleHeartbeat(userId, data);
          break;
        case 'biometric_data':
          this.handleBiometricData(userId, data);
          break;
        case 'screen_capture':
          this.handleScreenCapture(userId, data);
          break;
        case 'activity_update':
          this.handleActivityUpdate(userId, data);
          break;
      }
    } catch (error) {
      console.error('Error handling proctoring message:', error);
    }
  }

  private handleSecurityEvent(userId: string, event: SecurityEvent) {
    const session = this.activeSessions.get(userId);
    if (!session) return;

    this.logSecurityEvent(userId, event);

    // Increment warnings based on severity
    if (event.severity === 'medium') session.warnings += 1;
    if (event.severity === 'high') session.warnings += 2;
    if (event.severity === 'critical') session.warnings += 5;

    // Check if warnings exceed threshold
    if (session.warnings >= 5) {
      this.createAlert(userId, session.examId, 'excessive_warnings', 'high', 
        `Student has accumulated ${session.warnings} warnings`);
    }

    // Immediate actions for critical events
    if (event.severity === 'critical') {
      this.createAlert(userId, session.examId, event.type, 'critical', event.description);
      this.flagStudentSession(userId, `Critical security violation: ${event.type}`);
    }

    this.notifyProctors(userId, session.examId, event);
  }

  private handleHeartbeat(userId: string, data: any) {
    const session = this.activeSessions.get(userId);
    if (!session) return;

    // Check for irregular heartbeat patterns (possible automation)
    const timeSinceLastActivity = Date.now() - session.lastActivity.getTime();
    if (timeSinceLastActivity > 30000) { // 30 seconds
      this.logSecurityEvent(userId, {
        type: 'suspicious_timing',
        severity: 'medium',
        description: 'Irregular activity patterns detected',
        timestamp: new Date(),
        metadata: { inactiveTime: timeSinceLastActivity }
      });
    }

    // Update connection strength based on latency
    session.connectionStrength = Math.max(0, 100 - (data.latency / 10));
  }

  private handleBiometricData(userId: string, data: BiometricData) {
    if (!data.faceMatch || data.confidence < 0.8) {
      this.logSecurityEvent(userId, {
        type: 'biometric_fail',
        severity: 'high',
        description: `Biometric verification failed (confidence: ${data.confidence})`,
        timestamp: new Date(),
        metadata: data
      });
    }
  }

  private handleScreenCapture(userId: string, data: any) {
    // Store screen capture for review
    this.logSecurityEvent(userId, {
      type: 'screenshot_attempt',
      severity: 'medium',
      description: 'Screen capture detected',
      timestamp: new Date(),
      metadata: { captureTime: data.timestamp }
    });
  }

  private handleActivityUpdate(userId: string, data: any) {
    const session = this.activeSessions.get(userId);
    if (!session) return;

    // Check for multiple tabs/windows
    if (data.tabCount > 1) {
      this.logSecurityEvent(userId, {
        type: 'multiple_tabs',
        severity: 'high',
        description: `Multiple tabs detected: ${data.tabCount}`,
        timestamp: new Date(),
        metadata: { tabCount: data.tabCount }
      });
    }

    // Check for unauthorized software
    if (data.suspiciousProcesses && data.suspiciousProcesses.length > 0) {
      this.logSecurityEvent(userId, {
        type: 'unauthorized_software',
        severity: 'critical',
        description: 'Unauthorized software detected',
        timestamp: new Date(),
        metadata: { processes: data.suspiciousProcesses }
      });
    }
  }

  private logSecurityEvent(userId: string, event: SecurityEvent) {
    const session = this.activeSessions.get(userId);
    if (!session) return;

    session.securityEvents.push(event);

    // Store in database for permanent record
    this.storage.createSecurityEvent({
      userId,
      examId: session.examId,
      sessionId: session.sessionId,
      eventType: event.type,
      severity: event.severity,
      description: event.description,
      metadata: event.metadata,
      timestamp: event.timestamp
    }).catch(error => {
      console.error('Failed to store security event:', error);
    });
  }

  private createAlert(userId: string, examId: string, alertType: string, severity: 'low' | 'medium' | 'high' | 'critical', description: string) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: ProctorAlert = {
      id: alertId,
      studentId: userId,
      examId,
      alertType,
      severity,
      description,
      timestamp: new Date(),
      resolved: false,
      proctorActions: []
    };

    this.alerts.set(alertId, alert);

    // Store in database
    this.storage.createProctorAlert({
      id: alertId,
      studentId: userId,
      examId,
      alertType,
      severity,
      description,
      timestamp: new Date(),
      resolved: false,
      metadata: { sessionEvents: this.activeSessions.get(userId)?.securityEvents || [] }
    }).catch(error => {
      console.error('Failed to store proctor alert:', error);
    });

    // Notify all connected proctors
    this.notifyAllProctors(alert);
  }

  private flagStudentSession(userId: string, reason: string) {
    const session = this.activeSessions.get(userId);
    if (!session) return;

    session.flags.push(reason);
    
    // Auto-suspend if too many flags
    if (session.flags.length >= 3) {
      this.suspendStudentSession(userId, 'Excessive security violations');
    }
  }

  private suspendStudentSession(userId: string, reason: string) {
    const session = this.activeSessions.get(userId);
    if (!session) return;

    session.isActive = false;
    
    // Notify student of suspension
    this.sendToStudent(userId, {
      type: 'session_suspended',
      reason,
      contactProctor: true
    });

    this.createAlert(userId, session.examId, 'session_suspended', 'critical', reason);
  }

  private notifyProctors(userId: string, examId: string, event: SecurityEvent) {
    this.proctorConnections.forEach((ws, proctorId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'security_event',
          studentId: userId,
          examId,
          event,
          timestamp: new Date()
        }));
      }
    });
  }

  private notifyAllProctors(alert: ProctorAlert) {
    this.proctorConnections.forEach((ws, proctorId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'new_alert',
          alert
        }));
      }
    });
  }

  private sendToStudent(userId: string, message: any) {
    // Find student WebSocket connection and send message
    // Implementation depends on how student connections are tracked
  }

  private sendProctorUpdate(proctorId: string) {
    const ws = this.proctorConnections.get(proctorId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const activeSessionsData = Array.from(this.activeSessions.values()).map(session => ({
      userId: session.userId,
      examId: session.examId,
      startTime: session.startTime,
      warnings: session.warnings,
      flags: session.flags,
      connectionStrength: session.connectionStrength,
      recentEvents: session.securityEvents.slice(-5)
    }));

    const pendingAlerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);

    ws.send(JSON.stringify({
      type: 'proctor_update',
      activeSessions: activeSessionsData,
      alerts: pendingAlerts,
      timestamp: new Date()
    }));
  }

  private handleDisconnection(userId: string, examId: string) {
    const session = this.activeSessions.get(userId);
    if (!session) return;

    this.logSecurityEvent(userId, {
      type: 'network_disconnect',
      severity: 'medium',
      description: 'Student disconnected unexpectedly',
      timestamp: new Date()
    });

    // Don't remove session immediately - allow reconnection
    setTimeout(() => {
      if (this.activeSessions.has(userId)) {
        const currentSession = this.activeSessions.get(userId);
        if (currentSession && !currentSession.isActive) {
          this.activeSessions.delete(userId);
        }
      }
    }, 300000); // 5 minutes grace period
  }

  private startPeriodicChecks() {
    setInterval(() => {
      this.checkSessionHealth();
      this.updateProctorDashboards();
    }, 30000); // Every 30 seconds
  }

  private checkSessionHealth() {
    const now = Date.now();
    
    this.activeSessions.forEach((session, userId) => {
      const timeSinceActivity = now - session.lastActivity.getTime();
      
      // Flag sessions with no activity for 2 minutes
      if (timeSinceActivity > 120000) {
        this.logSecurityEvent(userId, {
          type: 'suspicious_timing',
          severity: 'medium',
          description: `No activity for ${Math.round(timeSinceActivity / 1000)} seconds`,
          timestamp: new Date()
        });
      }
    });
  }

  private updateProctorDashboards() {
    this.proctorConnections.forEach((ws, proctorId) => {
      this.sendProctorUpdate(proctorId);
    });
  }

  private generateBrowserFingerprint(req: express.Request): string {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    return Buffer.from(`${userAgent}|${acceptLanguage}|${acceptEncoding}`).toString('base64');
  }

  private getClientIP(req: express.Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
  }

  // Public API methods
  public getActiveSessionStats() {
    return {
      totalSessions: this.activeSessions.size,
      activeSessions: Array.from(this.activeSessions.values()).filter(s => s.isActive).length,
      flaggedSessions: Array.from(this.activeSessions.values()).filter(s => s.flags.length > 0).length,
      pendingAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved).length
    };
  }

  public getSessionDetails(userId: string): StudentSession | undefined {
    return this.activeSessions.get(userId);
  }

  public resolveAlert(alertId: string, proctorId: string, action: string) {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.proctorActions.push(`${action} by ${proctorId} at ${new Date().toISOString()}`);

    // Update in database
    this.storage.updateProctorAlert(alertId, {
      resolved: true,
      resolvedBy: proctorId,
      resolvedAt: new Date(),
      resolution: action
    }).catch(error => {
      console.error('Failed to update proctor alert:', error);
    });

    return true;
  }

  public getSecurityReport(examId: string) {
    const examSessions = Array.from(this.activeSessions.values()).filter(s => s.examId === examId);
    const examAlerts = Array.from(this.alerts.values()).filter(a => a.examId === examId);

    return {
      examId,
      totalStudents: examSessions.length,
      flaggedStudents: examSessions.filter(s => s.flags.length > 0).length,
      totalSecurityEvents: examSessions.reduce((sum, s) => sum + s.securityEvents.length, 0),
      criticalAlerts: examAlerts.filter(a => a.severity === 'critical').length,
      resolvedAlerts: examAlerts.filter(a => a.resolved).length,
      sessionDetails: examSessions.map(s => ({
        userId: s.userId,
        warnings: s.warnings,
        flags: s.flags,
        events: s.securityEvents.length,
        connectionQuality: s.connectionStrength
      }))
    };
  }
}