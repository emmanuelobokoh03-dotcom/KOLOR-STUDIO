// Peer Suggestion Generator (iter 286)
// Weekly cron job. For each active real creator, generate top-20 peer suggestions
// weighted by shared industry, city, mutual follows, appreciation overlap,
// collection overlap, recent activity. Excludes synthetic profiles.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCORING_WEIGHTS = {
  SHARED_INDUSTRY: 3,
  SAME_CITY: 2,
  SAME_COUNTRY: 1,
  MUTUAL_FOLLOW: 1,
  COLLECTION_OVERLAP: 0.5,
  APPRECIATION_OVERLAP: 0.3,
  RECENT_ACTIVITY: 1,
} as const;

const SUGGESTIONS_PER_CREATOR = 20;

interface SuggestionScore {
  toProfileId: string;
  score: number;
  reasonCode: string;
}

/**
 * Generate peer suggestions for all real, active community profiles.
 * Called from scheduler.ts weekly (Sundays 04:00 UTC — before digest run).
 */
export async function generateWeeklyPeerSuggestions(): Promise<{
  profilesProcessed: number;
  suggestionsGenerated: number;
}> {
  const startedAt = Date.now();

  const realProfiles = await prisma.communityProfile.findMany({
    where: { isSynthetic: false },
    include: {
      user: { select: { primaryIndustry: true, industry: true } },
      following: { select: { followingId: true } },
    },
  });

  // iter 288-v3 refinement — Precompute per-profile appreciation footprint
  // (set of profileIds whose posts this profile has liked). Used to score
  // "you both appreciate the same creators" as a soft affinity signal.
  const appreciationFootprints = new Map<string, Set<string>>();
  const appreciationRows = await prisma.postLike.findMany({
    select: {
      userId: true,
      post: { select: { authorId: true } },
    },
  });
  for (const row of appreciationRows) {
    if (!row.post || !row.post.authorId) continue;
    if (row.post.authorId === row.userId) continue; // self-likes irrelevant
    if (!appreciationFootprints.has(row.userId)) {
      appreciationFootprints.set(row.userId, new Set());
    }
    appreciationFootprints.get(row.userId)!.add(row.post.authorId);
  }

  let totalSuggestions = 0;

  for (const profile of realProfiles) {
    const candidates = await prisma.communityProfile.findMany({
      where: {
        AND: [
          { id: { not: profile.id } },
          { isSynthetic: false },
          { isPublic: true },
        ],
      },
      include: {
        user: { select: { primaryIndustry: true, industry: true } },
        posts: { where: { createdAt: { gte: sevenDaysAgo() } }, select: { id: true }, take: 1 },
      },
    });

    const followedIds = new Set(profile.following.map((f) => f.followingId));

    const scores: SuggestionScore[] = [];

    for (const candidate of candidates) {
      if (followedIds.has(candidate.id)) continue;

      let score = 0;
      const reasons: string[] = [];

      const profileIndustry = profile.user.primaryIndustry || profile.user.industry;
      const candIndustry = candidate.user.primaryIndustry || candidate.user.industry;

      if (profileIndustry && candIndustry && profileIndustry === candIndustry) {
        score += SCORING_WEIGHTS.SHARED_INDUSTRY;
        reasons.push('SHARED_INDUSTRY');
      }

      if (profile.city && candidate.city && profile.city === candidate.city) {
        score += SCORING_WEIGHTS.SAME_CITY;
        reasons.push('SAME_CITY');
      }

      const mutualFollows = candidate.id !== profile.id
        ? Array.from(followedIds).filter((id) => id === candidate.id).length
        : 0;
      if (mutualFollows > 0) {
        score += SCORING_WEIGHTS.MUTUAL_FOLLOW * mutualFollows;
        reasons.push('MUTUAL_FOLLOWS');
      }

      if (candidate.posts.length > 0) {
        score += SCORING_WEIGHTS.RECENT_ACTIVITY;
      }

      // iter 288-v3 refinement — appreciation overlap.
      // People whose taste we both share (measured by common creators we
      // both liked) tend to feel like peers. Overlap capped at 10 to avoid
      // any one super-liker dominating the signal.
      const myFootprint = appreciationFootprints.get(profile.id);
      const theirFootprint = appreciationFootprints.get(candidate.id);
      if (myFootprint && theirFootprint && myFootprint.size > 0 && theirFootprint.size > 0) {
        let overlap = 0;
        for (const authorId of myFootprint) {
          if (theirFootprint.has(authorId)) overlap++;
          if (overlap >= 10) break;
        }
        if (overlap > 0) {
          score += SCORING_WEIGHTS.APPRECIATION_OVERLAP * overlap;
          reasons.push('APPRECIATION_OVERLAP');
        }
      }

      if (score > 0) {
        scores.push({
          toProfileId: candidate.id,
          score,
          reasonCode: reasons[0] || 'MIXED_SIGNAL',
        });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    const top20 = scores.slice(0, SUGGESTIONS_PER_CREATOR);

    for (const suggestion of top20) {
      await prisma.peerSuggestion.upsert({
        where: {
          fromProfileId_toProfileId: {
            fromProfileId: profile.id,
            toProfileId: suggestion.toProfileId,
          },
        },
        create: {
          fromProfileId: profile.id,
          toProfileId: suggestion.toProfileId,
          score: suggestion.score,
          reasonCode: suggestion.reasonCode,
        },
        update: {
          score: suggestion.score,
          reasonCode: suggestion.reasonCode,
        },
      });
      totalSuggestions++;
    }
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[PEER_SUGGESTIONS] Generated ${totalSuggestions} suggestions across ${realProfiles.length} profiles in ${elapsedMs}ms`
  );

  return {
    profilesProcessed: realProfiles.length,
    suggestionsGenerated: totalSuggestions,
  };
}

function sevenDaysAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}
