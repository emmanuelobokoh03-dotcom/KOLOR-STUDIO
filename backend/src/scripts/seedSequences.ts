import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDefaultSequences(userId: string): Promise<void> {
  try {
    const exists = await prisma.emailSequence.findFirst({ where: { userId } });
    if (exists) return;

    await prisma.emailSequence.create({
      data: {
        userId,
        name: 'Quote Follow-Up',
        description: 'Automatic follow-ups after sending a quote. Stops if client responds or accepts.',
        trigger: 'QUOTE_SENT',
        active: true,
        steps: {
          create: [
            {
              order: 0,
              delayDays: 3,
              subject: 'Quick check-in about your {projectTitle}',
              body: `Hi {firstName},\n\nJust wanted to check if you had a chance to review the quote I sent for your project "{projectTitle}"?\n\nHappy to answer any questions or adjust anything to better fit your needs!\n\nLooking forward to hearing from you,\n{userName}`,
            },
            {
              order: 1,
              delayDays: 7,
              subject: 'Still interested in {projectTitle}?',
              body: `Hi {firstName},\n\nI know you're probably busy, but I wanted to follow up on the quote for "{projectTitle}".\n\nIf pricing is a concern, I'd be happy to discuss options that might work better for your budget.\n\nWould love to work with you!\n\nBest,\n{userName}`,
            },
            {
              order: 2,
              delayDays: 10,
              subject: 'Final follow-up: {projectTitle}',
              body: `Hi {firstName},\n\nI wanted to reach out one last time about "{projectTitle}".\n\nIf you've decided to go another direction, no worries at all! If you're still interested, I'd love to chat.\n\nEither way, I appreciate you considering {studioName}!\n\nCheers,\n{userName}`,
            },
          ],
        },
      },
    });

    console.log('[Seq] Default sequences seeded for user:', userId);
  } catch (error) {
    console.error('[Seq] Seed error:', error);
  }
}
