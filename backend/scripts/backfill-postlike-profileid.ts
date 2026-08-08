// iter 287-v3b STEP 1 — Path A backfill (raw SQL bulk version)
// Remap PostLike.userId from User.id -> CommunityProfile.id.
// Uses raw UPDATE + DELETE for speed (single DB round-trip each).

import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('[BACKFILL] Starting bulk PostLike userId -> profileId remap...')

  // Pre-count how many rows are User.id-keyed vs profile.id-keyed
  const beforeUserKeyed = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "PostLike" pl
    JOIN "CommunityProfile" cp ON cp."userId" = pl."userId"
  `
  console.log(`[BACKFILL] Before: ${beforeUserKeyed[0].count} PostLike rows are User.id-keyed`)

  // Step 1: UPDATE all PostLike rows where userId matches a User.id AND no collision
  const updateResult = await prisma.$executeRaw`
    UPDATE "PostLike" pl
    SET "userId" = cp.id
    FROM "CommunityProfile" cp
    WHERE pl."userId" = cp."userId"
      AND NOT EXISTS (
        SELECT 1 FROM "PostLike" pl2
        WHERE pl2."userId" = cp.id
          AND pl2."postId" = pl."postId"
      )
  `
  console.log(`[BACKFILL] UPDATE remapped: ${updateResult} rows`)

  // Step 2: DELETE remaining PostLike rows whose userId still matches a User.id
  //         (these are collisions — profile already liked the post via profile.id)
  const deleteResult = await prisma.$executeRaw`
    DELETE FROM "PostLike" pl
    WHERE EXISTS (
      SELECT 1 FROM "CommunityProfile" cp WHERE cp."userId" = pl."userId"
    )
  `
  console.log(`[BACKFILL] DELETE collision-deduped: ${deleteResult} rows`)

  // Post-count verify
  const afterUserKeyed = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "PostLike" pl
    JOIN "CommunityProfile" cp ON cp."userId" = pl."userId"
  `
  const total = await prisma.postLike.count()
  console.log(`[BACKFILL] After: ${afterUserKeyed[0].count} User.id-keyed rows remain (expect 0)`)
  console.log(`[BACKFILL] Total PostLike rows now: ${total}`)

  return {
    remapped: updateResult,
    collisionDeduped: deleteResult,
    residual: Number(afterUserKeyed[0].count),
    total,
  }
}

main()
  .then((result) => {
    process.exit(result.residual > 0 ? 2 : 0)
  })
  .catch((err) => {
    console.error('[BACKFILL] Fatal:', err)
    process.exit(1)
  })
