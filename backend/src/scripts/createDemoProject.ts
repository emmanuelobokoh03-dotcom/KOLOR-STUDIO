import { IndustryType } from '@prisma/client';
import prisma from '../lib/prisma';

type IndustryCategory = 'PHOTOGRAPHY' | 'ART' | 'DESIGN';

function getIndustryCategory(industry: IndustryType | null | undefined): IndustryCategory {
  switch (industry) {
    case 'PHOTOGRAPHY':
    case 'VIDEOGRAPHY':
    case 'CONTENT_CREATION':
      return 'PHOTOGRAPHY';
    case 'FINE_ART':
    case 'ILLUSTRATION':
    case 'SCULPTURE':
      return 'ART';
    case 'GRAPHIC_DESIGN':
    case 'WEB_DESIGN':
    case 'BRANDING':
    case 'OTHER':
    default:
      return 'DESIGN';
  }
}

interface DemoData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: 'PHOTOGRAPHY' | 'VIDEOGRAPHY' | 'GRAPHIC_DESIGN' | 'WEB_DESIGN' | 'BRANDING' | 'CONTENT_CREATION' | 'CONSULTING' | 'OTHER';
  projectTitle: string;
  description: string;
  budget: string;
  timeline: string;
  industry: IndustryType;
  deliverableType: 'DIGITAL_FILES' | 'PHYSICAL_ART' | 'PRINTS' | 'SERVICE' | 'WEBSITE' | 'MIXED';
  source: 'WEBSITE' | 'INSTAGRAM' | 'FACEBOOK' | 'REFERRAL' | 'GOOGLE' | 'LINKEDIN' | 'TIKTOK' | 'EMAIL' | 'OTHER';
  tags: string[];
  estimatedValue: number;
  lineItems: { description: string; quantity: number; price: number; total: number }[];
  total: number;
  terms: string;
  activityDescription: string;
  interactionContent: string;
}

const DEMO_DATA: Record<IndustryCategory, DemoData> = {
  PHOTOGRAPHY: {
    clientName: 'Sarah Johnson (Demo)',
    clientEmail: 'sarah.demo@example.com',
    clientPhone: '(555) 123-4567',
    serviceType: 'PHOTOGRAPHY',
    projectTitle: 'Wedding Photography',
    description: 'Beautiful outdoor wedding at Rosewood Gardens. Full day coverage with engagement shoot included. This is a sample project to help you explore KOLOR STUDIO!',
    budget: '$3,000 - $5,000',
    timeline: 'June 2026',
    industry: 'PHOTOGRAPHY',
    deliverableType: 'DIGITAL_FILES',
    source: 'INSTAGRAM',
    tags: ['demo', 'wedding'],
    estimatedValue: 3500,
    lineItems: [
      { description: '8 hours wedding photography', quantity: 1, price: 2000, total: 2000 },
      { description: 'Professional editing (200+ photos)', quantity: 1, price: 800, total: 800 },
      { description: 'Online gallery delivery', quantity: 1, price: 200, total: 200 },
    ],
    total: 3000,
    terms: 'A 50% deposit is required to secure the date. Remaining balance due 7 days before the event.',
    activityDescription: 'Wedding photography quote sent to Sarah Johnson',
    interactionContent: 'Sent initial quote for wedding photography package. Sarah loved the pricing and mood board!',
  },
  ART: {
    clientName: 'Marcus Chen (Demo)',
    clientEmail: 'marcus.demo@example.com',
    clientPhone: '(555) 987-6543',
    serviceType: 'OTHER',
    projectTitle: 'Custom Portrait Commission',
    description: 'Large-scale oil portrait for a private collector. 36x48 inches, realistic style with a moody chiaroscuro background. This is a sample project to help you explore KOLOR STUDIO!',
    budget: '$4,000 - $6,000',
    timeline: 'August 2026',
    industry: 'FINE_ART',
    deliverableType: 'PHYSICAL_ART',
    source: 'REFERRAL',
    tags: ['demo', 'commission', 'portrait'],
    estimatedValue: 5000,
    lineItems: [
      { description: 'Custom oil portrait (36x48 in.)', quantity: 1, price: 4000, total: 4000 },
      { description: 'Premium framing & varnish', quantity: 1, price: 600, total: 600 },
      { description: 'Insured shipping & crating', quantity: 1, price: 400, total: 400 },
    ],
    total: 5000,
    terms: 'A 40% deposit is required to begin work. Progress photos sent at sketch and mid-painting stages. Balance due upon completion before shipping.',
    activityDescription: 'Portrait commission quote sent to Marcus Chen',
    interactionContent: 'Sent initial quote for the custom portrait commission. Marcus was excited about the concept sketch!',
  },
  DESIGN: {
    clientName: 'Olivia Park (Demo)',
    clientEmail: 'olivia.demo@example.com',
    clientPhone: '(555) 456-7890',
    serviceType: 'BRANDING',
    projectTitle: 'Brand Identity Package',
    description: 'Complete brand identity for a new wellness startup — logo, color palette, typography, and brand guidelines. This is a sample project to help you explore KOLOR STUDIO!',
    budget: '$2,500 - $4,000',
    timeline: 'July 2026',
    industry: 'GRAPHIC_DESIGN',
    deliverableType: 'DIGITAL_FILES',
    source: 'WEBSITE',
    tags: ['demo', 'branding', 'identity'],
    estimatedValue: 3200,
    lineItems: [
      { description: 'Logo design (3 concepts + revisions)', quantity: 1, price: 1500, total: 1500 },
      { description: 'Color palette & typography system', quantity: 1, price: 800, total: 800 },
      { description: 'Brand guidelines document (PDF)', quantity: 1, price: 700, total: 700 },
    ],
    total: 3000,
    terms: 'A 50% deposit is required to begin. Two rounds of revisions included. Final files delivered in all formats (AI, PDF, PNG, SVG).',
    activityDescription: 'Brand identity quote sent to Olivia Park',
    interactionContent: 'Sent initial quote for the brand identity package. Olivia loves the moodboard and can\'t wait to see concepts!',
  },
};

export async function createDemoProject(userId: string, industry?: IndustryType | null): Promise<void> {
  try {
    const existing = await prisma.lead.count({ where: { assignedToId: userId } });
    if (existing > 0) return;

    const category = getIndustryCategory(industry);
    const d = DEMO_DATA[category];

    const now = new Date();
    const eventDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const lead = await prisma.lead.create({
      data: {
        assignedToId: userId,
        clientName: d.clientName,
        clientEmail: d.clientEmail,
        clientPhone: d.clientPhone,
        serviceType: d.serviceType,
        projectTitle: d.projectTitle,
        description: d.description,
        budget: d.budget,
        timeline: d.timeline,
        eventDate,
        projectType: 'SERVICE',
        industry: d.industry,
        deliverableType: d.deliverableType,
        status: 'QUOTED',
        priority: 'HIGH',
        source: d.source,
        score: 85,
        pipelineStatus: 'QUOTED',
        estimatedValue: d.estimatedValue,
        isDemoData: true,
        tags: d.tags,
      },
    });

    const shortId = userId.slice(0, 8).toUpperCase();
    await prisma.quote.create({
      data: {
        leadId: lead.id,
        createdById: userId,
        quoteNumber: `Q-DEMO-${shortId}`,
        lineItems: d.lineItems,
        subtotal: d.total,
        tax: 0,
        taxAmount: 0,
        total: d.total,
        paymentTerms: 'DEPOSIT_50',
        validUntil,
        status: 'SENT',
        sentAt: now,
        terms: d.terms,
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId,
        type: 'QUOTE_SENT',
        description: d.activityDescription,
      },
    });

    await prisma.interaction.create({
      data: {
        leadId: lead.id,
        type: 'EMAIL_SENT',
        content: d.interactionContent,
      },
    });

    console.log(`Demo project (${category}) created for user:`, userId);
  } catch (error) {
    console.error('Failed to create demo project:', error);
  }
}
