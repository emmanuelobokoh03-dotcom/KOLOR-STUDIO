import prisma from '../lib/prisma';
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

const STRIPE_PROXY_URL = process.env.STRIPE_PROXY_URL || 'http://localhost:8002';

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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe proxy error: ${err}`);
  }
  return await res.json() as StripeCheckoutSession;
}

async function proxyGetSessionStatus(sessionId: string): Promise<StripeSessionStatus> {
  const res = await fetch(`${STRIPE_PROXY_URL}/session-status/${sessionId}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe proxy error: ${err}`);
  }
  return await res.json() as StripeSessionStatus;
}

async function isStripeAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${STRIPE_PROXY_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const paymentService = {
  /**
   * Create a Stripe checkout session for deposit payment (30% of quote total)
   */
  async createDepositCheckout(incomeId: string, originUrl: string) {
    const available = await isStripeAvailable();
    if (!available) throw new Error('Stripe payment service not available');

    const income = await prisma.income.findUnique({
      where: { id: incomeId },
      include: { lead: true, user: true },
    });
    if (!income) throw new Error('Income not found');
    if (!income.lead) throw new Error('No lead associated with income');

    const depositAmount = Math.round(Number(income.amount) * 0.3 * 100) / 100; // 30%
    const portalToken = income.lead.portalToken;

    const successUrl = `${originUrl}/portal/${portalToken}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${originUrl}/portal/${portalToken}?payment=cancelled`;

    const session = await proxyCreateSession({
      amount: depositAmount,
      currency: (income.currency || 'USD').toLowerCase(),
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

    // Update income with session info
    await prisma.income.update({
      where: { id: incomeId },
      data: {
        stripeSessionId: session.session_id,
        depositAmount: depositAmount,
        paymentMethod: 'stripe',
      },
    });

    console.log(`[Pay] Deposit checkout created: $${depositAmount} for income ${incomeId}`);

    // Send deposit payment request email to client
    const creativeName = `${income.user?.firstName || ''} ${income.user?.lastName || ''}`.trim() || 'Studio';
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

  /**
   * Create a Stripe checkout session for final payment (remaining 70%)
   */
  async createFinalCheckout(incomeId: string, originUrl: string) {
    const available = await isStripeAvailable();
    if (!available) throw new Error('Stripe payment service not available');

    const income = await prisma.income.findUnique({
      where: { id: incomeId },
      include: { lead: true, user: true },
    });
    if (!income) throw new Error('Income not found');
    if (!income.lead) throw new Error('No lead associated with income');

    const finalAmount = Math.round(Number(income.amount) * 0.7 * 100) / 100; // 70%
    const portalToken = income.lead.portalToken;

    const successUrl = `${originUrl}/portal/${portalToken}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${originUrl}/portal/${portalToken}?payment=cancelled`;

    const session = await proxyCreateSession({
      amount: finalAmount,
      currency: (income.currency || 'USD').toLowerCase(),
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
      data: {
        finalAmount: finalAmount,
      },
    });

    console.log(`[Pay] Final checkout created: $${finalAmount} for income ${incomeId}`);

    // Send final payment request email to client
    const creativeName = `${income.user?.firstName || ''} ${income.user?.lastName || ''}`.trim() || 'Studio';
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

  /**
   * Check the status of a Stripe checkout session and update income accordingly
   */
  async checkAndUpdateSessionStatus(sessionId: string) {
    const available = await isStripeAvailable();
    if (!available) throw new Error('Stripe payment service not available');

    const sessionData = await proxyGetSessionStatus(sessionId);
    const incomeId = sessionData.metadata?.incomeId;
    const paymentType = sessionData.metadata?.type;

    if (!incomeId) {
      console.error('[Pay] No incomeId in session metadata');
      return { status: sessionData.status, payment_status: sessionData.payment_status };
    }

    // Only update if payment succeeded and hasn't been processed yet
    if (sessionData.payment_status === 'paid') {
      const income = await prisma.income.findUnique({ where: { id: incomeId } });
      if (!income) return { status: sessionData.status, payment_status: sessionData.payment_status };

      if (paymentType === 'deposit' && !income.depositPaid) {
        await prisma.income.update({
          where: { id: incomeId },
          data: {
            depositPaid: true,
            depositPaidAt: new Date(),
            status: 'DEPOSIT_RECEIVED',
          },
        });

        // Log activity
        if (income.leadId) {
          await prisma.activity.create({
            data: {
              leadId: income.leadId,
              userId: income.userId,
              type: 'PAYMENT_RECEIVED',
              description: `Deposit payment of $${(sessionData.amount_total || 0) / 100} received via Stripe`,
            },
          });
        }
        console.log(`[Pay] Deposit marked PAID for income ${incomeId}`);

        // Send deposit received email to client + notification to creative
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
          }).catch(e => console.error('[Pay] Deposit notification to creative failed:', e));
        }
      } else if (paymentType === 'final' && !income.finalPaid) {
        await prisma.income.update({
          where: { id: incomeId },
          data: {
            finalPaid: true,
            finalPaidAt: new Date(),
            status: 'PAID_IN_FULL',
            receivedDate: new Date(),
          },
        });

        if (income.leadId) {
          await prisma.activity.create({
            data: {
              leadId: income.leadId,
              userId: income.userId,
              type: 'PAYMENT_RECEIVED',
              description: `Final payment of $${(sessionData.amount_total || 0) / 100} received via Stripe — PAID IN FULL`,
            },
          });
        }
        console.log(`[Pay] Final payment marked PAID_IN_FULL for income ${incomeId}`);

        // Send final payment received email to client + notification to creative
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
          }).catch(e => console.error('[Pay] Final payment received email failed:', e));
          sendPaymentReceivedNotification({
            creativeEmail: finalIncome.user.email,
            clientName: finalIncome.lead.clientName,
            projectTitle: finalIncome.lead.projectTitle,
            amount: (sessionData.amount_total || 0) / 100,
            type: 'final',
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          }).catch(e => console.error('[Pay] Final notification to creative failed:', e));
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

  /**
   * Handle Stripe webhook event via proxy
   */
  async handleWebhookEvent(rawBody: Buffer, signature: string) {
    try {
      const res = await fetch(`${STRIPE_PROXY_URL}/handle-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'stripe-signature': signature,
        },
        body: rawBody,
      });

      if (!res.ok) {
        throw new Error(`Webhook proxy error: ${await res.text()}`);
      }

      const event = await res.json() as StripeWebhookEvent;

      if (event.event_type === 'checkout.session.completed' && event.payment_status === 'paid') {
        await this.checkAndUpdateSessionStatus(event.session_id);
      }

      return event;
    } catch (e) {
      console.error('[Pay] Webhook handling error:', e);
      throw e;
    }
  },
};
