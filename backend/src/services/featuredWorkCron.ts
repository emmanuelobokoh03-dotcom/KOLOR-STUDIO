// iter 288-v3 — Algorithmic Featured Work rotation (weekly Sunday 04:00 UTC)
// Selects one top shot per creative industry by engagement composite.
// Populates the FeaturedPost model that iter 287-v3a's FeaturedBanner
// component consumes via GET /api/community/featured/work.

import { PrismaClient, CreativeIndustry } from '@prisma/client';

const prisma = new PrismaClient();

const INDUSTRIES: CreativeIndustry[] = ['PHOTOGRAPHY', 'DESIGN', 'FINE_ART'];

// Composite score weights
const W_LIKE = 1.0;
const W_COMMENT = 1.5;
const W_FOLLOWER_LOG = 3.0;

// Selection window: last 30 days
const WINDOW_DAYS = 30;
// Freshness rotation: 4 weeks
const FRESHNESS_WEEKS = 4;

function getSundayOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day;
  const sunday = new Date(d);
  sunday.setUTCDate(diff);
  sunday.setUTCHours(0, 0, 0, 0);
  return sunday;
}

export async function generateWeeklyFeaturedWork(): Promise<{
  industriesProcessed: number;
  featuredCreated: number;
}> {
  const startedAt = Date.now();
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 86400000);
  const freshnessStart = new Date(now.getTime() - FRESHNESS_WEEKS * 7 * 86400000);
  const currentWeek = getSundayOfWeek(now);

  // Shots featured in last 4 weeks — exclude from candidates
  const recentlyFeatured = await prisma.featuredPost.findMany({
    where: { featuredWeek: { gte: freshnessStart } },
    select: { postId: true },
  });
  const excludeIds = new Set(recentlyFeatured.map((f) => f.postId));

  let featuredCreated = 0;

  for (const industry of INDUSTRIES) {
    const candidates = await prisma.post.findMany({
      where: {
        industry,
        hiddenFromGrid: false,
        mainImage: { not: null },
        createdAt: { gte: windowStart },
        author: { isSynthetic: false },
      },
      include: {
        _count: { select: { likes: true, comments: true } },
        author: {
          include: {
            _count: { select: { followers: true } },
          },
        },
      },
    });

    const scored = candidates
      .filter((c) => !excludeIds.has(c.id))
      .map((c) => ({
        post: c,
        score:
          c._count.likes * W_LIKE +
          c._count.comments * W_COMMENT +
          Math.log((c.author._count.followers || 0) + 1) * W_FOLLOWER_LOG,
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      console.log(`[FEATURED_WORK] ${industry}: no candidates, banner stays empty-graceful`);
      continue;
    }

    const winner = scored[0];

    // Upsert on unique index [industry, featuredWeek]
    await prisma.featuredPost.upsert({
      where: {
        industry_featuredWeek: {
          industry,
          featuredWeek: currentWeek,
        },
      },
      create: {
        postId: winner.post.id,
        industry,
        featuredWeek: currentWeek,
      },
      update: {
        postId: winner.post.id,
      },
    });

    featuredCreated++;
    console.log(
      `[FEATURED_WORK] ${industry}: ${winner.post.id} (score ${winner.score.toFixed(2)})`
    );
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[FEATURED_WORK] Rotation complete — ${featuredCreated}/${INDUSTRIES.length} industries populated in ${elapsedMs}ms`
  );

  return { industriesProcessed: INDUSTRIES.length, featuredCreated };
}
