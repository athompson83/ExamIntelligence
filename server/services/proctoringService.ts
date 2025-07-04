import { WebSocket } from "ws";
import { storage } from "../storage";
import { aiService } from "./aiService";

interface ProctoringSession {
  quizResultId: number;
  studentId: string;
  quizId: number;
  startTime: Date;
  websocket?: WebSocket;
  violations: ProctoringViolation[];
  isActive: boolean;
}

interface ProctoringViolation {
  type: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
  description: string;
  evidence?: string;
  autoFlagged: boolean;
}

interface ProctoringEvent {
  type: string;
  sessionId: string;
  timestamp: Date;
  data: any;
}

export class ProctoringService {
  private sessions: Map<string, ProctoringSession> = new Map();
  private monitors: Map<string, WebSocket> = new Map();

  async startSession(
    quizResultId: number,
    studentId: string,
    quizId: number,
    websocket: WebSocket
  ): Promise<string> {
    const sessionId = `${quizResultId}-${studentId}-${Date.now()}`;
    
    const session: ProctoringSession = {
      quizResultId,
      studentId,
      quizId,
      startTime: new Date(),
      websocket,
      violations: [],
      isActive: true,
    };

    this.sessions.set(sessionId, session);

    // Set up WebSocket event handlers
    this.setupWebSocketHandlers(sessionId, websocket);

    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    session.websocket?.close();

    // Save final session data
    await this.saveProctoringData(session);

    this.sessions.delete(sessionId);
  }

  private setupWebSocketHandlers(sessionId: string, websocket: WebSocket): void {
    websocket.on("message", async (data) => {
      try {
        const event: ProctoringEvent = JSON.parse(data.toString());
        await this.handleProctoringEvent(sessionId, event);
      } catch (error) {
        console.error("Error processing proctoring event:", error);
      }
    });

    websocket.on("close", () => {
      this.endSession(sessionId);
    });

    websocket.on("error", (error) => {
      console.error("WebSocket error for session", sessionId, ":", error);
    });
  }

  private async handleProctoringEvent(sessionId: string, event: ProctoringEvent): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    let violation: ProctoringViolation | null = null;

    switch (event.type) {
      case "tab_switch":
        violation = await this.handleTabSwitch(event);
        break;
      case "window_blur":
        violation = await this.handleWindowBlur(event);
        break;
      case "multiple_faces":
        violation = await this.handleMultipleFaces(event);
        break;
      case "no_face_detected":
        violation = await this.handleNoFaceDetected(event);
        break;
      case "suspicious_movement":
        violation = await this.handleSuspiciousMovement(event);
        break;
      case "copy_paste":
        violation = await this.handleCopyPaste(event);
        break;
      case "right_click":
        violation = await this.handleRightClick(event);
        break;
      case "screen_capture":
        violation = await this.handleScreenCapture(event);
        break;
      case "idle_time":
        violation = await this.handleIdleTime(event);
        break;
      case "heartbeat":
        // Regular heartbeat to confirm connection
        await this.sendHeartbeatResponse(sessionId);
        break;
      default:
        console.warn("Unknown proctoring event type:", event.type);
    }

    if (violation) {
      session.violations.push(violation);
      
      // Create proctoring log
      await storage.createProctoringLog({
        quizResultId: session.quizResultId,
        eventDescription: violation.description,
        eventType: violation.type,
        severity: violation.severity,
        flagged: violation.autoFlagged,
        resolutionStatus: "pending",
      });

      // Notify monitors
      await this.notifyMonitors(session.quizId, violation);

      // If high severity, trigger immediate alert
      if (violation.severity === "high") {
        await this.triggerImmediateAlert(session, violation);
      }
    }
  }

  private async handleTabSwitch(event: ProctoringEvent): Promise<ProctoringViolation> {
    const analysis = await aiService.analyzeProctoringAlert(
      "Student switched tabs during exam",
      event.data,
      { eventType: "tab_switch" }
    );

    return {
      type: "tab_switch",
      severity: analysis.severity as "low" | "medium" | "high",
      timestamp: event.timestamp,
      description: "Student switched browser tabs or windows",
      autoFlagged: analysis.autoFlag,
    };
  }

  private async handleWindowBlur(event: ProctoringEvent): Promise<ProctoringViolation> {
    return {
      type: "window_blur",
      severity: "medium",
      timestamp: event.timestamp,
      description: "Exam window lost focus",
      autoFlagged: false,
    };
  }

  private async handleMultipleFaces(event: ProctoringEvent): Promise<ProctoringViolation> {
    return {
      type: "multiple_faces",
      severity: "high",
      timestamp: event.timestamp,
      description: "Multiple faces detected in camera feed",
      autoFlagged: true,
    };
  }

  private async handleNoFaceDetected(event: ProctoringEvent): Promise<ProctoringViolation> {
    return {
      type: "no_face_detected",
      severity: "medium",
      timestamp: event.timestamp,
      description: "No face detected in camera feed",
      autoFlagged: false,
    };
  }

  private async handleSuspiciousMovement(event: ProctoringEvent): Promise<ProctoringViolation> {
    return {
      type: "suspicious_movement",
      severity: "medium",
      timestamp: event.timestamp,
      description: "Suspicious movement patterns detected",
      autoFlagged: false,
    };
  }

  private async handleCopyPaste(event: ProctoringEvent): Promise<ProctoringViolation> {
    return {
      type: "copy_paste",
      severity: "high",
      timestamp: event.timestamp,
      description: "Copy/paste activity detected",
      autoFlagged: true,
    };
  }

  private async handleRightClick(event: ProctoringEvent): Promise<ProctoringViolation> {
    return {
      type: "right_click",
      severity: "low",
      timestamp: event.timestamp,
      description: "Right-click detected",
      autoFlagged: false,
    };
  }

  private async handleScreenCapture(event: ProctoringEvent): Promise<ProctoringViolation> {
    return {
      type: "screen_capture",
      severity: "high",
      timestamp: event.timestamp,
      description: "Screen capture attempt detected",
      autoFlagged: true,
    };
  }

  private async handleIdleTime(event: ProctoringEvent): Promise<ProctoringViolation | null> {
    const idleTime = event.data.idleTime || 0;
    
    if (idleTime > 300000) { // 5 minutes
      return {
        type: "idle_time",
        severity: "medium",
        timestamp: event.timestamp,
        description: `Extended idle time: ${Math.round(idleTime / 60000)} minutes`,
        autoFlagged: false,
      };
    }

    return null;
  }

  private async sendHeartbeatResponse(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.websocket) return;

    const response = {
      type: "heartbeat_response",
      timestamp: new Date(),
      sessionId,
    };

    session.websocket.send(JSON.stringify(response));
  }

  private async notifyMonitors(quizId: number, violation: ProctoringViolation): Promise<void> {
    const notification = {
      type: "proctoring_alert",
      quizId,
      violation,
      timestamp: new Date(),
    };

    // Send to all monitors for this quiz
    for (const [monitorId, monitorWs] of this.monitors.entries()) {
      if (monitorWs.readyState === WebSocket.OPEN) {
        monitorWs.send(JSON.stringify(notification));
      }
    }
  }

  private async triggerImmediateAlert(session: ProctoringSession, violation: ProctoringViolation): Promise<void> {
    // Create high-priority notification
    await storage.createNotification({
      userId: session.studentId,
      type: "proctoring_alert",
      title: "Exam Violation Detected",
      message: violation.description,
      priority: "high",
    });

    // Optionally pause the exam or take other immediate action
    if (violation.type === "multiple_faces" || violation.type === "screen_capture") {
      await this.pauseExam(session);
    }
  }

  private async pauseExam(session: ProctoringSession): Promise<void> {
    // Update quiz result status
    await storage.updateQuizResult(session.quizResultId, {
      status: "paused",
    });

    // Notify student
    if (session.websocket) {
      const pauseMessage = {
        type: "exam_paused",
        message: "Exam has been paused due to a violation. Please contact your instructor.",
        timestamp: new Date(),
      };

      session.websocket.send(JSON.stringify(pauseMessage));
    }
  }

  private async saveProctoringData(session: ProctoringSession): Promise<void> {
    // Save session summary
    const summary = {
      sessionId: session.quizResultId.toString(),
      duration: Date.now() - session.startTime.getTime(),
      totalViolations: session.violations.length,
      highSeverityViolations: session.violations.filter(v => v.severity === "high").length,
      violationTypes: [...new Set(session.violations.map(v => v.type))],
    };

    // Update quiz result with proctoring summary
    await storage.updateQuizResult(session.quizResultId, {
      overallAnalytics: summary,
    });
  }

  // Monitor management
  addMonitor(monitorId: string, websocket: WebSocket): void {
    this.monitors.set(monitorId, websocket);

    websocket.on("close", () => {
      this.monitors.delete(monitorId);
    });

    websocket.on("error", (error) => {
      console.error("Monitor WebSocket error:", error);
      this.monitors.delete(monitorId);
    });
  }

  removeMonitor(monitorId: string): void {
    const monitor = this.monitors.get(monitorId);
    if (monitor) {
      monitor.close();
      this.monitors.delete(monitorId);
    }
  }

  // Get active sessions for monitoring
  getActiveSessions(): ProctoringSession[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  getSessionById(sessionId: string): ProctoringSession | undefined {
    return this.sessions.get(sessionId);
  }

  async getSessionAnalytics(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const logs = await storage.getProctoringLogs(session.quizResultId);
    
    return {
      sessionId,
      studentId: session.studentId,
      quizId: session.quizId,
      startTime: session.startTime,
      isActive: session.isActive,
      totalViolations: session.violations.length,
      violationBreakdown: this.getViolationBreakdown(session.violations),
      recentLogs: logs.slice(0, 10),
    };
  }

  private getViolationBreakdown(violations: ProctoringViolation[]): any {
    const breakdown = {
      low: 0,
      medium: 0,
      high: 0,
      byType: {} as Record<string, number>,
    };

    violations.forEach(violation => {
      breakdown[violation.severity]++;
      breakdown.byType[violation.type] = (breakdown.byType[violation.type] || 0) + 1;
    });

    return breakdown;
  }
}

export const proctoringService = new ProctoringService();
