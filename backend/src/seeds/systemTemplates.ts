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

  // ===== PHOTOGRAPHY — Portrait & Commercial =====
  {
    name: 'Portrait & Commercial Photography',
    description: 'Flexible workflow for portrait, headshot, commercial, and editorial shoots',
    industry: 'PHOTOGRAPHY',
    projectType: 'SERVICE',
    stages: [
      { name: 'Inquiry & Brief', type: 'DISCOVERY', order: 0, required: true,
        description: 'Understand the shoot purpose, subject count, location preferences, mood references, and usage rights needed',
        fieldConfig: { fields: ['shootPurpose', 'subjectCount', 'location', 'usageRights', 'moodBoard'] } },
      { name: 'Quote & Package', type: 'QUOTATION', order: 1, required: true,
        description: 'Propose session rate, number of edited images, licensing terms, and any additional usage fees' },
      { name: 'Contract & Deposit', type: 'AGREEMENT', order: 2, required: true,
        description: 'Sign shoot contract — include usage rights clause — and collect 50% deposit' },
      { name: 'Pre-shoot Planning', type: 'SCHEDULING', order: 3, required: true,
        description: 'Confirm location, send shot list, discuss wardrobe and styling, prep call if needed' },
      { name: 'Shoot Day', type: 'CREATION', order: 4, required: true,
        description: 'Execute the session — capture hero shots, alternates, and selects' },
      { name: 'Selects & Culling', type: 'REVIEW', order: 5, required: true,
        description: 'Cull and export selects for client to choose final images for editing' },
      { name: 'Retouching', type: 'CREATION', order: 6, required: true,
        description: 'Full retouch on approved selects — skin, colour grade, compositing if required' },
      { name: 'Final Delivery', type: 'DELIVERY', order: 7, required: true,
        description: 'Deliver high-res files via gallery link — include web-optimised versions for digital use' },
      { name: 'Final Payment', type: 'PAYMENT', order: 8, required: true,
        description: 'Collect remaining 50% balance on delivery' },
      { name: 'Testimonial & Referral', type: 'FOLLOWUP', order: 9, required: false,
        description: 'Request a review, ask for referrals, offer next-session discount for repeat clients' },
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
      { name: 'Installation Photo', type: 'FOLLOWUP', order: 9, required: false,
        description: 'Request photo of artwork displayed, offer future commissions' },
    ],
  },

  // ===== DESIGN — Creative Design Project =====
  {
    name: 'Creative Design Project',
    description: 'Flexible project workflow for brand, UI/UX, graphic, and motion design projects',
    industry: 'DESIGN',
    projectType: 'PROJECT',
    stages: [
      { name: 'Discovery & Brief', type: 'DISCOVERY', order: 0, required: true,
        description: 'Deep-dive into project goals, target audience, brand values, competitive landscape, and deliverable requirements',
        fieldConfig: { fields: ['projectGoals', 'targetAudience', 'competitors', 'moodBoard', 'deliverables'] } },
      { name: 'Proposal & Scope', type: 'QUOTATION', order: 1, required: true,
        description: 'Present scoped proposal — deliverables, timeline, revision rounds included, and fee breakdown' },
      { name: 'Contract & Deposit', type: 'AGREEMENT', order: 2, required: true,
        description: 'Sign design contract and collect deposit (typically 30–50% depending on project size)' },
      { name: 'Initial Concepts', type: 'CREATION', order: 3, required: true,
        description: 'Present initial design directions — moodboards, sketches, wireframes, or style tiles depending on discipline' },
      { name: 'Client Feedback', type: 'REVIEW', order: 4, required: true,
        description: 'Collect structured feedback — client selects direction and provides consolidated revision notes' },
      { name: 'Refinement', type: 'CREATION', order: 5, required: true,
        description: 'Execute refinements on approved direction — included revision rounds applied here' },
      { name: 'Final Sign-off', type: 'REVIEW', order: 6, required: true,
        description: 'Present final deliverable for written approval before file handover' },
      { name: 'File Handover', type: 'DELIVERY', order: 7, required: true,
        description: 'Deliver all agreed files and assets — source files, exports, style guides, or production-ready assets as scoped' },
      { name: 'Final Payment', type: 'PAYMENT', order: 8, required: true,
        description: 'Collect remaining balance on file handover' },
      { name: 'Referral & Retainer', type: 'FOLLOWUP', order: 9, required: false,
        description: 'Request testimonial, propose ongoing retainer or next project phase' },
    ],
  },
];

// Map industries to their best-fit template
export const INDUSTRY_TEMPLATE_MAP: Record<string, string[]> = {
  PHOTOGRAPHY: ['Wedding Photography', 'Portrait & Commercial Photography'],
  DESIGN:      ['Creative Design Project'],
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
