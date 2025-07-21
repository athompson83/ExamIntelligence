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

  // Create rollback point for critical operations
  async createRollbackPoint({
    userId,
    accountId,
    operationType,
    resourceType,
    resourceId,
    previousState,
    currentState,
    rollbackDescription,
    expiresAt
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
  }) {
    try {
      const expiry = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      
      await this.db.insert(rollbackHistory).values({
        userId,
        accountId,
        operationType,
        resourceType,
        resourceId,
        previousState,
        currentState,
        rollbackDescription,
        expiresAt: expiry,
      });
    } catch (error) {
      console.error('Failed to create rollback point:', error);
    }
  }

  // Log security events
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
    mitigationAction
  }: {
    userId?: string;
    accountId?: string;
    eventType: 'unauthorized_access' | 'privilege_escalation' | 'data_breach_attempt' | 'suspicious_activity' | 'brute_force' | 'session_hijack';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ipAddress?: string;
    userAgent?: string;
    requestUrl?: string;
    requestMethod?: string;
    blocked?: boolean;
    mitigationAction?: string;
  }) {
    try {
      await this.db.insert(enhancedSecurityEvents).values({
        userId,
        accountId,
        eventType,
        severity,
        description,
        ipAddress,
        userAgent,
        requestUrl,
        requestMethod,
        blocked,
        mitigationAction,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
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