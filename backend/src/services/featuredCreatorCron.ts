// iter 288-v3 — Algorithmic Featured Creator rotation (weekly Sunday 04:15 UTC)
// Selects top creator per creative industry by velocity + engagement + follower growth.
// Populates the FeaturedCreator model that iter 287-v3a's CreatorsOfWeekRail
// component consumes via GET /api/community/featured/creators.

import { PrismaClient, CreativeIndustry } from '@prisma/client';

const prisma = new PrismaClient();

const INDUSTRIES: CreativeIndustry[] = ['PHOTOGRAPHY', 'DESIGN', 'FINE_ART'];

// Composite score weights
const W_ENGAGEMENT = 2.0;
const W_FOLLOWER_GROWTH = 3.0;
const W_VELOCITY = 1.5;

const WINDOW_DAYS = 14;
const FRESHNESS_WEEKS = 2;

function getSundayOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day;
  const sunday = new Date(d);
  sunday.setUTCDate(diff);
  sunday.setUTCHours(0, 0, 0, 0);
  return sunday;
}

export async function generateWeeklyFeaturedCreators(): Promise<{
  industriesProcessed: number;
  creatorsCreated: number;
}> {
  const startedAt = Date.now();
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 86400000);
  const freshnessStart = new Date(now.getTime() - FRESHNESS_WEEKS * 7 * 86400000);
  const currentWeek = getSundayOfWeek(now);

  const recentlyFeatured = await prisma.featuredCreator.findMany({
    where: { featuredWeek: { gte: freshnessStart } },
    select: { profileId: true },
  });
  const excludeIds = new Set(recentlyFeatured.map((f) => f.profileId));

  let creatorsCreated = 0;

  for (const industry of INDUSTRIES) {
    // Real, public profiles in this industry with activity in the window
    const profiles = await prisma.communityProfile.findMany({
      where: {
        isSynthetic: false,
        isPublic: true,
        user: { industry },
      },
      include: {
        posts: {
          where: {
            createdAt: { gte: windowStart },
            hiddenFromGrid: false,
          },
          include: {
            _count: { select: { likes: true, comments: true } },
          },
        },
        followers: {
          where: { createdAt: { gte: windowStart } },
          select: { followerId: true },
        },
      },
    });

    const scored = profiles
      .filter((p) => !excludeIds.has(p.id))
      .map((p) => {
        const engagement = p.posts.reduce(
          (sum, post) => sum + post._count.likes + post._count.comments * 1.5,
          0
        );
        const velocity = p.posts.length;
        const followerGrowth = p.followers.length;
        const score =
          engagement * W_ENGAGEMENT +
          followerGrowth * W_FOLLOWER_GROWTH +
          velocity * W_VELOCITY;
        return { profile: p, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      console.log(`[FEATURED_CREATORS] ${industry}: no candidates, rail stays empty-graceful`);
      continue;
    }

    const winner = scored[0];

    await prisma.featuredCreator.upsert({
      where: {
        industry_featuredWeek: {
          industry,
          featuredWeek: currentWeek,
        },
      },
      create: {
        profileId: winner.profile.id,
        industry,
        featuredWeek: currentWeek,
      },
      update: {
        profileId: winner.profile.id,
      },
    });

    creatorsCreated++;
    console.log(
      `[FEATURED_CREATORS] ${industry}: ${winner.profile.handle} (score ${winner.score.toFixed(2)})`
    );
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[FEATURED_CREATORS] Rotation complete — ${creatorsCreated}/${INDUSTRIES.length} slots populated in ${elapsedMs}ms`
  );

  return { industriesProcessed: INDUSTRIES.length, creatorsCreated };
}
