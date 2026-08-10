// iter 289-v3c3a STEP 1 — Backfill CommunityProfile.handle
// Generates handles from firstName (lowercased, sanitized) + user.id 4-char suffix.
// Format: firstname-abc1 (deduplicated via extended suffix on collision)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function sanitize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function main() {
  const profiles = await prisma.communityProfile.findMany({
    where: { handle: null },
    include: { user: { select: { firstName: true, id: true } } },
  });

  console.log(`[BACKFILL] ${profiles.length} profiles need handles`);

  let updated = 0;
  for (const p of profiles) {
    const base = sanitize(p.user.firstName || 'creator') || 'creator';
    const suffix = p.user.id.slice(-4).toLowerCase();
    let handle = `${base}-${suffix}`;

    // Verify no collision
    const existing = await prisma.communityProfile.findFirst({ where: { handle } });
    if (existing) {
      const extendedSuffix = p.user.id.slice(-8).toLowerCase();
      handle = `${base}-${extendedSuffix}`;
      console.warn(`  Collision → extended handle: ${handle}`);
    }

    await prisma.communityProfile.update({
      where: { id: p.id },
      data: { handle },
    });
    updated++;
  }

  console.log(`[BACKFILL] Complete. Updated ${updated} profiles.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
