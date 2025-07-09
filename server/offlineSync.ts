import { z } from "zod";
import { 
  offlineSyncQueue, 
  connectionLogs, 
  teacherNotifications, 
  deviceSyncStatus,
  insertOfflineSyncQueueSchema,
  insertConnectionLogSchema,
  insertTeacherNotificationSchema,
  insertDeviceSyncStatusSchema,
  type OfflineSyncQueue,
  type ConnectionLog,
  type TeacherNotification,
  type DeviceSyncStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { storage } from "./storage-simple";

// Types for offline sync actions
export interface OfflineSyncAction {
  type: "quiz_attempt" | "quiz_response" | "progress_update" | "proctoring_event" | "security_event" | "quiz_completion" | "file_upload" | "note_creation";
  payload: any;
  timestamp: Date;
  priority: "low" | "medium" | "high" | "critical";
}

export interface ConnectionEvent {
  type: "connected" | "disconnected" | "reconnected" | "poor_connection" | "network_error";
  quality?: "excellent" | "good" | "fair" | "poor";
  context?: {
    currentQuestionIndex?: number;
    questionsAnswered?: number;
    timeRemaining?: number;
    offlineDuration?: number;
  };
}

export class OfflineSyncService {
  // Add action to offline sync queue
  async queueOfflineAction(
    userId: string,
    deviceId: string,
    action: OfflineSyncAction
  ): Promise<OfflineSyncQueue> {
    const queueItem = {
      userId,
      deviceId,
      actionType: action.type,
      payload: action.payload,
      clientTimestamp: action.timestamp,
      priority: action.priority,
      status: "pending" as const
    };

    const [result] = await db
      .insert(offlineSyncQueue)
      .values(queueItem)
      .returning();

    return result;
  }

  // Get pending sync actions for a user/device
  async getPendingSyncActions(
    userId: string,
    deviceId: string
  ): Promise<OfflineSyncQueue[]> {
    return await db
      .select()
      .from(offlineSyncQueue)
      .where(
        and(
          eq(offlineSyncQueue.userId, userId),
          eq(offlineSyncQueue.deviceId, deviceId),
          eq(offlineSyncQueue.status, "pending")
        )
      )
      .orderBy(desc(offlineSyncQueue.priority), asc(offlineSyncQueue.createdAt));
  }

  // Mark sync action as completed
  async markSyncCompleted(syncId: string): Promise<void> {
    await db
      .update(offlineSyncQueue)
      .set({
        status: "completed",
        syncedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(offlineSyncQueue.id, syncId));
  }

  // Mark sync action as failed
  async markSyncFailed(syncId: string, errorMessage: string): Promise<void> {
    const [current] = await db
      .select()
      .from(offlineSyncQueue)
      .where(eq(offlineSyncQueue.id, syncId));

    if (!current) return;

    const newRetryCount = (current.retryCount || 0) + 1;
    const maxRetries = current.maxRetries || 3;

    await db
      .update(offlineSyncQueue)
      .set({
        status: newRetryCount >= maxRetries ? "failed" : "pending",
        errorMessage,
        retryCount: newRetryCount,
        updatedAt: new Date()
      })
      .where(eq(offlineSyncQueue.id, syncId));
  }

  // Log connection event
  async logConnectionEvent(
    userId: string,
    deviceId: string,
    sessionId: string,
    event: ConnectionEvent,
    quizAttemptId?: string
  ): Promise<ConnectionLog> {
    const logEntry = {
      userId,
      deviceId,
      sessionId,
      quizAttemptId,
      eventType: event.type,
      connectionQuality: event.quality,
      currentQuestionIndex: event.context?.currentQuestionIndex,
      questionsAnswered: event.context?.questionsAnswered,
      timeRemaining: event.context?.timeRemaining,
      offlineDuration: event.context?.offlineDuration,
      offlineModeEnabled: event.type === "disconnected",
      actionsQueuedOffline: 0, // Will be updated when actions are queued
    };

    const [result] = await db
      .insert(connectionLogs)
      .values(logEntry)
      .returning();

    // If student disconnected, notify teachers
    if (event.type === "disconnected" && quizAttemptId) {
      await this.notifyTeachersOfDisconnection(userId, quizAttemptId);
    }

    return result;
  }

  // Notify teachers when student disconnects
  async notifyTeachersOfDisconnection(
    studentId: string,
    quizAttemptId: string
  ): Promise<void> {
    // Get quiz attempt details
    const attempt = await storage.getQuizAttempt(quizAttemptId);
    if (!attempt) return;

    const quiz = await storage.getQuiz(attempt.quizId);
    if (!quiz) return;

    // Get teachers for this quiz (creator and account admins)
    const teachers = await storage.getTeachersForQuiz(quiz.id);
    
    // Create notifications for each teacher
    for (const teacher of teachers) {
      const notification = {
        teacherId: teacher.id,
        studentId,
        quizId: quiz.id,
        notificationType: "student_disconnected" as const,
        title: "Student Disconnected",
        message: `Student has lost connection during quiz: ${quiz.title}`,
        severity: "warning" as const,
        connectionDuration: 0, // Will be updated when reconnected
        questionsAnsweredOffline: 0,
        metadata: {
          quizAttemptId,
          quizTitle: quiz.title,
          disconnectedAt: new Date().toISOString()
        }
      };

      await db.insert(teacherNotifications).values(notification);
    }
  }

  // Get teacher notifications
  async getTeacherNotifications(
    teacherId: string,
    unreadOnly: boolean = false
  ): Promise<TeacherNotification[]> {
    const query = db
      .select()
      .from(teacherNotifications)
      .where(eq(teacherNotifications.teacherId, teacherId));

    if (unreadOnly) {
      query.where(eq(teacherNotifications.read, false));
    }

    return await query.orderBy(desc(teacherNotifications.createdAt));
  }

  // Mark notification as read
  async markNotificationRead(notificationId: string): Promise<void> {
    await db
      .update(teacherNotifications)
      .set({
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(teacherNotifications.id, notificationId));
  }

  // Update device sync status
  async updateDeviceSyncStatus(
    userId: string,
    deviceId: string,
    updates: {
      offlineModeSupported?: boolean;
      storageCapacity?: number;
      storageUsed?: number;
      pendingActions?: number;
      syncErrors?: number;
    }
  ): Promise<DeviceSyncStatus> {
    const existing = await db
      .select()
      .from(deviceSyncStatus)
      .where(
        and(
          eq(deviceSyncStatus.userId, userId),
          eq(deviceSyncStatus.deviceId, deviceId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [result] = await db
        .update(deviceSyncStatus)
        .set({
          ...updates,
          lastSeenAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(deviceSyncStatus.id, existing[0].id))
        .returning();

      return result;
    } else {
      const [result] = await db
        .insert(deviceSyncStatus)
        .values({
          userId,
          deviceId,
          ...updates,
          lastSeenAt: new Date()
        })
        .returning();

      return result;
    }
  }

  // Get device sync status
  async getDeviceSyncStatus(
    userId: string,
    deviceId: string
  ): Promise<DeviceSyncStatus | null> {
    const [result] = await db
      .select()
      .from(deviceSyncStatus)
      .where(
        and(
          eq(deviceSyncStatus.userId, userId),
          eq(deviceSyncStatus.deviceId, deviceId)
        )
      )
      .limit(1);

    return result || null;
  }

  // Process offline sync queue
  async processSyncQueue(
    userId: string,
    deviceId: string
  ): Promise<{ processed: number; failed: number }> {
    const pendingActions = await this.getPendingSyncActions(userId, deviceId);
    let processed = 0;
    let failed = 0;

    for (const action of pendingActions) {
      try {
        // Mark as syncing
        await db
          .update(offlineSyncQueue)
          .set({ status: "syncing" })
          .where(eq(offlineSyncQueue.id, action.id));

        // Process the action based on type
        await this.processAction(action);

        // Mark as completed
        await this.markSyncCompleted(action.id);
        processed++;
      } catch (error) {
        await this.markSyncFailed(action.id, error.message);
        failed++;
      }
    }

    // Update device sync status
    await this.updateDeviceSyncStatus(userId, deviceId, {
      pendingActions: 0,
      syncErrors: failed,
      lastSyncAt: new Date()
    });

    return { processed, failed };
  }

  // Process individual sync action
  private async processAction(action: OfflineSyncQueue): Promise<void> {
    switch (action.actionType) {
      case "quiz_attempt":
        await this.processQuizAttempt(action.payload);
        break;
      case "quiz_response":
        await this.processQuizResponse(action.payload);
        break;
      case "progress_update":
        await this.processProgressUpdate(action.payload);
        break;
      case "proctoring_event":
        await this.processProctoringEvent(action.payload);
        break;
      case "security_event":
        await this.processSecurityEvent(action.payload);
        break;
      case "quiz_completion":
        await this.processQuizCompletion(action.payload);
        break;
      case "file_upload":
        await this.processFileUpload(action.payload);
        break;
      case "note_creation":
        await this.processNoteCreation(action.payload);
        break;
      default:
        throw new Error(`Unknown action type: ${action.actionType}`);
    }
  }

  // Process specific action types
  private async processQuizAttempt(payload: any): Promise<void> {
    // Create or update quiz attempt
    await storage.createQuizAttempt(payload);
  }

  private async processQuizResponse(payload: any): Promise<void> {
    // Save quiz response
    await storage.saveQuizResponse(payload);
  }

  private async processProgressUpdate(payload: any): Promise<void> {
    // Update quiz progress
    await storage.updateQuizProgress(payload);
  }

  private async processProctoringEvent(payload: any): Promise<void> {
    // Log proctoring event
    await storage.logProctoringEvent(payload);
  }

  private async processSecurityEvent(payload: any): Promise<void> {
    // Log security event
    await storage.logSecurityEvent(payload);
  }

  private async processQuizCompletion(payload: any): Promise<void> {
    // Complete quiz attempt
    await storage.completeQuizAttempt(payload);
  }

  private async processFileUpload(payload: any): Promise<void> {
    // Process file upload
    // This would typically involve saving the file and updating references
    console.log("Processing file upload:", payload);
  }

  private async processNoteCreation(payload: any): Promise<void> {
    // Create note or annotation
    console.log("Processing note creation:", payload);
  }
}

export const offlineSyncService = new OfflineSyncService();