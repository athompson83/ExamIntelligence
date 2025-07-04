import { db } from '../db';
import { auditLogs } from '../../shared/schema';
import { eq, gte, lte, desc } from 'drizzle-orm';

export interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  accountId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditService {
  
  async logAction(entry: AuditEntry): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        accountId: entry.accountId,
        details: entry.details || {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        severity: entry.severity,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  // User authentication events
  async logLogin(userId: string, accountId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logAction({
      userId,
      action: 'user_login',
      resourceType: 'user',
      resourceId: userId,
      accountId,
      ipAddress,
      userAgent,
      severity: 'low'
    });
  }

  async logLogout(userId: string, accountId: string, ipAddress?: string): Promise<void> {
    await this.logAction({
      userId,
      action: 'user_logout',
      resourceType: 'user',
      resourceId: userId,
      accountId,
      ipAddress,
      severity: 'low'
    });
  }

  async logFailedLogin(email: string, accountId: string, ipAddress?: string): Promise<void> {
    await this.logAction({
      userId: 'anonymous',
      action: 'failed_login',
      resourceType: 'user',
      resourceId: email,
      accountId,
      ipAddress,
      severity: 'medium'
    });
  }

  // Quiz and exam events
  async logQuizCreated(userId: string, quizId: string, accountId: string): Promise<void> {
    await this.logAction({
      userId,
      action: 'quiz_created',
      resourceType: 'quiz',
      resourceId: quizId,
      accountId,
      severity: 'low'
    });
  }

  async logQuizModified(userId: string, quizId: string, accountId: string, changes: Record<string, any>): Promise<void> {
    await this.logAction({
      userId,
      action: 'quiz_modified',
      resourceType: 'quiz',
      resourceId: quizId,
      accountId,
      details: { changes },
      severity: 'low'
    });
  }

  async logQuizDeleted(userId: string, quizId: string, accountId: string): Promise<void> {
    await this.logAction({
      userId,
      action: 'quiz_deleted',
      resourceType: 'quiz',
      resourceId: quizId,
      accountId,
      severity: 'medium'
    });
  }

  async logExamStarted(userId: string, quizId: string, attemptId: string, accountId: string): Promise<void> {
    await this.logAction({
      userId,
      action: 'exam_started',
      resourceType: 'quiz_attempt',
      resourceId: attemptId,
      accountId,
      details: { quizId },
      severity: 'low'
    });
  }

  async logExamSubmitted(userId: string, quizId: string, attemptId: string, accountId: string, score?: number): Promise<void> {
    await this.logAction({
      userId,
      action: 'exam_submitted',
      resourceType: 'quiz_attempt',
      resourceId: attemptId,
      accountId,
      details: { quizId, score },
      severity: 'low'
    });
  }

  async logExamTerminated(userId: string, quizId: string, attemptId: string, accountId: string, reason: string): Promise<void> {
    await this.logAction({
      userId,
      action: 'exam_terminated',
      resourceType: 'quiz_attempt',
      resourceId: attemptId,
      accountId,
      details: { quizId, reason },
      severity: 'high'
    });
  }

  // Proctoring events
  async logProctoringViolation(
    userId: string, 
    quizId: string, 
    accountId: string, 
    violationType: string, 
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'proctoring_violation',
      resourceType: 'quiz_attempt',
      resourceId: quizId,
      accountId,
      details: { violationType, ...details },
      severity
    });
  }

  // Grade and scoring events
  async logGradeModified(
    graderId: string,
    studentId: string, 
    quizId: string, 
    accountId: string,
    oldGrade: number,
    newGrade: number,
    reason?: string
  ): Promise<void> {
    await this.logAction({
      userId: graderId,
      action: 'grade_modified',
      resourceType: 'quiz_attempt',
      resourceId: `${studentId}-${quizId}`,
      accountId,
      details: { studentId, quizId, oldGrade, newGrade, reason },
      severity: 'medium'
    });
  }

  // User management events
  async logUserCreated(creatorId: string, newUserId: string, accountId: string, role: string): Promise<void> {
    await this.logAction({
      userId: creatorId,
      action: 'user_created',
      resourceType: 'user',
      resourceId: newUserId,
      accountId,
      details: { role },
      severity: 'low'
    });
  }

  async logUserRoleChanged(
    adminId: string, 
    targetUserId: string, 
    accountId: string, 
    oldRole: string, 
    newRole: string
  ): Promise<void> {
    await this.logAction({
      userId: adminId,
      action: 'user_role_changed',
      resourceType: 'user',
      resourceId: targetUserId,
      accountId,
      details: { oldRole, newRole },
      severity: 'medium'
    });
  }

  async logUserDeactivated(adminId: string, targetUserId: string, accountId: string): Promise<void> {
    await this.logAction({
      userId: adminId,
      action: 'user_deactivated',
      resourceType: 'user',
      resourceId: targetUserId,
      accountId,
      severity: 'medium'
    });
  }

  // Data access events
  async logDataExport(
    userId: string, 
    accountId: string, 
    exportType: string, 
    resourceIds: string[]
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'data_exported',
      resourceType: 'data',
      resourceId: exportType,
      accountId,
      details: { exportType, resourceIds, count: resourceIds.length },
      severity: 'medium'
    });
  }

  async logDataImport(
    userId: string, 
    accountId: string, 
    importType: string, 
    recordCount: number
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'data_imported',
      resourceType: 'data',
      resourceId: importType,
      accountId,
      details: { importType, recordCount },
      severity: 'medium'
    });
  }

  // System events
  async logSystemError(
    error: Error, 
    userId?: string, 
    accountId?: string, 
    context?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      userId: userId || 'system',
      action: 'system_error',
      resourceType: 'system',
      resourceId: 'error',
      accountId: accountId || 'system',
      details: { 
        message: error.message, 
        stack: error.stack,
        context 
      },
      severity: 'high'
    });
  }

  // Compliance and reporting
  async getAuditTrail(
    accountId: string,
    filters?: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
      severity?: string;
    }
  ): Promise<any[]> {
    let query = db.select().from(auditLogs).where(eq(auditLogs.accountId, accountId));

    if (filters?.userId) {
      query = query.where(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.action) {
      query = query.where(eq(auditLogs.action, filters.action));
    }
    if (filters?.resourceType) {
      query = query.where(eq(auditLogs.resourceType, filters.resourceType));
    }
    if (filters?.severity) {
      query = query.where(eq(auditLogs.severity, filters.severity));
    }
    if (filters?.startDate) {
      query = query.where(gte(auditLogs.timestamp, filters.startDate));
    }
    if (filters?.endDate) {
      query = query.where(lte(auditLogs.timestamp, filters.endDate));
    }

    return await query.orderBy(desc(auditLogs.timestamp)).limit(1000);
  }

  async getSecurityReport(accountId: string, days: number = 30): Promise<{
    summary: Record<string, number>;
    criticalEvents: any[];
    failedLogins: any[];
    violations: any[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const allLogs = await this.getAuditTrail(accountId, { startDate });

    const summary = allLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const criticalEvents = allLogs.filter(log => log.severity === 'critical');
    const failedLogins = allLogs.filter(log => log.action === 'failed_login');
    const violations = allLogs.filter(log => log.action === 'proctoring_violation');

    return {
      summary,
      criticalEvents,
      failedLogins,
      violations
    };
  }
}

export const auditService = new AuditService();