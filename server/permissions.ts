import { Request, Response, NextFunction } from 'express';
import { getFeaturePermissions, canUserAccessFeature, getUserQuotaLimit, SubscriptionTier } from '@shared/pricing';
import { storage } from './storage-simple';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        role: string;
        accountId?: string;
        subscriptionTier?: SubscriptionTier;
      };
    }
  }
}

export interface PermissionError extends Error {
  statusCode: number;
  feature?: string;
  requiredTier?: string;
}

/**
 * Middleware to check if user has access to a specific feature
 */
export function requireFeature(feature: keyof typeof import('@shared/pricing').PRICING_PLANS[0]['features']) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.accountId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Get user's account and subscription tier
      const account = await storage.getAccountById(req.user.accountId);
      if (!account) {
        return res.status(403).json({ 
          error: 'Account not found',
          code: 'ACCOUNT_NOT_FOUND'
        });
      }

      const userTier = account.subscriptionTier as SubscriptionTier;
      const hasAccess = canUserAccessFeature(userTier, feature);

      if (!hasAccess) {
        const permissions = getFeaturePermissions(userTier);
        return res.status(403).json({
          error: `Feature '${feature}' not available in ${userTier} plan`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature,
          currentTier: userTier,
          upgradeRequired: true,
          availableIn: getSuggestedUpgradeTier(feature)
        });
      }

      // Add permissions to request for quota checking
      req.user.subscriptionTier = userTier;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_FAILED'
      });
    }
  };
}

/**
 * Middleware to check quota limits for usage-based features
 */
export function checkQuota(quotaType: 'aiGenerateQuotaPerMonth' | 'aiValidationQuotaPerMonth' | 'maxActiveQuizzes' | 'testBankQuestionLimit') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.accountId || !req.user.subscriptionTier) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const account = await storage.getAccountById(req.user.accountId);
      if (!account) {
        return res.status(403).json({ 
          error: 'Account not found',
          code: 'ACCOUNT_NOT_FOUND'
        });
      }

      const userTier = req.user.subscriptionTier;
      const limit = getUserQuotaLimit(userTier, quotaType);

      if (limit === "unlimited") {
        next();
        return;
      }

      // Check current usage against limit
      let currentUsage = 0;
      switch (quotaType) {
        case 'aiGenerateQuotaPerMonth':
          currentUsage = account.monthlyAiGenerated || 0;
          break;
        case 'aiValidationQuotaPerMonth':
          currentUsage = account.monthlyAiValidations || 0;
          break;
        case 'maxActiveQuizzes':
          // This requires a separate count query - implement based on your quiz storage
          currentUsage = await storage.getActiveQuizCount(req.user.accountId);
          break;
        case 'testBankQuestionLimit':
          currentUsage = await storage.getTotalQuestionCount(req.user.accountId);
          break;
      }

      if (currentUsage >= limit) {
        return res.status(429).json({
          error: `${quotaType} limit exceeded`,
          code: 'QUOTA_EXCEEDED',
          quota: quotaType,
          currentUsage,
          limit,
          currentTier: userTier,
          upgradeRequired: true,
          availableIn: getSuggestedUpgradeTier(quotaType)
        });
      }

      next();
    } catch (error) {
      console.error('Quota check error:', error);
      res.status(500).json({ 
        error: 'Quota check failed',
        code: 'QUOTA_CHECK_FAILED'
      });
    }
  };
}

/**
 * Middleware for super admin only access
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
}

/**
 * Middleware for admin or super admin access
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
}

/**
 * Get the suggested upgrade tier for a feature
 */
function getSuggestedUpgradeTier(feature: string): string {
  // Map features to their minimum required tiers
  const featureTierMap: Record<string, string> = {
    'canUseCAT': 'professional',
    'canUseProctoring': 'professional',
    'canUseLTI': 'professional',
    'advancedAnalytics': 'professional',
    'aiValidationQuotaPerMonth': 'basic',
    'canImportCSV': 'basic',
    'canExportCSV': 'basic',
    'cohortManagement': 'institutional',
    'ssoIntegration': 'enterprise',
    'whiteLabel': 'enterprise',
    'onPremDeployment': 'enterprise'
  };

  return featureTierMap[feature] || 'basic';
}

/**
 * Usage tracking helpers
 */
export async function incrementUsage(accountId: string, usageType: 'aiGenerated' | 'aiValidations' | 'proctoringHours') {
  try {
    await storage.incrementAccountUsage(accountId, usageType);
  } catch (error) {
    console.error('Failed to increment usage:', error);
    // Don't fail the request if usage tracking fails
  }
}

/**
 * Permission checking utility for frontend
 */
export function getUserPermissions(tier: SubscriptionTier) {
  return getFeaturePermissions(tier);
}

/**
 * Check if user can perform action based on current usage
 */
export async function canPerformAction(
  accountId: string, 
  tier: SubscriptionTier, 
  action: 'generateQuestion' | 'validateQuestion' | 'createQuiz' | 'addToBankQuestions'
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
  try {
    const account = await storage.getAccountById(accountId);
    if (!account) {
      return { allowed: false, reason: 'Account not found' };
    }

    const permissions = getFeaturePermissions(tier);

    switch (action) {
      case 'generateQuestion':
        if (!permissions.canCreateQuiz) {
          return { allowed: false, reason: 'Quiz creation not available in current plan', upgradeRequired: true };
        }
        
        const aiGenLimit = permissions.aiGenerateQuotaPerMonth;
        if (aiGenLimit === "unlimited") {
          return { allowed: true };
        }
        
        const currentAiGen = account.monthlyAiGenerated || 0;
        if (currentAiGen >= aiGenLimit) {
          return { 
            allowed: false, 
            reason: `Monthly AI generation limit of ${aiGenLimit} exceeded`, 
            upgradeRequired: true 
          };
        }
        break;

      case 'validateQuestion':
        const validationLimit = permissions.aiValidationQuotaPerMonth;
        if (validationLimit === "unlimited") {
          return { allowed: true };
        }
        
        if (validationLimit === 0) {
          return { 
            allowed: false, 
            reason: 'AI validation not available in current plan', 
            upgradeRequired: true 
          };
        }
        
        const currentValidations = account.monthlyAiValidations || 0;
        if (currentValidations >= validationLimit) {
          return { 
            allowed: false, 
            reason: `Monthly AI validation limit of ${validationLimit} exceeded`, 
            upgradeRequired: true 
          };
        }
        break;

      case 'createQuiz':
        if (!permissions.canCreateQuiz) {
          return { allowed: false, reason: 'Quiz creation not available in current plan', upgradeRequired: true };
        }
        
        const maxQuizzes = permissions.maxActiveQuizzes;
        if (maxQuizzes === "unlimited") {
          return { allowed: true };
        }
        
        const activeQuizzes = await storage.getActiveQuizCount(accountId);
        if (activeQuizzes >= maxQuizzes) {
          return { 
            allowed: false, 
            reason: `Maximum active quiz limit of ${maxQuizzes} reached`, 
            upgradeRequired: true 
          };
        }
        break;

      case 'addToBankQuestions':
        const questionLimit = permissions.testBankQuestionLimit;
        if (questionLimit === "unlimited") {
          return { allowed: true };
        }
        
        const totalQuestions = await storage.getTotalQuestionCount(accountId);
        if (totalQuestions >= questionLimit) {
          return { 
            allowed: false, 
            reason: `Test bank question limit of ${questionLimit} reached`, 
            upgradeRequired: true 
          };
        }
        break;

      default:
        return { allowed: false, reason: 'Unknown action' };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Permission check error:', error);
    return { allowed: false, reason: 'Permission check failed' };
  }
}