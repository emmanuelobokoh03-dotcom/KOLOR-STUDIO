import Stripe from 'stripe';
import prisma from '../lib/prisma';
import { logAudit, AUDIT_ACTIONS } from './auditService';
import {
  sendDepositPaymentEmail,
  sendDepositReceivedEmail,
  sendFinalPaymentEmail,
  sendFinalPaymentReceivedEmail,
  sendPaymentReceivedNotification,
} from './email';

// Type definitions for Stripe proxy responses
interface StripeCheckoutSession {
  url: string;
  session_id: string;
}

interface StripeSessionStatus {
  status: string;
  payment_status: string;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
}

interface StripeWebhookEvent {
  event_type: string;
  event_id: string;
  session_id: string;
  payment_status: string;
  metadata: Record<string, string>;
}

// Dual-mode: detect which Stripe integration to use
const STRIPE_API_KEY = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY || '';
const useDirectSDK = STRIPE_API_KEY && !STRIPE_API_KEY.includes('emergent') && STRIPE_API_KEY.startsWith('sk_');
const STRIPE_PROXY_URL = process.env.STRIPE_PROXY_URL || 'http://localhost:8002';

let stripe: Stripe | null = null;
if (useDirectSDK) {
  stripe = new Stripe(STRIPE_API_KEY, { typescript: true });
} else {
}

// ── Paystack configuration ──────────────────────────────
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const usePaystack = !!PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_');

// Currencies routed to Paystack (African markets in beta)
const PAYSTACK_CURRENCIES = new Set(['NGN', 'GHS', 'ZAR', 'KES']);

export function shouldUsePaystack(currency: string): boolean {
  return usePaystack && PAYSTACK_CURRENCIES.has(currency.toUpperCase());
}

// ── Paystack API helpers (native fetch, no SDK) ─────────
async function paystackInitializeTransaction(params: {
  amount: number;       // major units (e.g. 5000 NGN)
  currency: string;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ authorization_url: string; reference: string; access_code: string }> {
  const amountInMinorUnits = Math.round(params.amount * 100);

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: amountInMinorUnits,
      currency: params.currency.toUpperCase(),
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: {
        custom_fields: Object.entries(params.metadata || {}).map(([key, value]) => ({
          display_name: key,
          variable_name: key,
          value,
        })),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paystack initialization failed: ${err}`);
  }

  const data = await res.json() as {
    status: boolean;
    message: string;
    data: { authorization_url: string; access_code: string; reference: string };
  };

  if (!data.status) throw new Error(`Paystack error: ${data.message}`);
  return data.data;
}

async function paystackVerifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}> {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paystack verify failed: ${err}`);
  }

  const data = await res.json() as {
    status: boolean;
    data: {
      status: string;
      amount: number;
      currency: string;
      metadata?: { custom_fields?: Array<{ variable_name: string; value: string }> };
    };
  };

  if (!data.status) throw new Error('Paystack verification failed');

  const metadata: Record<string, string> = {};
  for (const field of data.data.metadata?.custom_fields || []) {
    metadata[field.variable_name] = field.value;
  }

  return {
    status: data.data.status,
    amount: data.data.amount,
    currency: data.data.currency,
    metadata,
  };
}

// ---- Direct SDK helpers ----
async function sdkCreateSession(params: {
  amount: number;
  currency: string;
  productName: string;
  productDescription: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string; session_id: string }> {
  if (!stripe) throw new Error('Stripe SDK not initialized');
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: params.currency,
        product_data: {
          name: params.productName,
          description: params.productDescription || undefined,
        },
        unit_amount: Math.round(params.amount * 100),
      },
      quantity: 1,
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail || undefined,
    metadata: params.metadata || {},
  });
  return { url: session.url || '', session_id: session.id };
}

async function sdkGetSessionStatus(sessionId: string): Promise<StripeSessionStatus> {
  if (!stripe) throw new Error('Stripe SDK not initialized');
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    status: session.status || 'unknown',
    payment_status: session.payment_status || 'unknown',
    amount_total: session.amount_total || 0,
    currency: session.currency || 'usd',
    metadata: (session.metadata || {}) as Record<string, string>,
  };
}

// ---- Proxy helpers ----
async function proxyCreateSession(params: {
  amount: number;
  currency: string;
  productName: string;
  productDescription: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string; session_id: string }> {
  const res = await fetch(`${STRIPE_PROXY_URL}/create-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      product_name: params.productName,
      product_description: params.productDescription,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: params.metadata,
    }),
  });
  if (!res.ok) throw new Error(`Stripe proxy error: ${await res.text()}`);
  return await res.json() as StripeCheckoutSession;
}

async function proxyGetSessionStatus(sessionId: string): Promise<StripeSessionStatus> {
  const res = await fetch(`${STRIPE_PROXY_URL}/session-status/${sessionId}`);
  if (!res.ok) throw new Error(`Stripe proxy error: ${await res.text()}`);
  return await res.json() as StripeSessionStatus;
}

// ---- Unified interface ----
async function createCheckoutSession(params: Parameters<typeof sdkCreateSession>[0]) {
  if (useDirectSDK) return sdkCreateSession(params);
  return proxyCreateSession(params);
}

async function getSessionStatus(sessionId: string) {
  if (useDirectSDK) return sdkGetSessionStatus(sessionId);
  return proxyGetSessionStatus(sessionId);
}

async function isStripeAvailable(): Promise<boolean> {
  if (useDirectSDK && stripe) return true;
  try {
    const res = await fetch(`${STRIPE_PROXY_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const paymentService = {
  async createDepositCheckout(incomeId: string, originUrl: string, _idempotencyKey?: string) {
    const income = await prisma.income.findUnique({
      where: { id: incomeId },
      include: { lead: true, user: true },
    });
    if (!income) throw new Error('Income not found');
    if (!income.lead) throw new Error('No lead associated with income');

    const depositAmount = Math.round(Number(income.amount) * 0.3 * 100) / 100;
    const portalToken = income.lead.portalToken;
    const currency = (income.currency || 'USD').toUpperCase();
    const creativeName = `${income.user?.firstName || ''} ${income.user?.lastName || ''}`.trim() || 'Studio';

    if (shouldUsePaystack(currency)) {
      // ── Paystack path (NGN, GHS, ZAR, KES) ──
      const reference = `kolor_dep_${income.id}_${Date.now()}`;
      const callbackUrl = `${originUrl}/portal/${portalToken}?payment=success&psp=paystack&ref=${reference}`;

      const txnData = await paystackInitializeTransaction({
        amount: depositAmount,
        currency,
        email: income.lead.clientEmail,
        reference,
        callbackUrl,
        metadata: {
          incomeId: income.id,
          type: 'deposit',
          userId: income.userId,
          leadId: income.leadId || '',
        },
      });

      await prisma.income.update({
        where: { id: incomeId },
        data: {
          paystackReference: reference,
          depositAmount,
          paymentMethod: 'paystack',
        },
      });

      sendDepositPaymentEmail({
        clientName: income.lead.clientName,
        clientEmail: income.lead.clientEmail,
        creativeName,
        studioName: income.user?.studioName || undefined,
        projectTitle: income.lead.projectTitle,
        totalAmount: Number(income.amount),
        depositAmount,
        paymentUrl: txnData.authorization_url,
      }).catch(e => console.error('[Pay] Paystack deposit email failed:', e));

      return { url: txnData.authorization_url, sessionId: reference, depositAmount };
    }

    // ── Stripe path (default) ──
    const available = await isStripeAvailable();
    if (!available) throw new Error('Stripe payment service not available');

    const successUrl = `${originUrl}/portal/${portalToken}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${originUrl}/portal/${portalToken}?payment=cancelled`;

    const session = await createCheckoutSession({
      amount: depositAmount,
      currency: currency.toLowerCase(),
      productName: `Deposit: ${income.description}`,
      productDescription: `30% deposit for ${income.description}`,
      successUrl,
      cancelUrl,
      customerEmail: income.lead.clientEmail,
      metadata: {
        incomeId: income.id,
        type: 'deposit',
        userId: income.userId,
        leadId: income.leadId || '',
      },
    });

    await prisma.income.update({
      where: { id: incomeId },
      data: {
        stripeSessionId: session.session_id,
        depositAmount,
        paymentMethod: 'stripe',
      },
    });

    sendDepositPaymentEmail({
      clientName: income.lead.clientName,
      clientEmail: income.lead.clientEmail,
      creativeName,
      studioName: income.user?.studioName || undefined,
      projectTitle: income.lead.projectTitle,
      totalAmount: Number(income.amount),
      depositAmount,
      paymentUrl: session.url || '',
    }).catch(e => console.error('[Pay] Deposit payment email failed:', e));

    return { url: session.url, sessionId: session.session_id, depositAmount };
  },

  async createFinalCheckout(incomeId: string, originUrl: string, _idempotencyKey?: string) {
    const income = await prisma.income.findUnique({
      where: { id: incomeId },
      include: { lead: true, user: true },
    });
    if (!income) throw new Error('Income not found');
    if (!income.lead) throw new Error('No lead associated with income');

    const finalAmount = Math.round(Number(income.amount) * 0.7 * 100) / 100;
    const portalToken = income.lead.portalToken;
    const currency = (income.currency || 'USD').toUpperCase();
    const creativeName = `${income.user?.firstName || ''} ${income.user?.lastName || ''}`.trim() || 'Studio';

    if (shouldUsePaystack(currency)) {
      // ── Paystack path ──
      const reference = `kolor_fin_${income.id}_${Date.now()}`;
      const callbackUrl = `${originUrl}/portal/${portalToken}?payment=success&psp=paystack&ref=${reference}`;

      const txnData = await paystackInitializeTransaction({
        amount: finalAmount,
        currency,
        email: income.lead.clientEmail,
        reference,
        callbackUrl,
        metadata: {
          incomeId: income.id,
          type: 'final',
          userId: income.userId,
          leadId: income.leadId || '',
        },
      });

      await prisma.income.update({
        where: { id: incomeId },
        data: {
          paystackReference: reference,
          finalAmount,
          paymentMethod: 'paystack',
        },
      });

      sendFinalPaymentEmail({
        clientName: income.lead.clientName,
        clientEmail: income.lead.clientEmail,
        creativeName,
        studioName: income.user?.studioName || undefined,
        projectTitle: income.lead.projectTitle,
        finalAmount,
        paymentUrl: txnData.authorization_url,
      }).catch(e => console.error('[Pay] Paystack final email failed:', e));

      return { url: txnData.authorization_url, sessionId: reference, finalAmount };
    }

    // ── Stripe path (default) ──
    const available = await isStripeAvailable();
    if (!available) throw new Error('Stripe payment service not available');

    const successUrl = `${originUrl}/portal/${portalToken}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${originUrl}/portal/${portalToken}?payment=cancelled`;

    const session = await createCheckoutSession({
      amount: finalAmount,
      currency: currency.toLowerCase(),
      productName: `Final Payment: ${income.description}`,
      productDescription: `Remaining balance for ${income.description}`,
      successUrl,
      cancelUrl,
      customerEmail: income.lead.clientEmail,
      metadata: {
        incomeId: income.id,
        type: 'final',
        userId: income.userId,
        leadId: income.leadId || '',
      },
    });

    await prisma.income.update({
      where: { id: incomeId },
      data: { finalAmount },
    });

    sendFinalPaymentEmail({
      clientName: income.lead.clientName,
      clientEmail: income.lead.clientEmail,
      creativeName,
      studioName: income.user?.studioName || undefined,
      projectTitle: income.lead.projectTitle,
      finalAmount,
      paymentUrl: session.url || '',
    }).catch(e => console.error('[Pay] Final payment email failed:', e));

    return { url: session.url, sessionId: session.session_id, finalAmount };
  },

  async checkAndUpdateSessionStatus(sessionId: string) {
    const sessionData = await getSessionStatus(sessionId);
    const incomeId = sessionData.metadata?.incomeId;
    const paymentType = sessionData.metadata?.type;

    if (!incomeId) {
      console.error('[Pay] No incomeId in session metadata');
      return { status: sessionData.status, payment_status: sessionData.payment_status };
    }

    if (sessionData.payment_status === 'paid') {
      const income = await prisma.income.findUnique({ where: { id: incomeId } });
      if (!income) return { status: sessionData.status, payment_status: sessionData.payment_status };

      if (paymentType === 'deposit' && !income.depositPaid) {
        await prisma.income.update({
          where: { id: incomeId },
          data: { depositPaid: true, depositPaidAt: new Date(), status: 'DEPOSIT_RECEIVED' },
        });
        if (income.leadId) {
          await prisma.activity.create({
            data: {
              leadId: income.leadId,
              userId: income.userId,
              type: 'PAYMENT_RECEIVED',
              description: `Deposit payment of ${(sessionData.amount_total || 0) / 100} received via Stripe`,
            },
          });
        }
    

        // Audit log for deposit payment
        await logAudit({
          userId: income.userId,
          action: AUDIT_ACTIONS.PAYMENT_RECEIVED,
          entity: 'Income',
          entityId: incomeId,
          metadata: { type: 'deposit', amount: (sessionData.amount_total || 0) / 100, leadId: income.leadId },
        });

        const depositIncome = await prisma.income.findUnique({
          where: { id: incomeId },
          include: { lead: true, user: true },
        });
        if (depositIncome?.lead && depositIncome?.user) {
          const portalUrl = depositIncome.lead.portalToken
            ? `${process.env.FRONTEND_URL}/portal/${depositIncome.lead.portalToken}`
            : undefined;
          const creativeName = `${depositIncome.user.firstName || ''} ${depositIncome.user.lastName || ''}`.trim();
          sendDepositReceivedEmail({
            clientName: depositIncome.lead.clientName,
            clientEmail: depositIncome.lead.clientEmail,
            creativeName,
            studioName: depositIncome.user.studioName || undefined,
            projectTitle: depositIncome.lead.projectTitle,
            depositAmount: (sessionData.amount_total || 0) / 100,
            portalUrl,
          }).catch(e => console.error('[Pay] Deposit received email failed:', e));
          sendPaymentReceivedNotification({
            creativeEmail: depositIncome.user.email,
            clientName: depositIncome.lead.clientName,
            projectTitle: depositIncome.lead.projectTitle,
            amount: (sessionData.amount_total || 0) / 100,
            type: 'deposit',
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          }).catch(e => console.error('[Pay] Deposit notification failed:', e));
        }
      } else if (paymentType === 'final' && !income.finalPaid) {
        await prisma.income.update({
          where: { id: incomeId },
          data: { finalPaid: true, finalPaidAt: new Date(), status: 'PAID_IN_FULL', receivedDate: new Date() },
        });
        if (income.leadId) {
          await prisma.activity.create({
            data: {
              leadId: income.leadId,
              userId: income.userId,
              type: 'PAYMENT_RECEIVED',
              description: `Final payment of ${(sessionData.amount_total || 0) / 100} received — PAID IN FULL`,
            },
          });
        }
    

        // Audit log for final payment
        await logAudit({
          userId: income.userId,
          action: AUDIT_ACTIONS.PAYMENT_RECEIVED,
          entity: 'Income',
          entityId: incomeId,
          metadata: { type: 'final', amount: (sessionData.amount_total || 0) / 100, leadId: income.leadId },
        });

        const finalIncome = await prisma.income.findUnique({
          where: { id: incomeId },
          include: { lead: true, user: true },
        });
        if (finalIncome?.lead && finalIncome?.user) {
          const creativeName = `${finalIncome.user.firstName || ''} ${finalIncome.user.lastName || ''}`.trim();
          sendFinalPaymentReceivedEmail({
            clientName: finalIncome.lead.clientName,
            clientEmail: finalIncome.lead.clientEmail,
            creativeName,
            studioName: finalIncome.user.studioName || undefined,
            projectTitle: finalIncome.lead.projectTitle,
            amount: (sessionData.amount_total || 0) / 100,
          }).catch(e => console.error('[Pay] Final received email failed:', e));
          sendPaymentReceivedNotification({
            creativeEmail: finalIncome.user.email,
            clientName: finalIncome.lead.clientName,
            projectTitle: finalIncome.lead.projectTitle,
            amount: (sessionData.amount_total || 0) / 100,
            type: 'final',
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          }).catch(e => console.error('[Pay] Final notification failed:', e));
        }
      }
    }

    return {
      status: sessionData.status,
      payment_status: sessionData.payment_status,
      amount_total: sessionData.amount_total,
      currency: sessionData.currency,
      metadata: sessionData.metadata,
    };
  },

  async handleWebhookEvent(rawBody: Buffer, signature: string) {
    if (useDirectSDK && stripe) {
      // Direct SDK mode — verify and parse webhook
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          await this.checkAndUpdateSessionStatus(session.id);
        }
      }
      return { event_type: event.type, event_id: event.id };
    } else {
      // Proxy mode
      const res = await fetch(`${STRIPE_PROXY_URL}/handle-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream', 'stripe-signature': signature },
        body: rawBody,
      });
      if (!res.ok) throw new Error(`Webhook proxy error: ${await res.text()}`);
      const event = await res.json() as StripeWebhookEvent;
      if (event.event_type === 'checkout.session.completed' && event.payment_status === 'paid') {
        await this.checkAndUpdateSessionStatus(event.session_id);
      }
      return event;
    }
  },

  // ── Paystack payment verification + post-payment DB updates ──
  async checkAndUpdatePaystackPayment(reference: string) {
    const txn = await paystackVerifyTransaction(reference);

    if (txn.status !== 'success') {
      return { status: txn.status, payment_status: txn.status };
    }

    const incomeId = txn.metadata?.incomeId;
    const paymentType = txn.metadata?.type;

    if (!incomeId) {
      console.error('[Paystack] No incomeId in transaction metadata for ref:', reference);
      return { status: txn.status, payment_status: txn.status };
    }

    const income = await prisma.income.findUnique({ where: { id: incomeId } });
    if (!income) return { status: txn.status, payment_status: txn.status };

    const amountPaid = txn.amount / 100; // minor → major units

    if (paymentType === 'deposit' && !income.depositPaid) {
      await prisma.income.update({
        where: { id: incomeId },
        data: {
          depositPaid: true,
          depositPaidAt: new Date(),
          depositAmount: amountPaid,
          status: 'DEPOSIT_RECEIVED',
          paystackReference: reference,
          paymentMethod: 'paystack',
        },
      });

      if (income.leadId) {
        await prisma.activity.create({
          data: {
            leadId: income.leadId,
            userId: income.userId,
            type: 'PAYMENT_RECEIVED',
            description: `Deposit of ${amountPaid} ${txn.currency} received via Paystack`,
          },
        });
      }

      await logAudit({
        userId: income.userId,
        action: AUDIT_ACTIONS.PAYMENT_RECEIVED,
        entity: 'Income',
        entityId: incomeId,
        metadata: { type: 'deposit', amount: amountPaid, provider: 'paystack', reference, leadId: income.leadId },
      });

      const fullIncome = await prisma.income.findUnique({
        where: { id: incomeId },
        include: { lead: true, user: true },
      });
      if (fullIncome?.lead && fullIncome?.user) {
        const portalUrl = fullIncome.lead.portalToken
          ? `${process.env.FRONTEND_URL}/portal/${fullIncome.lead.portalToken}`
          : undefined;
        const creativeName = `${fullIncome.user.firstName || ''} ${fullIncome.user.lastName || ''}`.trim();
        sendDepositReceivedEmail({
          clientName: fullIncome.lead.clientName,
          clientEmail: fullIncome.lead.clientEmail,
          creativeName,
          studioName: fullIncome.user.studioName || undefined,
          projectTitle: fullIncome.lead.projectTitle,
          depositAmount: amountPaid,
          portalUrl,
        }).catch(e => console.error('[Paystack] Deposit received email failed:', e));
        sendPaymentReceivedNotification({
          creativeEmail: fullIncome.user.email,
          clientName: fullIncome.lead.clientName,
          projectTitle: fullIncome.lead.projectTitle,
          amount: amountPaid,
          type: 'deposit',
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        }).catch(e => console.error('[Paystack] Payment notification failed:', e));
      }
    } else if (paymentType === 'final' && !income.finalPaid) {
      await prisma.income.update({
        where: { id: incomeId },
        data: {
          finalPaid: true,
          finalPaidAt: new Date(),
          finalAmount: amountPaid,
          status: 'PAID_IN_FULL',
          receivedDate: new Date(),
          paystackReference: reference,
          paymentMethod: 'paystack',
        },
      });

      if (income.leadId) {
        await prisma.activity.create({
          data: {
            leadId: income.leadId,
            userId: income.userId,
            type: 'PAYMENT_RECEIVED',
            description: `Final payment of ${amountPaid} ${txn.currency} received via Paystack — PAID IN FULL`,
          },
        });
      }

      await logAudit({
        userId: income.userId,
        action: AUDIT_ACTIONS.PAYMENT_RECEIVED,
        entity: 'Income',
        entityId: incomeId,
        metadata: { type: 'final', amount: amountPaid, provider: 'paystack', reference, leadId: income.leadId },
      });

      const fullIncome = await prisma.income.findUnique({
        where: { id: incomeId },
        include: { lead: true, user: true },
      });
      if (fullIncome?.lead && fullIncome?.user) {
        const creativeName = `${fullIncome.user.firstName || ''} ${fullIncome.user.lastName || ''}`.trim();
        sendFinalPaymentReceivedEmail({
          clientName: fullIncome.lead.clientName,
          clientEmail: fullIncome.lead.clientEmail,
          creativeName,
          studioName: fullIncome.user.studioName || undefined,
          projectTitle: fullIncome.lead.projectTitle,
          amount: amountPaid,
        }).catch(e => console.error('[Paystack] Final received email failed:', e));
        sendPaymentReceivedNotification({
          creativeEmail: fullIncome.user.email,
          clientName: fullIncome.lead.clientName,
          projectTitle: fullIncome.lead.projectTitle,
          amount: amountPaid,
          type: 'final',
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        }).catch(e => console.error('[Paystack] Final notification failed:', e));
      }
    }

    return { status: txn.status, payment_status: txn.status, amount: amountPaid, currency: txn.currency };
  },
};
