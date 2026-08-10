// iter 289-v3c3a.1 — Seed one PENDING DMThread + DM_REQUEST_RECEIVED notification
// for the current-user recipient so the bell dropdown is exerciseable in the UI.
//
// Uses the standard test account (bookingtest@test.com) as the recipient.
// Falls back to the first non-synthetic profile if that account has no
// CommunityProfile yet.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find recipient — prefer bookingtest, fall back to first real profile
  let recipient = await prisma.communityProfile.findFirst({
    where: { user: { email: 'bookingtest@test.com' }, isSynthetic: false },
    include: { user: { select: { firstName: true, email: true } } },
  });

  if (!recipient) {
    recipient = await prisma.communityProfile.findFirst({
      where: { isSynthetic: false },
      include: { user: { select: { firstName: true, email: true } } },
    });
  }

  if (!recipient) {
    console.log('[SEED] No real recipient profile found — creating between two synthetic profiles');
    const twoSynth = await prisma.communityProfile.findMany({
      where: { isSynthetic: true },
      take: 2,
      include: { user: { select: { firstName: true, email: true } } },
    });
    if (twoSynth.length < 2) {
      console.error('[SEED] Not enough profiles');
      process.exit(1);
    }
    recipient = twoSynth[0];
  }

  // Sender must be a different profile
  const sender = await prisma.communityProfile.findFirst({
    where: { id: { not: recipient.id }, isSynthetic: true },
    include: { user: { select: { firstName: true } } },
  });

  if (!sender) {
    console.error('[SEED] No sender profile available');
    process.exit(1);
  }

  // Guarantee non-mutual follow so status stays PENDING
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: sender.id, followingId: recipient.id },
        { followerId: recipient.id, followingId: sender.id },
      ],
    },
  });

  // Delete any existing thread between the two so we can create a fresh PENDING one
  await prisma.dMThread.deleteMany({
    where: {
      OR: [
        { participantA: sender.id, participantB: recipient.id },
        { participantA: recipient.id, participantB: sender.id },
      ],
    },
  });

  const thread = await prisma.dMThread.create({
    data: {
      participantA: sender.id,
      participantB: recipient.id,
      status: 'PENDING',
    },
  });

  // Add an opening message so the request has something to read
  await prisma.dMMessage.create({
    data: {
      threadId: thread.id,
      senderId: sender.id,
      content: `Hi ${recipient.user?.firstName || 'there'} — love your recent work. Would love to connect.`,
    },
  });

  // Fire the DM_REQUEST_RECEIVED notification
  await prisma.notification.create({
    data: {
      recipientId: recipient.id,
      type: 'DM_REQUEST_RECEIVED',
      fromUserId: sender.id,
      threadId: thread.id,
    },
  });

  console.log('[SEED] Complete');
  console.log('  Sender  :', sender.user?.firstName || 'synthetic', '(', sender.handle, ')');
  console.log('  Recipient:', recipient.user?.firstName || 'synthetic', '(', recipient.user?.email || 'synthetic', '→', recipient.handle, ')');
  console.log('  Thread  :', thread.id, 'status:', thread.status);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
