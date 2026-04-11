import prisma from '../lib/prisma';

export interface TemplateDefinition {
  name: string;
  description: string;
  industry: string;
  projectType: string;
  stages: {
    name: string;
    type: string;
    order: number;
    required: boolean;
    description: string;
    fieldConfig?: any;
  }[];
}

export const SYSTEM_TEMPLATES: TemplateDefinition[] = [
  // ===== PHOTOGRAPHY — Wedding Shoot =====
  {
    name: 'Wedding Photography',
    description: 'Complete workflow for wedding photography from consultation to delivery',
    industry: 'PHOTOGRAPHY',
    projectType: 'SERVICE',
    stages: [
      { name: 'Initial Consultation', type: 'DISCOVERY', order: 0, required: true,
        description: 'Discuss wedding date, venue, guest count, style preferences',
        fieldConfig: { fields: ['weddingDate', 'venue', 'guestCount', 'styleNotes'] } },
      { name: 'Package & Pricing', type: 'QUOTATION', order: 1, required: true,
        description: 'Present packages — hours of coverage, number of shooters, deliverables included' },
      { name: 'Contract & Deposit', type: 'AGREEMENT', order: 2, required: true,
        description: 'Sign contract and collect 50% deposit to secure the date' },
      { name: 'Timeline Planning', type: 'SCHEDULING', order: 3, required: true,
        description: 'Create day-of timeline, build shot list, coordinate with venue/vendors' },
      { name: 'Wedding Day Shoot', type: 'CREATION', order: 4, required: true,
        description: 'Capture the ceremony, reception, portraits, and details' },
      { name: 'Proof Gallery', type: 'REVIEW', order: 5, required: true,
        description: 'Send proof gallery for client to select favorites and request edits' },
      { name: 'Final Edited Photos', type: 'DELIVERY', order: 6, required: true,
        description: 'Deliver fully edited gallery — high-res downloads + optional album' },
      { name: 'Final Payment', type: 'PAYMENT', order: 7, required: true,
        description: 'Collect remaining 50% balance' },
      { name: 'Testimonial Request', type: 'FOLLOWUP', order: 8, required: false,
        description: 'Request testimonial, offer anniversary mini-session, ask for referrals' },
    ],
  },

  // ===== FINE ART — Portrait Commission =====
  {
    name: 'Portrait Commission',
    description: 'Full workflow for custom portrait commissions from request to delivery',
    industry: 'FINE_ART',
    projectType: 'COMMISSION',
    stages: [
      { name: 'Commission Request', type: 'DISCOVERY', order: 0, required: true,
        description: 'Discuss subject matter, size, reference photos, style preferences',
        fieldConfig: { fields: ['subject', 'size', 'medium', 'referencePhotos'] } },
      { name: 'Pricing Quote', type: 'QUOTATION', order: 1, required: true,
        description: 'Quote based on size, medium, complexity, and timeline' },
      { name: 'Commission Agreement', type: 'AGREEMENT', order: 2, required: true,
        description: 'Sign commission agreement and collect 40% deposit' },
      { name: 'Initial Sketch', type: 'CREATION', order: 3, required: true,
        description: 'Create preliminary sketch or composition study for approval' },
      { name: 'Sketch Approval', type: 'REVIEW', order: 4, required: true,
        description: 'Client reviews and approves sketch before proceeding to final' },
      { name: 'Painting Process', type: 'CREATION', order: 5, required: true,
        description: 'Execute the final artwork — share progress photos at milestones' },
      { name: 'Final Approval', type: 'REVIEW', order: 6, required: true,
        description: 'Present completed artwork for final client approval' },
      { name: 'Shipping / Pickup', type: 'DELIVERY', order: 7, required: true,
        description: 'Arrange framing, packaging, and delivery or pickup' },
      { name: 'Final Payment', type: 'PAYMENT', order: 8, required: true,
        description: 'Collect remaining 60% upon delivery' },
      { name: 'Reproduction Rights', type: 'AGREEMENT', order: 9, required: true,
        description: 'REPRODUCTION RIGHTS — The Artist retains all copyright and intellectual property rights in the commissioned work. The Collector receives the physical artwork only. No reproduction rights are granted unless explicitly agreed in writing. The Collector may not reproduce, print, distribute, or create derivative works from the commissioned piece without prior written consent from the Artist. Any licensed reproduction rights shall be subject to a separate written agreement and additional fee. The Artist reserves the right to photograph and display the commissioned work in their portfolio, website, and promotional materials, unless the Collector requests confidentiality in writing prior to commission commencement.' },
      { name: 'Installation Photo', type: 'FOLLOWUP', order: 10, required: false,
        description: 'Request photo of artwork displayed, offer future commissions' },
    ],
  },

  // ===== GRAPHIC DESIGN — Logo Design =====
  {
    name: 'Logo Design Project',
    description: 'End-to-end branding workflow from discovery to file delivery',
    industry: 'DESIGN',
    projectType: 'PROJECT',
    stages: [
      { name: 'Brand Discovery', type: 'DISCOVERY', order: 0, required: true,
        description: 'Deep-dive into brand values, target audience, competitors, and aesthetic direction',
        fieldConfig: { fields: ['brandValues', 'targetAudience', 'competitors', 'moodBoard'] } },
      { name: 'Project Proposal', type: 'QUOTATION', order: 1, required: true,
        description: 'Present proposal with number of concepts, revision rounds, and deliverables' },
      { name: 'Contract & Deposit', type: 'AGREEMENT', order: 2, required: true,
        description: 'Sign design contract and collect 30% deposit' },
      { name: '3 Initial Concepts', type: 'CREATION', order: 3, required: true,
        description: 'Design 3 distinct logo concepts based on brand discovery insights' },
      { name: 'Concept Selection', type: 'REVIEW', order: 4, required: true,
        description: 'Client selects preferred direction — one concept to move forward' },
      { name: 'Refinement Rounds', type: 'CREATION', order: 5, required: true,
        description: '2 rounds of refinements on selected concept — typography, color, layout' },
      { name: 'Final Approval', type: 'REVIEW', order: 6, required: true,
        description: 'Present polished final logo for sign-off' },
      { name: 'File Delivery', type: 'DELIVERY', order: 7, required: true,
        description: 'Deliver all formats — SVG, PNG, PDF, EPS, plus brand guidelines document' },
      { name: 'Final Payment', type: 'PAYMENT', order: 8, required: true,
        description: 'Collect remaining 70% upon file delivery' },
      { name: 'Brand Collateral Offer', type: 'FOLLOWUP', order: 9, required: false,
        description: 'Propose business cards, letterhead, social media templates as follow-up work' },
    ],
  },
];

// Map industries to their best-fit template
export const INDUSTRY_TEMPLATE_MAP: Record<string, string[]> = {
  PHOTOGRAPHY: ['Wedding Photography'],
  DESIGN:      ['Logo Design Project'],
  FINE_ART:    ['Portrait Commission'],
};

/**
 * Create system templates for a user based on their industry.
 * Returns the created templates.
 */
export async function seedTemplatesForUser(userId: string, industry?: string): Promise<any[]> {
  const templateNames = industry 
    ? (INDUSTRY_TEMPLATE_MAP[industry] || INDUSTRY_TEMPLATE_MAP['PHOTOGRAPHY'])
    : Object.values(INDUSTRY_TEMPLATE_MAP).flat().filter((v, i, a) => a.indexOf(v) === i);

  const templatesToCreate = SYSTEM_TEMPLATES.filter(t => templateNames.includes(t.name));
  const created: any[] = [];

  for (const tmpl of templatesToCreate) {
    // Skip if user already has this template
    const existing = await prisma.workflowTemplate.findFirst({
      where: { userId, name: tmpl.name }
    });
    if (existing) { created.push(existing); continue; }

    const template = await prisma.workflowTemplate.create({
      data: {
        name: tmpl.name,
        description: tmpl.description,
        industry: tmpl.industry as any,
        projectType: tmpl.projectType as any,
        isDefault: true,
        isSystem: true,
        userId,
        stages: {
          create: tmpl.stages.map(s => ({
            name: s.name,
            type: s.type as any,
            order: s.order,
            required: s.required,
            description: s.description,
            fieldConfig: s.fieldConfig || null,
          })),
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    created.push(template);
  }

  return created;
}

/**
 * Seed ALL system templates for a user (used in admin/setup).
 */
export async function seedAllTemplatesForUser(userId: string): Promise<any[]> {
  const created: any[] = [];
  for (const tmpl of SYSTEM_TEMPLATES) {
    const existing = await prisma.workflowTemplate.findFirst({
      where: { userId, name: tmpl.name }
    });
    if (existing) { created.push(existing); continue; }

    const template = await prisma.workflowTemplate.create({
      data: {
        name: tmpl.name,
        description: tmpl.description,
        industry: tmpl.industry as any,
        projectType: tmpl.projectType as any,
        isDefault: true,
        isSystem: true,
        userId,
        stages: {
          create: tmpl.stages.map(s => ({
            name: s.name,
            type: s.type as any,
            order: s.order,
            required: s.required,
            description: s.description,
            fieldConfig: s.fieldConfig || null,
          })),
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    created.push(template);
  }
  return created;
}
