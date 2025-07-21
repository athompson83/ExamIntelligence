import { Request, Response, NextFunction } from 'express';
import { createInsertSchema } from 'drizzle-zod';
import { 
  activityLogs, 
  rollbackHistory, 
  enhancedSecurityEvents, 
  permissionAudits, 
  userActionTracker,
  quizzes,
  questions,
  testbanks,
  users,
  quizAssignments
} from '../shared/schema';
import { eq, and, desc, gte, lte, gt } from 'drizzle-orm';

export class ComprehensiveLogger {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Log all user activities
  async logActivity({
    userId,
    accountId,
    action,
    resource,
    resourceId,
    pageUrl,
    pageTitle,
    clickTarget,
    elementType,
    ipAddress,
    userAgent,
    sessionId,
    beforeData,
    afterData,
    changesSummary,
    responseTime,
    statusCode,
    errorMessage,
    securityLevel = 'low'
  }: {
    userId: string;
    accountId: string;
    action: string;
    resource: string;
    resourceId?: string;
    pageUrl?: string;
    pageTitle?: string;
    clickTarget?: string;
    elementType?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    beforeData?: any;
    afterData?: any;
    changesSummary?: string;
    responseTime?: number;
    statusCode?: number;
    errorMessage?: string;
    securityLevel?: 'low' | 'medium' | 'high' | 'critical';
  }) {
    try {
      await this.db.insert(activityLogs).values({
        userId,
        accountId,
        action,
        resource,
        resourceId,
        pageUrl,
        pageTitle,
        clickTarget,
        elementType,
        ipAddress,
        userAgent,
        sessionId,
        beforeData,
        afterData,
        changesSummary,
        responseTime,
        statusCode,
        errorMessage,
        securityLevel,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Enhanced rollback point creation with comprehensive state management
  async createRollbackPoint({
    userId,
    accountId,
    operationType,
    resourceType,
    resourceId,
    previousState,
    currentState,
    rollbackDescription,
    expiresAt,
    dependencies = [],
    priority = 'medium'
  }: {
    userId: string;
    accountId: string;
    operationType: 'quiz_edit' | 'question_edit' | 'testbank_edit' | 'user_edit' | 'assignment_edit' | 'delete' | 'bulk_update';
    resourceType: 'quiz' | 'question' | 'testbank' | 'user' | 'assignment';
    resourceId: string;
    previousState: any;
    currentState: any;
    rollbackDescription: string;
    expiresAt?: Date;
    dependencies?: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }) {
    try {
      const expiry = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      const crypto = require('crypto');
      
      // Generate security hash for data integrity
      const dataHash = crypto.createHash('sha256')
        .update(JSON.stringify({ previousState, currentState }))
        .digest('hex');
      
      const rollbackPoint = await this.db.insert(rollbackHistory).values({
        userId,
        accountId,
        operationType,
        resourceType,
        resourceId,
        previousState: {
          ...previousState,
          _metadata: {
            timestamp: new Date().toISOString(),
            dependencies,
            dataHash,
            schemaVersion: '2.0'
          }
        },
        currentState: {
          ...currentState,
          _metadata: {
            timestamp: new Date().toISOString(),
            dataHash,
            schemaVersion: '2.0'
          }
        },
        rollbackDescription,
        expiresAt: expiry,
      }).returning();

      // Log rollback point creation for audit trail
      await this.logActivity({
        userId,
        accountId,
        action: 'rollback_point_created',
        resource: 'system',
        resourceId: rollbackPoint[0].id,
        securityLevel: priority as any,
        changesSummary: `Rollback point created for ${resourceType}:${resourceId}`,
        metadata: { dependencies, priority, dataHash }
      });

      return rollbackPoint[0];
    } catch (error) {
      console.error('Failed to create rollback point:', error);
      throw error;
    }
  }

  // Execute rollback operation
  async executeRollback(rollbackId: string, executedByUserId: string): Promise<boolean> {
    try {
      const rollback = await this.db.query.rollbackHistory.findFirst({
        where: eq(rollbackHistory.id, rollbackId)
      });

      if (!rollback || rollback.executedAt) {
        throw new Error('Rollback point not found or already executed');
      }

      const { resourceType, resourceId, previousState } = rollback;
      const crypto = require('crypto');

      // Verify data integrity
      const expectedHash = previousState._metadata?.dataHash;
      const currentHash = crypto.createHash('sha256')
        .update(JSON.stringify(previousState))
        .digest('hex');

      if (expectedHash && expectedHash !== currentHash) {
        throw new Error('Data integrity check failed - rollback aborted');
      }

      // Execute rollback based on resource type
      let success = false;
      switch (resourceType) {
        case 'quiz':
          success = await this.rollbackQuiz(resourceId, previousState);
          break;
        case 'question':
          success = await this.rollbackQuestion(resourceId, previousState);
          break;
        case 'testbank':
          success = await this.rollbackTestbank(resourceId, previousState);
          break;
        case 'user':
          success = await this.rollbackUser(resourceId, previousState);
          break;
        case 'assignment':
          success = await this.rollbackAssignment(resourceId, previousState);
          break;
        default:
          throw new Error(`Unsupported resource type: ${resourceType}`);
      }

      if (success) {
        // Mark rollback as executed
        await this.db.update(rollbackHistory)
          .set({ 
            executedAt: new Date(),
            executedByUserId,
            status: 'completed'
          })
          .where(eq(rollbackHistory.id, rollbackId));

        // Log successful rollback
        await this.logActivity({
          userId: executedByUserId,
          accountId: rollback.accountId,
          action: 'rollback_executed',
          resource: resourceType,
          resourceId,
          securityLevel: 'high',
          changesSummary: `Successfully rolled back ${resourceType}:${resourceId}`
        });
      }

      return success;
    } catch (error) {
      console.error('Rollback execution failed:', error);
      
      // Log failed rollback attempt
      await this.logSecurityEvent({
        userId: executedByUserId,
        eventType: 'suspicious_activity',
        severity: 'high',
        description: `Failed rollback attempt: ${error.message}`,
        blocked: true
      });
      
      throw error;
    }
  }

  // Rollback implementations for different resource types
  private async rollbackQuiz(quizId: string, previousState: any): Promise<boolean> {
    try {
      await this.db.update(quizzes)
        .set(previousState)
        .where(eq(quizzes.id, quizId));
      return true;
    } catch (error) {
      console.error('Quiz rollback failed:', error);
      return false;
    }
  }

  private async rollbackQuestion(questionId: string, previousState: any): Promise<boolean> {
    try {
      await this.db.update(questions)
        .set(previousState)
        .where(eq(questions.id, questionId));
      return true;
    } catch (error) {
      console.error('Question rollback failed:', error);
      return false;
    }
  }

  private async rollbackTestbank(testbankId: string, previousState: any): Promise<boolean> {
    try {
      await this.db.update(testbanks)
        .set(previousState)
        .where(eq(testbanks.id, testbankId));
      return true;
    } catch (error) {
      console.error('Testbank rollback failed:', error);
      return false;
    }
  }

  private async rollbackUser(userId: string, previousState: any): Promise<boolean> {
    try {
      await this.db.update(users)
        .set(previousState)
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error('User rollback failed:', error);
      return false;
    }
  }

  private async rollbackAssignment(assignmentId: string, previousState: any): Promise<boolean> {
    try {
      await this.db.update(quizAssignments)
        .set(previousState)
        .where(eq(quizAssignments.id, assignmentId));
      return true;
    } catch (error) {
      console.error('Assignment rollback failed:', error);
      return false;
    }
  }

  // Enhanced security event logging with threat intelligence
  async logSecurityEvent({
    userId,
    accountId,
    eventType,
    severity,
    description,
    ipAddress,
    userAgent,
    requestUrl,
    requestMethod,
    blocked = false,
    mitigationAction,
    threatIndicators = {},
    geoLocation
  }: {
    userId?: string;
    accountId?: string;
    eventType: 'unauthorized_access' | 'privilege_escalation' | 'data_breach_attempt' | 'suspicious_activity' | 'brute_force' | 'session_hijack' | 'malware_detected' | 'ddos_attempt';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ipAddress?: string;
    userAgent?: string;
    requestUrl?: string;
    requestMethod?: string;
    blocked?: boolean;
    mitigationAction?: string;
    threatIndicators?: any;
    geoLocation?: string;
  }) {
    try {
      // Enhanced threat analysis
      const riskScore = this.calculateRiskScore({
        eventType,
        severity,
        threatIndicators,
        ipAddress,
        userAgent
      });

      // Check for patterns indicating coordinated attacks
      const isCoordinatedAttack = await this.detectCoordinatedAttack(ipAddress, eventType);

      const securityEvent = await this.db.insert(enhancedSecurityEvents).values({
        userId,
        accountId,
        eventType,
        severity,
        description: `${description} | Risk Score: ${riskScore}${isCoordinatedAttack ? ' | COORDINATED ATTACK DETECTED' : ''}`,
        ipAddress,
        userAgent,
        requestUrl,
        requestMethod,
        blocked: blocked || (riskScore > 80), // Auto-block high-risk events
        mitigationAction: mitigationAction || (riskScore > 80 ? 'AUTOMATIC_BLOCK' : 'MONITOR'),
        metadata: {
          riskScore,
          threatIndicators,
          geoLocation,
          isCoordinatedAttack,
          analysisTimestamp: new Date().toISOString()
        }
      }).returning();

      // Trigger automatic incident response for critical events
      if (severity === 'critical' || riskScore > 90) {
        await this.triggerIncidentResponse(securityEvent[0]);
      }

      return securityEvent[0];
    } catch (error) {
      console.error('Failed to log security event:', error);
      throw error;
    }
  }

  // Calculate threat risk score
  private calculateRiskScore({
    eventType,
    severity,
    threatIndicators,
    ipAddress,
    userAgent
  }: any): number {
    let score = 0;

    // Base score from event type
    const eventScores = {
      'unauthorized_access': 30,
      'privilege_escalation': 50,
      'data_breach_attempt': 70,
      'suspicious_activity': 20,
      'brute_force': 40,
      'session_hijack': 60,
      'malware_detected': 80,
      'ddos_attempt': 90
    };
    score += eventScores[eventType] || 10;

    // Severity multiplier
    const severityMultipliers = { low: 1, medium: 1.5, high: 2, critical: 3 };
    score *= severityMultipliers[severity] || 1;

    // Threat indicators
    if (threatIndicators.knownMaliciousIP) score += 30;
    if (threatIndicators.suspiciousUserAgent) score += 20;
    if (threatIndicators.rapidRequests) score += 25;
    if (threatIndicators.anomalousLocation) score += 15;

    return Math.min(100, Math.round(score));
  }

  // Detect coordinated attacks
  private async detectCoordinatedAttack(ipAddress: string, eventType: string): Promise<boolean> {
    if (!ipAddress) return false;

    try {
      const recentEvents = await this.db.query.enhancedSecurityEvents.findMany({
        where: and(
          eq(enhancedSecurityEvents.ipAddress, ipAddress),
          gte(enhancedSecurityEvents.createdAt, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
        )
      });

      // Consider it coordinated if >5 security events from same IP in the last hour
      return recentEvents.length > 5;
    } catch (error) {
      console.error('Error detecting coordinated attack:', error);
      return false;
    }
  }

  // Trigger incident response
  private async triggerIncidentResponse(securityEvent: any): Promise<void> {
    try {
      // Log incident response activation
      await this.logActivity({
        userId: 'system',
        accountId: securityEvent.accountId || 'system',
        action: 'incident_response_triggered',
        resource: 'security',
        resourceId: securityEvent.id,
        securityLevel: 'critical',
        changesSummary: `Automatic incident response triggered for ${securityEvent.eventType}`
      });

      // Here you could integrate with external security tools:
      // - Send alerts to security team
      // - Update firewall rules
      // - Trigger automated response scripts
      console.log(`🚨 INCIDENT RESPONSE TRIGGERED: ${securityEvent.eventType} - Event ID: ${securityEvent.id}`);
    } catch (error) {
      console.error('Failed to trigger incident response:', error);
    }
  }

  // Log permission audits
  async logPermissionAudit({
    userId,
    accountId,
    requestedPermission,
    resource,
    resourceId,
    granted,
    denialReason,
    userRole,
    requiredRole,
    requestContext
  }: {
    userId: string;
    accountId: string;
    requestedPermission: string;
    resource: string;
    resourceId?: string;
    granted: boolean;
    denialReason?: string;
    userRole: string;
    requiredRole?: string;
    requestContext?: any;
  }) {
    try {
      await this.db.insert(permissionAudits).values({
        userId,
        accountId,
        requestedPermission,
        resource,
        resourceId,
        granted,
        denialReason,
        userRole,
        requiredRole,
        requestContext,
      });
    } catch (error) {
      console.error('Failed to log permission audit:', error);
    }
  }

  // Log user actions and interactions
  async logUserAction({
    userId,
    sessionId,
    actionType,
    targetElement,
    currentPage,
    referrerPage,
    coordinates,
    deviceType,
    browserInfo,
    loadTime,
    interactionTime
  }: {
    userId: string;
    sessionId: string;
    actionType: 'page_view' | 'button_click' | 'form_submit' | 'download' | 'upload' | 'search' | 'filter' | 'sort';
    targetElement?: string;
    currentPage: string;
    referrerPage?: string;
    coordinates?: { x: number; y: number };
    deviceType?: 'desktop' | 'tablet' | 'mobile';
    browserInfo?: any;
    loadTime?: number;
    interactionTime?: number;
  }) {
    try {
      await this.db.insert(userActionTracker).values({
        userId,
        sessionId,
        actionType,
        targetElement,
        currentPage,
        referrerPage,
        coordinates,
        deviceType,
        browserInfo,
        loadTime,
        interactionTime,
      });
    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }
}

// Express middleware for comprehensive logging
export function createLoggingMiddleware(db: any) {
  const logger = new ComprehensiveLogger(db);

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Capture request details
    const requestData = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      sessionId: (req.session as any)?.id,
      userId: (req as any).user?.id,
      accountId: (req as any).user?.accountId,
    };

    // Override res.send to capture response details
    res.send = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      // Log the activity
      if (requestData.userId && requestData.accountId) {
        logger.logActivity({
          userId: requestData.userId,
          accountId: requestData.accountId,
          action: getActionFromMethod(req.method),
          resource: getResourceFromUrl(req.url),
          pageUrl: req.url,
          ipAddress: requestData.ipAddress,
          userAgent: requestData.userAgent,
          sessionId: requestData.sessionId,
          responseTime,
          statusCode: res.statusCode,
          securityLevel: getSecurityLevel(req.url, req.method),
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

// Utility functions
function getActionFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return 'view';
    case 'POST': return 'create';
    case 'PUT': 
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    default: return 'unknown';
  }
}

function getResourceFromUrl(url: string): string {
  const segments = url.split('/').filter(Boolean);
  if (segments.length > 1 && segments[0] === 'api') {
    return segments[1] || 'unknown';
  }
  return segments[0] || 'unknown';
}

function getSecurityLevel(url: string, method: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalPaths = ['/api/users', '/api/auth', '/api/admin'];
  const highPaths = ['/api/testbanks', '/api/quizzes'];
  
  if (criticalPaths.some(path => url.startsWith(path))) {
    return 'critical';
  }
  if (highPaths.some(path => url.startsWith(path))) {
    return 'high';
  }
  if (method === 'DELETE') {
    return 'high';
  }
  return 'low';
}

// Role-based security middleware
export function createSecurityMiddleware(db: any) {
  const logger = new ComprehensiveLogger(db);

  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const requestedResource = getResourceFromUrl(req.url);
    
    if (!user) {
      await logger.logSecurityEvent({
        eventType: 'unauthorized_access',
        severity: 'high',
        description: `Unauthenticated access attempt to ${req.url}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestUrl: req.url,
        requestMethod: req.method,
        blocked: true,
      });
      
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check role-based permissions
    const hasPermission = await checkPermissions(user, requestedResource, req.method);
    
    await logger.logPermissionAudit({
      userId: user.id,
      accountId: user.accountId,
      requestedPermission: `${req.method}_${requestedResource}`,
      resource: requestedResource,
      granted: hasPermission,
      denialReason: hasPermission ? undefined : 'insufficient_role',
      userRole: user.role,
      requestContext: { url: req.url, method: req.method },
    });

    if (!hasPermission) {
      await logger.logSecurityEvent({
        userId: user.id,
        accountId: user.accountId,
        eventType: 'privilege_escalation',
        severity: 'medium',
        description: `User ${user.role} attempted to access ${req.url} without permission`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestUrl: req.url,
        requestMethod: req.method,
        blocked: true,
      });
      
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Permission checking logic
async function checkPermissions(user: any, resource: string, method: string): Promise<boolean> {
  const userRole = user.role;
  
  // Super admin has access to everything
  if (userRole === 'super_admin') {
    return true;
  }
  
  // Students have restricted access
  if (userRole === 'student') {
    // Students can only view their own data and take quizzes
    const allowedResources = ['quizzes', 'study-aids', 'notifications', 'mobile'];
    if (!allowedResources.includes(resource)) {
      return false;
    }
    
    // Students cannot delete or modify most resources
    if (method === 'DELETE' && resource !== 'study-aids') {
      return false;
    }
    
    return true;
  }
  
  // Teachers can manage educational content
  if (userRole === 'teacher') {
    const restrictedResources = ['users', 'accounts', 'admin'];
    return !restrictedResources.includes(resource);
  }
  
  // Admins can manage users and content within their account
  if (userRole === 'admin') {
    const restrictedResources = ['super-admin'];
    return !restrictedResources.includes(resource);
  }
  
  return false;
}

export { ComprehensiveLogger };