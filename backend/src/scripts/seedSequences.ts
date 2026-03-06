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

interface SequenceStep {
  order: number;
  delayDays: number;
  subject: string;
  body: string;
}

interface SequenceData {
  name: string;
  description: string;
  steps: SequenceStep[];
}

const SEQUENCE_DATA: Record<IndustryCategory, SequenceData> = {
  PHOTOGRAPHY: {
    name: 'Quote Follow-Up',
    description: 'Automatic follow-ups after sending a quote. Stops if client responds or accepts.',
    steps: [
      {
        order: 0,
        delayDays: 3,
        subject: 'Quick check-in about your {projectTitle}',
        body: `Hi {firstName},\n\nJust wanted to check if you had a chance to review the quote I sent for your shoot "{projectTitle}"?\n\nHappy to answer any questions or adjust the package to better fit your needs!\n\nLooking forward to hearing from you,\n{userName}`,
      },
      {
        order: 1,
        delayDays: 7,
        subject: 'Still interested in {projectTitle}?',
        body: `Hi {firstName},\n\nI know you're probably busy, but I wanted to follow up on the quote for "{projectTitle}".\n\nIf the pricing or package isn't quite right, I'd love to discuss options — I'm flexible and want to make sure you get the perfect coverage.\n\nWould love to work with you!\n\nBest,\n{userName}`,
      },
      {
        order: 2,
        delayDays: 10,
        subject: 'Final follow-up: {projectTitle}',
        body: `Hi {firstName},\n\nI wanted to reach out one last time about "{projectTitle}".\n\nIf you've decided to go another direction, no worries at all! If you're still interested, I'd love to chat and lock in your date before it fills up.\n\nEither way, I appreciate you considering {studioName}!\n\nCheers,\n{userName}`,
      },
    ],
  },
  ART: {
    name: 'Commission Follow-Up',
    description: 'Automatic follow-ups after sending a commission quote. Stops if client responds or accepts.',
    steps: [
      {
        order: 0,
        delayDays: 3,
        subject: 'Checking in on your commission — {projectTitle}',
        body: `Hi {firstName},\n\nI wanted to check in and see if you had any questions about the quote for "{projectTitle}".\n\nI'm happy to discuss size options, framing, or any other details to make sure the piece is exactly what you're envisioning.\n\nLooking forward to your thoughts,\n{userName}`,
      },
      {
        order: 1,
        delayDays: 7,
        subject: 'Still thinking about {projectTitle}?',
        body: `Hi {firstName},\n\nJust a quick follow-up on the commission quote for "{projectTitle}". I know art is a personal investment, so take your time.\n\nIf budget is a consideration, I do offer payment plans for larger pieces. Happy to chat about what works for you.\n\nWarm regards,\n{userName}`,
      },
      {
        order: 2,
        delayDays: 10,
        subject: 'One last note about {projectTitle}',
        body: `Hi {firstName},\n\nI wanted to reach out one final time regarding "{projectTitle}". My commission calendar is filling up, and I'd love to reserve a slot for your piece if you're still interested.\n\nIf you've decided to pass, absolutely no hard feelings — I appreciate you considering my work!\n\nAll the best,\n{userName}`,
      },
    ],
  },
  DESIGN: {
    name: 'Project Follow-Up',
    description: 'Automatic follow-ups after sending a project quote. Stops if client responds or accepts.',
    steps: [
      {
        order: 0,
        delayDays: 3,
        subject: 'Quick follow-up on {projectTitle}',
        body: `Hi {firstName},\n\nJust checking in — did you get a chance to look over the proposal for "{projectTitle}"?\n\nI'm available to hop on a quick call if you'd like to walk through the scope or discuss any adjustments.\n\nBest,\n{userName}`,
      },
      {
        order: 1,
        delayDays: 7,
        subject: 'Any thoughts on {projectTitle}?',
        body: `Hi {firstName},\n\nWanted to follow up on the quote for "{projectTitle}". I know timelines can shift — if the scope or budget needs tweaking, I'm happy to work with you on a plan that fits.\n\nWould love to bring this project to life with you!\n\nCheers,\n{userName}`,
      },
      {
        order: 2,
        delayDays: 10,
        subject: 'Last check-in: {projectTitle}',
        body: `Hi {firstName},\n\nThis is my last follow-up on "{projectTitle}". If you've gone in another direction, totally understand — these decisions take time.\n\nIf this project comes back around, my door is always open. Thanks for considering {studioName}!\n\nBest regards,\n{userName}`,
      },
    ],
  },
};

export async function seedDefaultSequences(userId: string, industry?: IndustryType | null): Promise<void> {
  try {
    const exists = await prisma.emailSequence.findFirst({ where: { userId } });
    if (exists) return;

    const category = getIndustryCategory(industry);
    const data = SEQUENCE_DATA[category];

    await prisma.emailSequence.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        trigger: 'QUOTE_SENT',
        active: true,
        steps: {
          create: data.steps,
        },
      },
    });

    console.log(`[Seq] Default sequences (${category}) seeded for user:`, userId);
  } catch (error) {
    console.error('[Seq] Seed error:', error);
  }
}
