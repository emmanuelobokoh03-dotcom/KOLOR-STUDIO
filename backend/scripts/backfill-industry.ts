// iter 293-v3b — Industry backfill migration.
//
// Populates existing null-industry leads with their creator's
// user.primaryIndustry. One-time operation; safe to re-run (idempotent —
// only updates rows where industry IS NULL).
//
// Run:
//   cd backend && npx tsx scripts/backfill-industry.ts

import { PrismaClient } from '@prisma/client'

async function main(): Promise<void> {
  const prisma = new PrismaClient()

  const leadsWithoutIndustry = await prisma.lead.findMany({
    where: { industry: null },
    select: {
      id: true,
      clientName: true,
      assignedToId: true,
      assignedTo: { select: { primaryIndustry: true, email: true } },
    },
  })

  console.log(`[backfill-industry] Found ${leadsWithoutIndustry.length} leads with null industry.`)

  let updated = 0
  let skipped = 0
  const byIndustry: Record<string, number> = {}

  for (const lead of leadsWithoutIndustry) {
    const target = lead.assignedTo?.primaryIndustry
    if (!target) {
      skipped++
      continue
    }
    await prisma.lead.update({
      where: { id: lead.id },
      data: { industry: target },
    })
    updated++
    byIndustry[target] = (byIndustry[target] || 0) + 1
  }

  console.log(`[backfill-industry] Updated: ${updated}, skipped (creator has no primaryIndustry): ${skipped}`)
  console.log(`[backfill-industry] By industry:`, byIndustry)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('[backfill-industry] Fatal error:', err)
  process.exit(1)
})
