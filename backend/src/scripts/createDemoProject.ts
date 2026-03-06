import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createDemoProject(userId: string): Promise<void> {
  try {
    // Don't create demo if user already has leads
    const existing = await prisma.lead.count({ where: { assignedToId: userId } });
    if (existing > 0) return;

    const now = new Date();
    const eventDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // +60 days
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    // Create demo lead
    const lead = await prisma.lead.create({
      data: {
        assignedToId: userId,
        clientName: 'Sarah Johnson (Demo)',
        clientEmail: 'sarah.demo@example.com',
        clientPhone: '(555) 123-4567',
        serviceType: 'PHOTOGRAPHY',
        projectTitle: 'Wedding Photography',
        description: 'Beautiful outdoor wedding at Rosewood Gardens. Full day coverage with engagement shoot included. This is a sample project to help you explore KOLOR STUDIO!',
        budget: '$3,000 - $5,000',
        timeline: 'June 2026',
        eventDate,
        projectType: 'SERVICE',
        industry: 'PHOTOGRAPHY',
        deliverableType: 'DIGITAL_FILES',
        status: 'QUOTED',
        priority: 'HIGH',
        source: 'INSTAGRAM',
        score: 85,
        pipelineStatus: 'QUOTED',
        estimatedValue: 3500,
        isDemoData: true,
        tags: ['demo', 'wedding'],
      },
    });

    // Create demo quote - use short userId suffix for uniqueness
    const shortId = userId.slice(0, 8).toUpperCase();
    await prisma.quote.create({
      data: {
        leadId: lead.id,
        createdById: userId,
        quoteNumber: `Q-DEMO-${shortId}`,
        lineItems: [
          { description: '8 hours wedding photography', quantity: 1, price: 2000, total: 2000 },
          { description: 'Professional editing (200+ photos)', quantity: 1, price: 800, total: 800 },
          { description: 'Online gallery delivery', quantity: 1, price: 200, total: 200 },
        ],
        subtotal: 3000,
        tax: 0,
        taxAmount: 0,
        total: 3000,
        paymentTerms: 'DEPOSIT_50',
        validUntil,
        status: 'SENT',
        sentAt: now,
        terms: 'A 50% deposit is required to secure the date. Remaining balance due 7 days before the event.',
      },
    });

    // Create demo activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId,
        type: 'QUOTE_SENT',
        description: 'Wedding photography quote sent to Sarah Johnson',
      },
    });

    // Create demo interaction
    await prisma.interaction.create({
      data: {
        leadId: lead.id,
        type: 'EMAIL_SENT',
        content: 'Sent initial quote for wedding photography package. Sarah loved the pricing and mood board!',
      },
    });

    console.log('Demo project created for user:', userId);
  } catch (error) {
    // Non-blocking — don't fail signup if demo creation fails
    console.error('Failed to create demo project:', error);
  }
}
