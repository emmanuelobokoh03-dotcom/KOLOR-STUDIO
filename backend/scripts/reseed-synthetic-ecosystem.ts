// iter 286.5b — Synthetic ecosystem regeneration
// Distributes likes + follows + comments across new shots so retention
// features have signal for testing.
//
// FIELD NAMES verified against schema.prisma iter 286.5a:
// - PostLike: userId (User.id) + postId — join through profile.userId
// - Comment: authorId (CommunityProfile.id per verified Pattern B) + postId
// - Comment.content: max 300 chars

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMMENT_TEMPLATES = [
  'The composition on this is genuinely rare.',
  'Bookmarking this for reference.',
  'How did you handle the lighting on this?',
  'This reads calm without being empty. Nice restraint.',
  'The color choices here work well in context.',
  'Following your work — this series is coming together.',
  'What did you use for post-processing?',
  'This is a nice reference for my current project.',
  'The negative space is doing real work here.',
  'Beautifully seen.',
  'Great execution — the details reward a closer look.',
  'This is exactly the reference I needed today.',
];

// Assert all templates under 300 chars
COMMENT_TEMPLATES.forEach(t => {
  if (t.length > 300) throw new Error(`Template too long: ${t.length}`);
});

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

async function main() {
  const profiles = await prisma.communityProfile.findMany({
    where: { isSynthetic: true },
    select: { id: true, userId: true }
  });

  const shots = await prisma.post.findMany({
    where: { hiddenFromGrid: false, mainImage: { not: null } },
    select: { id: true, authorId: true }
  });

  console.log(`[ECOSYSTEM] ${profiles.length} profiles, ${shots.length} shots`);

  const shuffled = shots.sort(() => Math.random() - 0.5);
  const popularCount = Math.floor(shots.length * 0.2);
  const midCount = Math.floor(shots.length * 0.6);
  const popular = shuffled.slice(0, popularCount);
  const mid = shuffled.slice(popularCount, popularCount + midCount);
  const longTail = shuffled.slice(popularCount + midCount);

  let likesCreated = 0;

  // Popular: 40-80 likes each
  for (const shot of popular) {
    const targetLikes = Math.floor(Math.random() * 41) + 40;
    const likers = pickN(profiles.filter(p => p.id !== shot.authorId), targetLikes);
    for (const liker of likers) {
      try {
        await prisma.postLike.create({
          data: { postId: shot.id, userId: liker.userId }
        });
        likesCreated++;
      } catch (err: any) {}
    }
  }

  // Mid: 10-30 likes
  for (const shot of mid) {
    const targetLikes = Math.floor(Math.random() * 21) + 10;
    const likers = pickN(profiles.filter(p => p.id !== shot.authorId), targetLikes);
    for (const liker of likers) {
      try {
        await prisma.postLike.create({
          data: { postId: shot.id, userId: liker.userId }
        });
        likesCreated++;
      } catch (err: any) {}
    }
  }

  // Long-tail: 2-8 likes
  for (const shot of longTail) {
    const targetLikes = Math.floor(Math.random() * 7) + 2;
    const likers = pickN(profiles.filter(p => p.id !== shot.authorId), targetLikes);
    for (const liker of likers) {
      try {
        await prisma.postLike.create({
          data: { postId: shot.id, userId: liker.userId }
        });
        likesCreated++;
      } catch (err: any) {}
    }
  }

  console.log(`[ECOSYSTEM] Likes: ${likesCreated}`);

  // Comments — 70% of shots get 1-4 each
  let commentsCreated = 0;
  const shotsForComments = pickN(shots, Math.floor(shots.length * 0.7));
  for (const shot of shotsForComments) {
    const commentCount = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < commentCount; i++) {
      const commenter = pickRandom(profiles.filter(p => p.id !== shot.authorId));
      try {
        await prisma.comment.create({
          data: {
            postId: shot.id,
            authorId: commenter.id,  // Pattern B — CommunityProfile.id (verified STEP 2d)
            content: pickRandom(COMMENT_TEMPLATES),
          }
        });
        commentsCreated++;
      } catch (err: any) {
        console.error('  Comment failed:', err.message);
      }
    }
  }

  console.log(`[ECOSYSTEM] Comments: ${commentsCreated}`);

  // Follows — add ~200 new
  let followsCreated = 0;
  const NEW_FOLLOW_TARGET = 200;
  for (let i = 0; i < NEW_FOLLOW_TARGET; i++) {
    const follower = pickRandom(profiles);
    const following = pickRandom(profiles.filter(p => p.id !== follower.id));
    try {
      await prisma.follow.create({
        data: { followerId: follower.id, followingId: following.id }
      });
      followsCreated++;
    } catch (err: any) {}
  }

  console.log(`[ECOSYSTEM] New follows: ${followsCreated}`);

  return { likesCreated, commentsCreated, followsCreated };
}

main()
  .then(result => {
    console.log('[ECOSYSTEM] Complete:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('[ECOSYSTEM] Fatal:', err);
    process.exit(1);
  });
