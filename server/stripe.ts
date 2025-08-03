import Stripe from 'stripe';
import { storage } from './storage-simple';
import { SubscriptionTier } from '@shared/pricing';

// Initialize Stripe with secret key
let stripe: Stripe | null = null;

export async function initializeStripe() {
  try {
    const stripeSecret = await storage.getSystemSetting('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      console.warn('Stripe secret key not configured. Stripe functionality disabled.');
      return false;
    }

    stripe = new Stripe(stripeSecret, {
      apiVersion: '2024-06-20',
    });

    console.log('✅ Stripe initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error);
    return false;
  }
}

export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe not initialized. Please configure STRIPE_SECRET_KEY in system settings.');
  }
  return stripe;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  accountId: string,
  priceId: string,
  isUpgrade = false
): Promise<{ url: string; sessionId: string }> {
  const stripeInstance = getStripe();
  
  const account = await storage.getAccountById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  let customerId = account.stripeCustomerId;

  // Create customer if doesn't exist
  if (!customerId) {
    const user = await storage.getUsersByAccountId(accountId);
    const primaryUser = user[0]; // Assume first user is primary

    const customer = await stripeInstance.customers.create({
      email: primaryUser?.email || account.billingEmail || undefined,
      name: account.name,
      metadata: {
        accountId: accountId,
      },
    });

    customerId = customer.id;
    await storage.updateAccount(accountId, { stripeCustomerId: customerId });
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.VITE_APP_URL || 'http://localhost:5000'}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5000'}/pricing?canceled=true`,
    metadata: {
      accountId: accountId,
      isUpgrade: isUpgrade.toString(),
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    automatic_tax: {
      enabled: false, // Enable based on your tax requirements
    },
  };

  // If upgrading, handle proration
  if (isUpgrade && account.stripeSubscriptionId) {
    sessionParams.subscription_data = {
      metadata: {
        accountId: accountId,
      },
    };
  }

  const session = await stripeInstance.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}

/**
 * Create a billing portal session for existing customers
 */
export async function createBillingPortalSession(accountId: string): Promise<{ url: string }> {
  const stripeInstance = getStripe();
  
  const account = await storage.getAccountById(accountId);
  if (!account?.stripeCustomerId) {
    throw new Error('No Stripe customer found for this account');
  }

  const session = await stripeInstance.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${process.env.VITE_APP_URL || 'http://localhost:5000'}/billing`,
  });

  return { url: session.url };
}

/**
 * Handle webhook events from Stripe
 */
export async function handleWebhook(body: string, signature: string): Promise<void> {
  const stripeInstance = getStripe();
  const webhookSecret = await storage.getSystemSetting('STRIPE_WEBHOOK_SECRET');
  
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripeInstance.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  console.log('Processing Stripe webhook:', event.type);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.created':
      await handleInvoiceCreated(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const accountId = session.metadata?.accountId;
  if (!accountId) {
    console.error('No accountId in checkout session metadata');
    return;
  }

  console.log(`Checkout completed for account ${accountId}, subscription: ${session.subscription}`);

  // The subscription will be handled by the subscription.created/updated webhook
  // Just update the customer ID if needed
  if (session.customer && typeof session.customer === 'string') {
    await storage.updateAccount(accountId, {
      stripeCustomerId: session.customer,
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const account = await storage.getAccountByStripeCustomerId(customerId);
  
  if (!account) {
    console.error(`No account found for Stripe customer ${customerId}`);
    return;
  }

  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const tier = await getTierFromPriceId(priceId);
  const billingCycle = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly';

  await storage.updateAccount(account.id, {
    subscriptionTier: tier,
    billingCycle,
    stripeSubscriptionId: subscription.id,
    stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    stripeStatus: subscription.status,
    stripePriceId: priceId,
  });

  // Create or update subscription record
  await storage.upsertSubscription({
    accountId: account.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId!,
    stripeCustomerId: customerId,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    tier,
    billingCycle,
  });

  console.log(`Updated subscription for account ${account.id} to ${tier} (${billingCycle})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const account = await storage.getAccountByStripeCustomerId(customerId);
  
  if (!account) {
    console.error(`No account found for Stripe customer ${customerId}`);
    return;
  }

  // Downgrade to starter plan
  await storage.updateAccount(account.id, {
    subscriptionTier: 'starter',
    stripeStatus: 'canceled',
    stripeSubscriptionId: null,
    stripePriceId: null,
  });

  console.log(`Downgraded account ${account.id} to starter plan after subscription deletion`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const customerId = invoice.customer as string;
  const account = await storage.getAccountByStripeCustomerId(customerId);
  
  if (!account) {
    console.error(`No account found for Stripe customer ${customerId}`);
    return;
  }

  // Save invoice to database
  await storage.saveInvoice({
    accountId: account.id,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: invoice.subscription as string,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status!,
    invoiceNumber: invoice.number!,
    invoiceUrl: invoice.invoice_pdf || '',
    hostedInvoiceUrl: invoice.hosted_invoice_url || '',
    invoicePdf: invoice.invoice_pdf || '',
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
    periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
    periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    description: invoice.description || `Payment for ${account.subscriptionTier} plan`,
  });

  console.log(`Saved successful invoice ${invoice.id} for account ${account.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const account = await storage.getAccountByStripeCustomerId(customerId);
  
  if (!account) {
    console.error(`No account found for Stripe customer ${customerId}`);
    return;
  }

  // Update account status to past_due
  await storage.updateAccount(account.id, {
    stripeStatus: 'past_due',
  });

  console.log(`Marked account ${account.id} as past_due due to failed payment`);
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const customerId = invoice.customer as string;
  const account = await storage.getAccountByStripeCustomerId(customerId);
  
  if (!account) {
    console.error(`No account found for Stripe customer ${customerId}`);
    return;
  }

  // Save invoice to database
  await storage.saveInvoice({
    accountId: account.id,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: invoice.subscription as string,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: invoice.status!,
    invoiceNumber: invoice.number || '',
    invoiceUrl: invoice.invoice_pdf || '',
    hostedInvoiceUrl: invoice.hosted_invoice_url || '',
    invoicePdf: invoice.invoice_pdf || '',
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    paidAt: null,
    periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
    periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    description: invoice.description || `Invoice for ${account.subscriptionTier} plan`,
  });

  console.log(`Saved new invoice ${invoice.id} for account ${account.id}`);
}

/**
 * Utility function to determine subscription tier from Stripe price ID
 */
async function getTierFromPriceId(priceId?: string): Promise<SubscriptionTier> {
  if (!priceId) return 'starter';

  // This mapping should be maintained in your system settings or database
  // For now, we'll use a simple pattern-based approach
  const tierPatterns = {
    'starter': ['free', 'starter'],
    'basic': ['basic'],
    'professional': ['professional', 'pro'],
    'institutional': ['institutional', 'inst'],
    'enterprise': ['enterprise', 'ent'],
  };

  const lowerPriceId = priceId.toLowerCase();
  
  for (const [tier, patterns] of Object.entries(tierPatterns)) {
    if (patterns.some(pattern => lowerPriceId.includes(pattern))) {
      return tier as SubscriptionTier;
    }
  }

  // Default to basic if we can't determine the tier
  console.warn(`Could not determine tier for price ID: ${priceId}, defaulting to basic`);
  return 'basic';
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(accountId: string): Promise<void> {
  const stripeInstance = getStripe();
  
  const account = await storage.getAccountById(accountId);
  if (!account?.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  await stripeInstance.subscriptions.update(account.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await storage.updateAccount(accountId, {
    // The webhook will handle the actual status update
  });

  console.log(`Scheduled cancellation for subscription ${account.stripeSubscriptionId}`);
}

/**
 * Reactivate a subscription
 */
export async function reactivateSubscription(accountId: string): Promise<void> {
  const stripeInstance = getStripe();
  
  const account = await storage.getAccountById(accountId);
  if (!account?.stripeSubscriptionId) {
    throw new Error('No subscription found');
  }

  await stripeInstance.subscriptions.update(account.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  console.log(`Reactivated subscription ${account.stripeSubscriptionId}`);
}