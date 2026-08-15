// iter 289-v3c3b — Backfill synthetic CommunityProfile.subHeadline values
// from the SUB_CHIPS taxonomy so the Discover sub-chip filter returns
// non-empty results. Deterministic hash-based assignment (idempotent on
// re-run). Maps Prisma primaryIndustry enum → taxonomy bucket.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mirror of frontend/src/lib/communityTaxonomy.ts SUB_CHIPS.
const SUB_CHIPS: Record<'DESIGN' | 'PHOTOGRAPHY' | 'FINE_ART', string[]> = {
  DESIGN: [
    'Graphic Design', 'Brand Design', 'Product Design', 'Web Design',
    'Illustration', 'UI/UX', 'Motion Design', 'Editorial Design',
    'Packaging Design', 'Type Design',
  ],
  PHOTOGRAPHY: [
    'Wedding Photography', 'Lifestyle Photography', 'Documentary',
    'Portrait', 'Commercial', 'Fashion', 'Landscape',
    'Street Photography', 'Architectural', 'Event Photography',
  ],
  FINE_ART: [
    'Oil on Canvas', 'Acrylic on Canvas', 'Original Paintings',
    'Watercolor', 'Sculpture', 'Mixed Media', 'Commissions', 'Murals',
    'Digital Painting', 'Printmaking',
  ],
};

// Prisma primaryIndustry enum → taxonomy bucket. Dashboard uses these same
// buckets internally (see availableIndustries in Dashboard.tsx).
function bucketFor(industry: string | null | undefined): keyof typeof SUB_CHIPS | null {
  if (!industry) return null;
  const design = ['GRAPHIC_DESIGN', 'WEB_DESIGN', 'ILLUSTRATION', 'BRANDING'];
  const photo = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'CONTENT_CREATION'];
  const fineArt = ['FINE_ART', 'SCULPTURE'];
  if (design.includes(industry)) return 'DESIGN';
  if (photo.includes(industry)) return 'PHOTOGRAPHY';
  if (fineArt.includes(industry)) return 'FINE_ART';
  return null;
}

async function main() {
  const profiles = await prisma.communityProfile.findMany({
    where: { isSynthetic: true },
    include: { user: { select: { primaryIndustry: true } } },
  });

  console.log(`[BACKFILL] Scanning ${profiles.length} synthetic profiles`);

  let updated = 0;
  let skipped = 0;
  for (const profile of profiles) {
    const bucket = bucketFor(profile.user.primaryIndustry as string | null);
    if (!bucket) { skipped++; continue; }
    const chips = SUB_CHIPS[bucket];
    // Deterministic hash: sum of char codes mod chip count. Reproducible
    // across runs — safe to re-invoke without shuffling values.
    const hash = profile.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const subHeadline = chips[hash % chips.length];
    if (profile.subHeadline === subHeadline) { skipped++; continue; }
    await prisma.communityProfile.update({
      where: { id: profile.id },
      data: { subHeadline },
    });
    updated++;
  }

  console.log(`[BACKFILL] Updated ${updated}, skipped ${skipped}`);

  const distribution = await prisma.communityProfile.groupBy({
    by: ['subHeadline'],
    _count: true,
    where: { subHeadline: { not: null } },
  });
  console.log('[BACKFILL] Distribution:');
  distribution
    .sort((a, b) => (b._count as number) - (a._count as number))
    .forEach(d => console.log(`  ${d.subHeadline}: ${d._count}`));
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
