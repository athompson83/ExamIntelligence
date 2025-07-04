import { WebSocket } from 'ws';

export interface ProctoringEvent {
  id: string;
  studentId: string;
  quizId: string;
  eventType: 'tab_switch' | 'window_blur' | 'copy_paste' | 'right_click' | 'key_sequence' | 'face_detection' | 'multiple_faces' | 'no_face' | 'suspicious_movement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata: Record<string, any>;
  description: string;
}

export interface ProctoringSession {
  sessionId: string;
  studentId: string;
  quizId: string;
  startTime: Date;
  endTime?: Date;
  events: ProctoringEvent[];
  riskScore: number;
  status: 'active' | 'completed' | 'flagged' | 'terminated';
}

export class AdvancedProctoringService {
  private sessions = new Map<string, ProctoringSession>();
  private websockets = new Map<string, WebSocket>();

  // Risk scoring thresholds
  private readonly RISK_THRESHOLDS = {
    LOW: 10,
    MEDIUM: 25,
    HIGH: 50,
    CRITICAL: 75
  };

  // Event severity scores
  private readonly EVENT_SCORES = {
    tab_switch: { low: 2, medium: 5, high: 10, critical: 15 },
    window_blur: { low: 1, medium: 3, high: 7, critical: 12 },
    copy_paste: { low: 5, medium: 10, high: 20, critical: 30 },
    right_click: { low: 1, medium: 2, high: 5, critical: 8 },
    key_sequence: { low: 3, medium: 8, high: 15, critical: 25 },
    face_detection: { low: 0, medium: 5, high: 15, critical: 25 },
    multiple_faces: { low: 10, medium: 20, high: 35, critical: 50 },
    no_face: { low: 5, medium: 12, high: 25, critical: 40 },
    suspicious_movement: { low: 3, medium: 8, high: 18, critical: 30 }
  };

  startProctoringSession(studentId: string, quizId: string, ws: WebSocket): string {
    const sessionId = `${studentId}-${quizId}-${Date.now()}`;
    
    const session: ProctoringSession = {
      sessionId,
      studentId,
      quizId,
      startTime: new Date(),
      events: [],
      riskScore: 0,
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    this.websockets.set(sessionId, ws);

    // Set up WebSocket message handler
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleProctoringEvent(sessionId, message);
      } catch (error) {
        console.error('Failed to parse proctoring message:', error);
      }
    });

    ws.on('close', () => {
      this.endProctoringSession(sessionId);
    });

    return sessionId;
  }

  handleProctoringEvent(sessionId: string, eventData: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const event: ProctoringEvent = {
      id: `${sessionId}-${Date.now()}`,
      studentId: session.studentId,
      quizId: session.quizId,
      eventType: eventData.type,
      severity: this.calculateEventSeverity(eventData),
      timestamp: new Date(),
      metadata: eventData.metadata || {},
      description: this.generateEventDescription(eventData)
    };

    session.events.push(event);
    session.riskScore += this.calculateEventScore(event);

    // Check for automatic actions
    this.evaluateRiskLevel(session, event);

    // Broadcast to monitoring dashboard
    this.broadcastEventToMonitors(session, event);

    // Update session
    this.sessions.set(sessionId, session);
  }

  private calculateEventSeverity(eventData: any): 'low' | 'medium' | 'high' | 'critical' {
    const { type, metadata } = eventData;

    switch (type) {
      case 'tab_switch':
        return metadata.frequency > 5 ? 'high' : 'medium';
      
      case 'copy_paste':
        return metadata.length > 100 ? 'critical' : 'high';
      
      case 'multiple_faces':
        return metadata.faceCount > 2 ? 'critical' : 'high';
      
      case 'no_face':
        return metadata.duration > 30 ? 'high' : 'medium';
      
      case 'key_sequence':
        return this.detectSuspiciousKeySequence(metadata.sequence) ? 'high' : 'low';
      
      default:
        return 'low';
    }
  }

  private detectSuspiciousKeySequence(sequence: string): boolean {
    const suspiciousPatterns = [
      'ctrl+c', 'ctrl+v', 'ctrl+a', 'alt+tab', 'cmd+tab',
      'f12', 'ctrl+shift+i', 'ctrl+u'
    ];
    
    return suspiciousPatterns.some(pattern => 
      sequence.toLowerCase().includes(pattern)
    );
  }

  private calculateEventScore(event: ProctoringEvent): number {
    const scores = this.EVENT_SCORES[event.eventType];
    return scores ? scores[event.severity] : 1;
  }

  private generateEventDescription(eventData: any): string {
    const { type, metadata } = eventData;

    switch (type) {
      case 'tab_switch':
        return `Student switched tabs ${metadata.frequency || 1} times`;
      
      case 'window_blur':
        return `Student switched away from exam window`;
      
      case 'copy_paste':
        return `Copy/paste detected (${metadata.length || 0} characters)`;
      
      case 'multiple_faces':
        return `Multiple faces detected (${metadata.faceCount} faces)`;
      
      case 'no_face':
        return `No face detected for ${metadata.duration || 0} seconds`;
      
      case 'suspicious_movement':
        return `Suspicious movement detected`;
      
      default:
        return `Proctoring event: ${type}`;
    }
  }

  private evaluateRiskLevel(session: ProctoringSession, event: ProctoringEvent) {
    const { riskScore } = session;

    if (riskScore >= this.RISK_THRESHOLDS.CRITICAL) {
      this.triggerCriticalAlert(session, event);
    } else if (riskScore >= this.RISK_THRESHOLDS.HIGH) {
      this.triggerHighRiskAlert(session, event);
    } else if (riskScore >= this.RISK_THRESHOLDS.MEDIUM) {
      this.triggerMediumRiskAlert(session, event);
    }
  }

  private triggerCriticalAlert(session: ProctoringSession, event: ProctoringEvent) {
    // Auto-terminate exam for critical violations
    session.status = 'terminated';
    
    const ws = this.websockets.get(session.sessionId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'exam_terminated',
        reason: 'Critical security violation detected',
        event: event
      }));
    }

    this.notifyInstructors(session, 'critical', event);
  }

  private triggerHighRiskAlert(session: ProctoringSession, event: ProctoringEvent) {
    session.status = 'flagged';
    this.notifyInstructors(session, 'high', event);
  }

  private triggerMediumRiskAlert(session: ProctoringSession, event: ProctoringEvent) {
    this.notifyInstructors(session, 'medium', event);
  }

  private notifyInstructors(session: ProctoringSession, level: string, event: ProctoringEvent) {
    // Broadcast to instructor monitoring dashboard
    // This would integrate with the existing WebSocket system
    console.log(`${level.toUpperCase()} ALERT: ${event.description} for student ${session.studentId}`);
  }

  private broadcastEventToMonitors(session: ProctoringSession, event: ProctoringEvent) {
    // Broadcast to all connected instructor monitoring sessions
    // Implementation would depend on WebSocket management system
  }

  endProctoringSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.status = session.status === 'active' ? 'completed' : session.status;
    }

    this.websockets.delete(sessionId);
  }

  getSessionReport(sessionId: string): ProctoringSession | undefined {
    return this.sessions.get(sessionId);
  }

  getStudentSessions(studentId: string): ProctoringSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.studentId === studentId);
  }

  getQuizSessions(quizId: string): ProctoringSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.quizId === quizId);
  }

  // Browser lockdown features
  generateLockdownScript(): string {
    return `
      // Disable right-click context menu
      document.addEventListener('contextmenu', e => e.preventDefault());
      
      // Disable key combinations
      document.addEventListener('keydown', e => {
        // Disable F12, Ctrl+Shift+I, Ctrl+U
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u')) {
          e.preventDefault();
          reportProctoringEvent('key_sequence', { sequence: e.key });
        }
        
        // Disable Alt+Tab, Ctrl+Tab
        if ((e.altKey && e.key === 'Tab') || 
            (e.ctrlKey && e.key === 'Tab')) {
          e.preventDefault();
          reportProctoringEvent('tab_switch', { attempt: true });
        }
      });
      
      // Detect window focus/blur
      window.addEventListener('blur', () => {
        reportProctoringEvent('window_blur', { timestamp: Date.now() });
      });
      
      // Detect copy/paste
      document.addEventListener('copy', e => {
        reportProctoringEvent('copy_paste', { 
          type: 'copy', 
          length: window.getSelection().toString().length 
        });
      });
      
      document.addEventListener('paste', e => {
        reportProctoringEvent('copy_paste', { 
          type: 'paste', 
          length: e.clipboardData.getData('text').length 
        });
      });
      
      // Full screen enforcement
      function enterFullscreen() {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      }
      
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          reportProctoringEvent('fullscreen_exit', { timestamp: Date.now() });
          // Force back to fullscreen
          setTimeout(enterFullscreen, 1000);
        }
      });
      
      // Initialize fullscreen
      enterFullscreen();
      
      function reportProctoringEvent(type, metadata) {
        if (window.proctoringWebSocket) {
          window.proctoringWebSocket.send(JSON.stringify({
            type: type,
            metadata: metadata,
            timestamp: Date.now()
          }));
        }
      }
    `;
  }
}

export const advancedProctoringService = new AdvancedProctoringService();