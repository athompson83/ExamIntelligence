import { Router } from 'express';
import { requireSuperAdmin, requireAdmin } from '../permissions';
import { storage } from '../storage-simple';
import { initializeStripe, getStripe } from '../stripe';

const router = Router();

/**
 * Get all system settings (Super Admin only)
 */
router.get('/system-settings', requireSuperAdmin, async (req, res) => {
  try {
    const settings = await storage.getAllSystemSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('System settings fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch system settings' 
    });
  }
});

/**
 * Update system setting (Super Admin only)
 */
router.put('/system-settings', requireSuperAdmin, async (req, res) => {
  try {
    const { key, value, isSecret, description } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Setting key is required' });
    }

    const setting = await storage.updateSystemSetting({
      key,
      value: value || '',
      isSecret: !!isSecret,
      description: description || '',
      updatedBy: req.user!.id,
    });

    // If updating Stripe settings, reinitialize Stripe
    if (key === 'STRIPE_SECRET_KEY') {
      await initializeStripe();
    }

    res.json(setting);
  } catch (error: any) {
    console.error('System setting update error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update system setting' 
    });
  }
});

/**
 * Test Stripe connection (Super Admin only)
 */
router.post('/test-stripe', requireSuperAdmin, async (req, res) => {
  try {
    const stripe = getStripe();
    
    // Test Stripe connection by retrieving account info
    const account = await stripe.accounts.retrieve();
    
    res.json({
      success: true,
      accountId: account.id,
      country: account.country,
      currency: account.default_currency,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error: any) {
    console.error('Stripe test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Stripe connection test failed' 
    });
  }
});

/**
 * Get system health and status (Admin+)
 */
router.get('/system-health', requireAdmin, async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        type: 'PostgreSQL',
      },
      stripe: {
        configured: false,
        connected: false,
      },
      features: {
        billing: false,
        subscriptions: false,
        webhooks: false,
      },
    };

    // Test database connection
    try {
      await storage.getAccountCount();
      health.database.status = 'connected';
    } catch (error) {
      health.database.status = 'error';
    }

    // Test Stripe configuration
    try {
      const stripeSecret = await storage.getSystemSetting('STRIPE_SECRET_KEY');
      health.stripe.configured = !!stripeSecret;
      
      if (stripeSecret) {
        const stripe = getStripe();
        await stripe.accounts.retrieve();
        health.stripe.connected = true;
        health.features.billing = true;
        health.features.subscriptions = true;
        
        const webhookSecret = await storage.getSystemSetting('STRIPE_WEBHOOK_SECRET');
        health.features.webhooks = !!webhookSecret;
      }
    } catch (error) {
      // Stripe not properly configured
    }

    res.json(health);
  } catch (error: any) {
    console.error('System health check error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to check system health' 
    });
  }
});

/**
 * Get platform statistics (Admin+)
 */
router.get('/platform-stats', requireAdmin, async (req, res) => {
  try {
    const stats = await storage.getPlatformStatistics();
    res.json(stats);
  } catch (error: any) {
    console.error('Platform stats error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch platform statistics' 
    });
  }
});

/**
 * Get user management data (Admin+)
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, accountId } = req.query;
    
    const users = await storage.getUsers({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      role: role as string,
      accountId: accountId as string,
    });
    
    res.json(users);
  } catch (error: any) {
    console.error('Users fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch users' 
    });
  }
});

/**
 * Update user role (Admin+)
 */
router.put('/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'teacher', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Only super admins can assign super_admin role
    if (role === 'super_admin' && req.user!.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can assign super admin role' });
    }

    const user = await storage.updateUserRole(userId, role);
    res.json(user);
  } catch (error: any) {
    console.error('User role update error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update user role' 
    });
  }
});

/**
 * Get account management data (Admin+)
 */
router.get('/accounts', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, tier } = req.query;
    
    const accounts = await storage.getAccounts({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      tier: tier as string,
    });
    
    res.json(accounts);
  } catch (error: any) {
    console.error('Accounts fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch accounts' 
    });
  }
});

/**
 * Update account subscription tier (Super Admin only)
 */
router.put('/accounts/:accountId/subscription', requireSuperAdmin, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { tier, billingCycle } = req.body;

    if (!['starter', 'basic', 'professional', 'institutional', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const account = await storage.updateAccountSubscription(accountId, {
      subscriptionTier: tier,
      billingCycle: billingCycle || 'monthly',
    });

    res.json(account);
  } catch (error: any) {
    console.error('Account subscription update error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update account subscription' 
    });
  }
});

/**
 * Get audit logs (Super Admin only)
 */
router.get('/audit-logs', requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, action, userId, startDate, endDate } = req.query;
    
    const logs = await storage.getAuditLogs({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      action: action as string,
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    
    res.json(logs);
  } catch (error: any) {
    console.error('Audit logs fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch audit logs' 
    });
  }
});

export default router;