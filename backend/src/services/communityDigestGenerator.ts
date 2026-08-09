// Community Weekly Digest Generator (iter 286)
// Runs hourly via scheduler. For each real profile whose local time is Sunday 8am,
// assembles digest data and sends via sendCommunityWeeklyDigestEmail.
// Uses User.timezone for local-time calculation.

import { PrismaClient } from '@prisma/client';
import { sendCommunityWeeklyDigestEmail } from './email';

const prisma = new PrismaClient();

/**
 * Runs hourly. Sends digest to profiles whose local time is currently Sunday 8am.
 */
export async function processCommunityDigestSends(): Promise<{
  eligibleProfiles: number;
  digestsSent: number;
}> {
  const now = new Date();
  const currentWeekOf = getSundayOfWeek(now);

  const eligibleProfiles = await prisma.communityProfile.findMany({
    where: {
      isSynthetic: false,
      weeklyDigestEnabled: true,
      communityEmailsEnabled: true,
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          timezone: true,
          primaryIndustry: true,
          industry: true,
        },
      },
    },
  });

  let sent = 0;

  for (const profile of eligibleProfiles) {
    const tz = profile.user.timezone || 'UTC';
    if (!isLocalSunday8am(now, tz)) continue;

    const alreadySent = await prisma.digestSend.findUnique({
      where: {
        profileId_weekOfSent: {
          profileId: profile.id,
          weekOfSent: currentWeekOf,
        },
      },
    });
    if (alreadySent) continue;

    try {
      const digestData = await assembleDigestData(profile.id);

      const ok = await sendCommunityWeeklyDigestEmail({
        email: profile.user.email,
        firstName: profile.user.firstName || 'Creator',
        digestData,
      });

      if (ok) {
        await prisma.digestSend.create({
          data: {
            profileId: profile.id,
            sentAt: now,
            weekOfSent: currentWeekOf,
          },
        });
        sent++;
      }
    } catch (err: any) {
      console.error(`[DIGEST] Failed for profile ${profile.id}:`, err.message);
    }
  }

  console.log(`[DIGEST] Processed ${eligibleProfiles.length} eligible, sent ${sent}`);

  return {
    eligibleProfiles: eligibleProfiles.length,
    digestsSent: sent,
  };
}

async function assembleDigestData(profileId: string) {
  const currentWeek = getSundayOfWeek(new Date());

  const featuredWork = await prisma.featuredPost.findMany({
    where: { featuredWeek: currentWeek },
    include: {
      post: {
        select: {
          id: true,
          content: true,
          mainImage: true,
          industry: true,
          author: { select: { id: true, handle: true, user: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
  });

  const featuredCreators = await prisma.featuredCreator.findMany({
    where: { featuredWeek: currentWeek },
    include: {
      profile: {
        select: {
          id: true,
          handle: true,
          bio: true,
          city: true,
          user: { select: { firstName: true, lastName: true } },
          posts: {
            where: { hiddenFromGrid: false, mainImage: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, mainImage: true },
          },
        },
      },
    },
  });

  // iter 288-v3 — Top 6 shots this week by engagement for visual-first grid
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const featuredPostIds = new Set(featuredWork.map((f) => f.post.id));
  const gridCandidates = await prisma.post.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      isDeleted: false,
      hiddenFromGrid: false,
      mainImage: { not: null },
    },
    include: {
      _count: { select: { likes: true, comments: true } },
      author: { select: { id: true, handle: true, user: { select: { firstName: true, lastName: true } } } },
    },
    take: 40,
  });
  const topShots = gridCandidates
    .filter((p) => !featuredPostIds.has(p.id))
    .sort(
      (a, b) =>
        b._count.likes + b._count.comments * 1.5 - (a._count.likes + a._count.comments * 1.5)
    )
    .slice(0, 6);

  const milestoneKeywords = ['commission', 'delivered', 'signed', 'paid', 'completed', 'booked', 'first client', 'first quote', 'sold', 'milestone'];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPosts = await prisma.post.findMany({
    where: {
      createdAt: { gte: oneWeekAgo },
      isDeleted: false,
    },
    include: {
      author: { select: { id: true, handle: true, user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const milestones = recentPosts
    .filter((p) => milestoneKeywords.some((kw) => p.content.toLowerCase().includes(kw)))
    .slice(0, 5);

  const [newFollowers, unreadDMs, commentsOnMyPosts, appreciationsThisWeek] = await Promise.all([
    prisma.follow.count({
      where: { followingId: profileId, createdAt: { gte: oneWeekAgo } },
    }),
    prisma.dMMessage.count({
      where: {
        readAt: null,
        thread: {
          OR: [{ participantA: profileId }, { participantB: profileId }],
        },
        senderId: { not: profileId },
      },
    }),
    prisma.comment.count({
      where: {
        post: { authorId: profileId },
        createdAt: { gte: oneWeekAgo },
      },
    }),
    prisma.postLike.count({
      where: {
        post: { authorId: profileId },
        createdAt: { gte: oneWeekAgo },
      },
    }),
  ]);

  return {
    featuredWork,
    featuredCreators,
    milestones,
    topShots,
    activity: {
      newFollowers,
      unreadDMs,
      commentsOnMyPosts,
      appreciationsThisWeek,
    },
    weekOf: currentWeek,
  };
}

function getSundayOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day;
  const sunday = new Date(d);
  sunday.setUTCDate(diff);
  sunday.setUTCHours(0, 0, 0, 0);
  return sunday;
}

function isLocalSunday8am(now: Date, timezone: string): boolean {
  try {
    const localString = now.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    });
    return /^Sun.*\b8\b/.test(localString);
  } catch {
    return false;
  }
}
