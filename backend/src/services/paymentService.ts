import { stripe } from '../lib/stripe';
import prisma from '../lib/prisma';
import {
  sendDepositPaymentEmail,
  sendDepositReceivedEmail,
  sendFinalPaymentEmail,
  sendFinalPaymentReceivedEmail,
  sendPaymentReceivedNotification,
} from './email';

export const paymentService = {
  /**
   * Create a Stripe checkout session for deposit payment (30% of quote total)
   */
  async createDepositCheckout(incomeId: string, originUrl: string) {
    if (!stripe) throw new Error('Stripe not configured');

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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (income.currency || 'USD').toLowerCase(),
            product_data: {
              name: `Deposit: ${income.description}`,
              description: `30% deposit for ${income.description}`,
            },
            unit_amount: Math.round(depositAmount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        incomeId: income.id,
        type: 'deposit',
        userId: income.userId,
        leadId: income.leadId || '',
      },
      customer_email: income.lead.clientEmail,
    });

    // Update income with session info
    await prisma.income.update({
      where: { id: incomeId },
      data: {
        stripeSessionId: session.id,
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

    return { url: session.url, sessionId: session.id, depositAmount };
  },

  /**
   * Create a Stripe checkout session for final payment (remaining 70%)
   */
  async createFinalCheckout(incomeId: string, originUrl: string) {
    if (!stripe) throw new Error('Stripe not configured');

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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (income.currency || 'USD').toLowerCase(),
            product_data: {
              name: `Final Payment: ${income.description}`,
              description: `Remaining balance for ${income.description}`,
            },
            unit_amount: Math.round(finalAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        incomeId: income.id,
        type: 'final',
        userId: income.userId,
        leadId: income.leadId || '',
      },
      customer_email: income.lead.clientEmail,
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

    return { url: session.url, sessionId: session.id, finalAmount };
  },

  /**
   * Check the status of a Stripe checkout session and update income accordingly
   */
  async checkAndUpdateSessionStatus(sessionId: string) {
    if (!stripe) throw new Error('Stripe not configured');

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const incomeId = session.metadata?.incomeId;
    const paymentType = session.metadata?.type;

    if (!incomeId) {
      console.error('[Pay] No incomeId in session metadata');
      return { status: session.status, payment_status: session.payment_status };
    }

    // Only update if payment succeeded and hasn't been processed yet
    if (session.payment_status === 'paid') {
      const income = await prisma.income.findUnique({ where: { id: incomeId } });
      if (!income) return { status: session.status, payment_status: session.payment_status };

      if (paymentType === 'deposit' && !income.depositPaid) {
        await prisma.income.update({
          where: { id: incomeId },
          data: {
            depositPaid: true,
            depositPaidAt: new Date(),
            status: 'DEPOSIT_RECEIVED',
            stripePaymentIntentId: session.payment_intent as string,
          },
        });

        // Log activity
        if (income.leadId) {
          await prisma.activity.create({
            data: {
              leadId: income.leadId,
              userId: income.userId,
              type: 'PAYMENT_RECEIVED',
              description: `Deposit payment of $${(session.amount_total || 0) / 100} received via Stripe`,
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
            depositAmount: (session.amount_total || 0) / 100,
            portalUrl,
          }).catch(e => console.error('[Pay] Deposit received email failed:', e));
          sendPaymentReceivedNotification({
            creativeEmail: depositIncome.user.email,
            clientName: depositIncome.lead.clientName,
            projectTitle: depositIncome.lead.projectTitle,
            amount: (session.amount_total || 0) / 100,
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
            stripePaymentIntentId: session.payment_intent as string,
          },
        });

        if (income.leadId) {
          await prisma.activity.create({
            data: {
              leadId: income.leadId,
              userId: income.userId,
              type: 'PAYMENT_RECEIVED',
              description: `Final payment of $${(session.amount_total || 0) / 100} received via Stripe — PAID IN FULL`,
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
            amount: (session.amount_total || 0) / 100,
          }).catch(e => console.error('[Pay] Final payment received email failed:', e));
          sendPaymentReceivedNotification({
            creativeEmail: finalIncome.user.email,
            clientName: finalIncome.lead.clientName,
            projectTitle: finalIncome.lead.projectTitle,
            amount: (session.amount_total || 0) / 100,
            type: 'final',
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          }).catch(e => console.error('[Pay] Final notification to creative failed:', e));
        }
      }
    }

    return {
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    };
  },

  /**
   * Handle Stripe webhook event
   */
  async handleWebhookEvent(event: any) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status === 'paid') {
          await this.checkAndUpdateSessionStatus(session.id);
        }
        break;
      }
      case 'checkout.session.expired': {
        console.log(`[Pay] Checkout session expired: ${event.data.object.id}`);
        break;
      }
      default:
        console.log(`[Pay] Unhandled event: ${event.type}`);
    }
  },
};
