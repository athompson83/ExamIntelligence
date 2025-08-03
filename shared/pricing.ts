// ProficiencyAI Pricing & Feature-Permission Matrix
// This file defines the exact pricing and feature permissions for each subscription tier

export type SubscriptionTier = "starter" | "basic" | "professional" | "institutional" | "enterprise";

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number; // 15% discount applied
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  features: FeaturePermissions;
  popular?: boolean;
  enterprise?: boolean;
}

export interface FeaturePermissions {
  // Quiz & Test-bank Creation
  canCreateQuiz: boolean;
  maxActiveQuizzes: number | "unlimited";
  testBankQuestionLimit: number | "unlimited";
  
  // AI Features
  aiGenerateQuotaPerMonth: number | "unlimited";
  aiValidationQuotaPerMonth: number | "unlimited";
  
  // Advanced Features
  canUseCAT: boolean; // Computer-Adaptive Testing
  canUseProctoring: boolean;
  proctoringSessionsPerMonth: number | "unlimited";
  canUseLTI: boolean; // Learning Tools Interoperability
  
  // Analytics & Reporting
  basicReporting: boolean;
  advancedAnalytics: boolean;
  itemAnalysis: boolean; // difficulty, discrimination
  cohortDashboards: boolean;
  
  // Import/Export
  canImportCSV: boolean;
  canExportCSV: boolean;
  
  // Enterprise Features
  cohortManagement: boolean;
  customRoles: boolean;
  ssoIntegration: boolean;
  whiteLabel: boolean;
  dedicatedSupport: boolean;
  onPremDeployment: boolean;
  
  // Institutional Features
  maxSeats: number | "unlimited";
  seatOveragePrice?: number; // per user/month
  proctoringSessionPrice?: number; // per session
}

// Exact pricing matrix as specified in requirements
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for individual educators getting started",
    monthlyPrice: 0,
    annualPrice: 0,
    features: {
      canCreateQuiz: true,
      maxActiveQuizzes: 5,
      testBankQuestionLimit: 100,
      aiGenerateQuotaPerMonth: 10,
      aiValidationQuotaPerMonth: 0,
      canUseCAT: false,
      canUseProctoring: false,
      proctoringSessionsPerMonth: 0,
      canUseLTI: false,
      basicReporting: true,
      advancedAnalytics: false,
      itemAnalysis: false,
      cohortDashboards: false,
      canImportCSV: false,
      canExportCSV: false,
      cohortManagement: false,
      customRoles: false,
      ssoIntegration: false,
      whiteLabel: false,
      dedicatedSupport: false,
      onPremDeployment: false,
      maxSeats: 1
    }
  },
  {
    id: "basic",
    name: "Basic",
    description: "For individual teachers who need more flexibility",
    monthlyPrice: 20,
    annualPrice: 204, // 15% discount: 20 * 12 * 0.85 = 204
    features: {
      canCreateQuiz: true,
      maxActiveQuizzes: "unlimited",
      testBankQuestionLimit: "unlimited",
      aiGenerateQuotaPerMonth: 200,
      aiValidationQuotaPerMonth: 50,
      canUseCAT: false,
      canUseProctoring: false,
      proctoringSessionsPerMonth: 0,
      canUseLTI: false,
      basicReporting: true,
      advancedAnalytics: false,
      itemAnalysis: false,
      cohortDashboards: false,
      canImportCSV: true,
      canExportCSV: true,
      cohortManagement: false,
      customRoles: false,
      ssoIntegration: false,
      whiteLabel: false,
      dedicatedSupport: false,
      onPremDeployment: false,
      maxSeats: 1
    }
  },
  {
    id: "professional",
    name: "Professional",
    description: "Advanced features for serious educators",
    monthlyPrice: 50,
    annualPrice: 510, // 15% discount: 50 * 12 * 0.85 = 510
    popular: true,
    features: {
      canCreateQuiz: true,
      maxActiveQuizzes: "unlimited",
      testBankQuestionLimit: "unlimited",
      aiGenerateQuotaPerMonth: "unlimited",
      aiValidationQuotaPerMonth: "unlimited",
      canUseCAT: true,
      canUseProctoring: true,
      proctoringSessionsPerMonth: 20,
      canUseLTI: true,
      basicReporting: true,
      advancedAnalytics: true,
      itemAnalysis: true,
      cohortDashboards: true,
      canImportCSV: true,
      canExportCSV: true,
      cohortManagement: false,
      customRoles: false,
      ssoIntegration: false,
      whiteLabel: false,
      dedicatedSupport: false,
      onPremDeployment: false,
      maxSeats: 1,
      proctoringSessionPrice: 5 // $5 per extra session
    }
  },
  {
    id: "institutional",
    name: "Institutional",
    description: "Perfect for departments and small schools",
    monthlyPrice: 1200,
    annualPrice: 12240, // 15% discount: 1200 * 12 * 0.85 = 12240
    features: {
      canCreateQuiz: true,
      maxActiveQuizzes: "unlimited",
      testBankQuestionLimit: "unlimited",
      aiGenerateQuotaPerMonth: "unlimited",
      aiValidationQuotaPerMonth: "unlimited",
      canUseCAT: true,
      canUseProctoring: true,
      proctoringSessionsPerMonth: "unlimited",
      canUseLTI: true,
      basicReporting: true,
      advancedAnalytics: true,
      itemAnalysis: true,
      cohortDashboards: true,
      canImportCSV: true,
      canExportCSV: true,
      cohortManagement: true,
      customRoles: true,
      ssoIntegration: false,
      whiteLabel: false,
      dedicatedSupport: true,
      onPremDeployment: false,
      maxSeats: 100,
      seatOveragePrice: 10, // $10 per user/month above 100 seats
      proctoringSessionPrice: 4 // $4 per session
    }
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    monthlyPrice: 0, // Custom pricing
    annualPrice: 0, // Custom pricing
    enterprise: true,
    features: {
      canCreateQuiz: true,
      maxActiveQuizzes: "unlimited",
      testBankQuestionLimit: "unlimited",
      aiGenerateQuotaPerMonth: "unlimited",
      aiValidationQuotaPerMonth: "unlimited",
      canUseCAT: true,
      canUseProctoring: true,
      proctoringSessionsPerMonth: "unlimited",
      canUseLTI: true,
      basicReporting: true,
      advancedAnalytics: true,
      itemAnalysis: true,
      cohortDashboards: true,
      canImportCSV: true,
      canExportCSV: true,
      cohortManagement: true,
      customRoles: true,
      ssoIntegration: true,
      whiteLabel: true,
      dedicatedSupport: true,
      onPremDeployment: true,
      maxSeats: "unlimited"
    }
  }
];

// Helper functions for permission checking
export function getFeaturePermissions(tier: SubscriptionTier): FeaturePermissions {
  const plan = PRICING_PLANS.find(p => p.id === tier);
  if (!plan) {
    // Default to starter if tier not found
    return PRICING_PLANS[0].features;
  }
  return plan.features;
}

export function canUserAccessFeature(
  userTier: SubscriptionTier, 
  feature: keyof FeaturePermissions
): boolean {
  const permissions = getFeaturePermissions(userTier);
  return !!permissions[feature];
}

export function getUserQuotaLimit(
  userTier: SubscriptionTier,
  quotaType: 'aiGenerateQuotaPerMonth' | 'aiValidationQuotaPerMonth' | 'maxActiveQuizzes' | 'testBankQuestionLimit'
): number | "unlimited" {
  const permissions = getFeaturePermissions(userTier);
  return permissions[quotaType] as number | "unlimited";
}

// Monthly/Annual pricing calculation
export function calculateAnnualSavings(monthlyPrice: number): number {
  const annualPrice = monthlyPrice * 12 * 0.85; // 15% discount
  const monthlyCost = monthlyPrice * 12;
  return monthlyCost - annualPrice;
}

export function getPlanById(planId: SubscriptionTier): PricingPlan | undefined {
  return PRICING_PLANS.find(plan => plan.id === planId);
}