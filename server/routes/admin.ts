import { Router } from 'express';
import { storage } from '../storage-simple';
import { requireAuth, requireRole } from '../middleware';

const router = Router();

// Activity Logs
router.get('/activity-logs/:userId?', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, resource, securityLevel, startDate, endDate, limit } = req.query;
    const accountId = (req as any).user.accountId;

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (action && action !== 'all') filters.action = action;
    if (resource && resource !== 'all') filters.resource = resource;
    if (securityLevel && securityLevel !== 'all') filters.securityLevel = securityLevel;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);

    const logs = await storage.getActivityLogs(accountId, filters);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Rollback History
router.get('/rollback-history/:userId?', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { resourceType, resourceId } = req.query;
    const accountId = (req as any).user.accountId;

    const history = await storage.getRollbackHistory(
      accountId,
      resourceType as string,
      resourceId as string
    );
    
    // Filter by user if specified
    const filteredHistory = userId 
      ? history.filter((h: any) => h.userId === userId)
      : history;

    res.json(filteredHistory);
  } catch (error) {
    console.error('Error fetching rollback history:', error);
    res.status(500).json({ error: 'Failed to fetch rollback history' });
  }
});

// Execute Rollback
router.post('/execute-rollback/:rollbackId', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { rollbackId } = req.params;
    const performedBy = (req as any).user.id;

    const result = await storage.executeRollback(rollbackId, performedBy);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error executing rollback:', error);
    res.status(500).json({ error: 'Failed to execute rollback' });
  }
});

// Security Events
router.get('/security-events/:userId?', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { severity, eventType, investigated, startDate, endDate, limit } = req.query;
    const accountId = (req as any).user.accountId;

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (severity && severity !== 'all') filters.severity = severity;
    if (eventType && eventType !== 'all') filters.eventType = eventType;
    if (investigated !== undefined) filters.investigated = investigated === 'true';
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);

    const events = await storage.getSecurityEvents(accountId, filters);
    res.json(events);
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Mark Security Event as Investigated
router.post('/security-events/:eventId/investigate', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { notes } = req.body;
    const investigatedBy = (req as any).user.id;

    await storage.markSecurityEventInvestigated(eventId, investigatedBy, notes);
    res.json({ message: 'Security event marked as investigated' });
  } catch (error) {
    console.error('Error marking security event investigated:', error);
    res.status(500).json({ error: 'Failed to mark security event as investigated' });
  }
});

// Permission Audits
router.get('/permission-audits/:userId?', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { resource, granted, startDate, endDate, limit } = req.query;
    const accountId = (req as any).user.accountId;

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (resource && resource !== 'all') filters.resource = resource;
    if (granted !== undefined) filters.granted = granted === 'true';
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);

    const audits = await storage.getPermissionAudits(accountId, filters);
    res.json(audits);
  } catch (error) {
    console.error('Error fetching permission audits:', error);
    res.status(500).json({ error: 'Failed to fetch permission audits' });
  }
});

// User Activity Summary
router.get('/user-activity-summary/:userId', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;
    const accountId = (req as any).user.accountId;

    const summary = await storage.getUserActivitySummary(
      userId,
      accountId,
      days ? parseInt(days as string) : 30
    );
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching user activity summary:', error);
    res.status(500).json({ error: 'Failed to fetch user activity summary' });
  }
});

// User Actions
router.get('/user-actions/:userId', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { actionType, currentPage, startDate, endDate, limit } = req.query;

    const filters: any = {};
    if (actionType && actionType !== 'all') filters.actionType = actionType;
    if (currentPage) filters.currentPage = currentPage;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);

    const actions = await storage.getUserActions(userId, filters);
    res.json(actions);
  } catch (error) {
    console.error('Error fetching user actions:', error);
    res.status(500).json({ error: 'Failed to fetch user actions' });
  }
});

export default router;