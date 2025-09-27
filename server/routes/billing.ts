import { Router } from 'express';
import { requireFeature, checkQuota, requireAdmin, requireSuperAdmin } from '../permissions';
import { isAuthenticated } from '../replitAuth';
import { validateBody } from '../validation';
import { z } from 'zod';
import { 
  createCheckoutSession, 
  createBillingPortalSession, 
  handleWebhook,
  cancelSubscription,
  reactivateSubscription,
  initializeStripe
} from '../stripe';
import { storage } from '../storage-simple';
import { getFeaturePermissions } from '@shared/pricing';

const router = Router();

// Initialize Stripe on router load
initializeStripe();

// Validation schemas
const checkoutSessionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  isUpgrade: z.boolean().optional().default(false),
});

const webhookSchema = z.object({
  type: z.string(),
  data: z.object({}),
});

/**
 * Create Stripe checkout session for new subscription or upgrade
 */
router.post('/create-checkout-session', isAuthenticated, validateBody(checkoutSessionSchema), async (req, res) => {
  try {
    if (!req.user?.accountId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { priceId, isUpgrade } = req.body;

    const result = await createCheckoutSession(req.user.accountId, priceId, isUpgrade);
    res.json(result);
  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create checkout session' 
    });
  }
});

/**
 * Create billing portal session for subscription management
 */
router.post('/update-payment-method', isAuthenticated, async (req, res) => {
  try {
    if (!req.user?.accountId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await createBillingPortalSession(req.user.accountId);
    res.json(result);
  } catch (error: any) {
    console.error('Billing portal creation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create billing portal session' 
    });
  }
});

/**
 * Get current subscription and billing information
 */
router.get('/subscription', isAuthenticated, async (req, res) => {
  try {
    if (!req.user?.accountId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const account = await storage.getAccountById(req.user.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const subscription = await storage.getSubscriptionByAccountId(req.user.accountId);
    const permissions = getFeaturePermissions(account.subscriptionTier as any);

    const response = {
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        tier: subscription.tier,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripePriceId: subscription.stripePriceId,
      } : null,
      account: {
        subscriptionTier: account.subscriptionTier,
        currentSeatCount: account.currentSeatCount,
        monthlyAiGenerated: account.monthlyAiGenerated,
        monthlyAiValidations: account.monthlyAiValidations,
        monthlyProctoringHours: account.monthlyProctoringHours,
      },
      usage: {
        aiQuestionsUsed: account.monthlyAiGenerated || 0,
        aiQuestionsLimit: permissions.aiGenerateQuotaPerMonth,
        aiValidationsUsed: account.monthlyAiValidations || 0,
        aiValidationsLimit: permissions.aiValidationQuotaPerMonth,
        proctoringHoursUsed: account.monthlyProctoringHours || 0,
        proctoringHoursLimit: permissions.proctoringSessionsPerMonth,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch subscription' 
    });
  }
});

/**
 * Get invoice history
 */
router.get('/invoices', isAuthenticated, async (req, res) => {
  try {
    if (!req.user?.accountId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const invoices = await storage.getInvoicesByAccountId(req.user.accountId);
    res.json(invoices);
  } catch (error: any) {
    console.error('Invoice fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch invoices' 
    });
  }
});

/**
 * Cancel subscription at period end
 */
router.post('/cancel-subscription', isAuthenticated, async (req, res) => {
  try {
    if (!req.user?.accountId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await cancelSubscription(req.user.accountId);
    res.json({ success: true, message: 'Subscription will be canceled at the end of the current period' });
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to cancel subscription' 
    });
  }
});

/**
 * Reactivate canceled subscription
 */
router.post('/reactivate-subscription', isAuthenticated, async (req, res) => {
  try {
    if (!req.user?.accountId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await reactivateSubscription(req.user.accountId);
    res.json({ success: true, message: 'Subscription has been reactivated' });
  } catch (error: any) {
    console.error('Subscription reactivation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to reactivate subscription' 
    });
  }
});

/**
 * Stripe webhook endpoint
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    // For webhooks, we need the raw body, not parsed JSON
    const body = req.body;
    
    await handleWebhook(body, signature);
    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handling error:', error);
    res.status(400).json({ 
      error: error.message || 'Webhook handling failed' 
    });
  }
});

/**
 * Admin: Get all subscriptions (Super Admin only)
 */
router.get('/admin/subscriptions', requireSuperAdmin, async (req, res) => {
  try {
    const subscriptions = await storage.getAllSubscriptions();
    res.json(subscriptions);
  } catch (error: any) {
    console.error('Admin subscriptions fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch subscriptions' 
    });
  }
});

/**
 * Admin: Get billing analytics (Super Admin only)
 */
router.get('/admin/analytics', requireSuperAdmin, async (req, res) => {
  try {
    const analytics = await storage.getBillingAnalytics();
    res.json(analytics);
  } catch (error: any) {
    console.error('Billing analytics fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch billing analytics' 
    });
  }
});

export default router;