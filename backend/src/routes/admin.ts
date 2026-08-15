// iter 289-v3c3b Workstream 5 — Admin route for demo data seeding.
// Env-guarded OR email allowlist per Emmanuel's Q2=C directive:
//   local dev  → ADMIN_ROUTES_ENABLED=true in .env (works for any logged-in user)
//   production → ADMIN_EMAILS=emmanuel@... allowlist (specific accounts only)
// Both guards active means belt-and-suspenders safety: either grants
// access, denial requires both to fail.
//
// Endpoints (all POST, all require requireAdmin):
//   /api/admin/seed-pending-thread          — seeds a PENDING DMThread
//   /api/admin/trigger-featured-work-cron   — runs featuredWork cron
//   /api/admin/trigger-featured-creator-cron — runs featuredCreator cron
//   /api/admin/trigger-peer-cron            — runs peerSuggestion cron
//   /api/admin/backfill-subheadlines        — runs subheadline backfill

import { Router, Response, NextFunction } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { generateWeeklyFeaturedWork } from '../services/featuredWorkCron'
import { generateWeeklyFeaturedCreators } from '../services/featuredCreatorCron'
import { generateWeeklyPeerSuggestions } from '../services/peerSuggestionGenerator'

const router = Router()

// Belt-and-suspenders admin guard: env flag OR email allowlist match.
// Allowlist supports both ADMIN_EMAILS (comma-separated) and the
// pre-existing ADMIN_EMAIL (singular, already used by email service).
async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const envEnabled = process.env.ADMIN_ROUTES_ENABLED === 'true'
  const listRaw = [process.env.ADMIN_EMAILS || '', process.env.ADMIN_EMAIL || ''].join(',')
  const allowlist = listRaw.split(',').map(s => s.trim()).filter(Boolean)

  if (!envEnabled && allowlist.length === 0) {
    res.status(403).json({ error: 'Admin routes disabled' })
    return
  }

  if (envEnabled) return next()

  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { email: true },
  })
  if (user?.email && allowlist.includes(user.email)) return next()

  res.status(403).json({ error: 'Forbidden' })
}

// Sub-headline backfill (mirrors backend/scripts/backfill-synthetic-subheadlines.ts).
const SUB_CHIPS: Record<'DESIGN' | 'PHOTOGRAPHY' | 'FINE_ART', string[]> = {
  DESIGN: ['Graphic Design', 'Brand Design', 'Product Design', 'Web Design', 'Illustration', 'UI/UX', 'Motion Design', 'Editorial Design', 'Packaging Design', 'Type Design'],
  PHOTOGRAPHY: ['Wedding Photography', 'Lifestyle Photography', 'Documentary', 'Portrait', 'Commercial', 'Fashion', 'Landscape', 'Street Photography', 'Architectural', 'Event Photography'],
  FINE_ART: ['Oil on Canvas', 'Acrylic on Canvas', 'Original Paintings', 'Watercolor', 'Sculpture', 'Mixed Media', 'Commissions', 'Murals', 'Digital Painting', 'Printmaking'],
}

function bucketFor(industry: string | null | undefined): keyof typeof SUB_CHIPS | null {
  if (!industry) return null
  const design = ['GRAPHIC_DESIGN', 'WEB_DESIGN', 'ILLUSTRATION', 'BRANDING']
  const photo = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'CONTENT_CREATION']
  const fineArt = ['FINE_ART', 'SCULPTURE']
  if (design.includes(industry)) return 'DESIGN'
  if (photo.includes(industry)) return 'PHOTOGRAPHY'
  if (fineArt.includes(industry)) return 'FINE_ART'
  return null
}

router.post('/seed-pending-thread', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myProfile = await prisma.communityProfile.findUnique({ where: { userId: req.userId! } })
    if (!myProfile) { res.status(400).json({ error: 'No community profile' }); return }

    // Pick a synthetic profile that isn't already in a thread with me.
    const existingThreads = await prisma.dMThread.findMany({
      where: { OR: [{ participantA: myProfile.id }, { participantB: myProfile.id }] },
      select: { participantA: true, participantB: true },
    })
    const usedIds = new Set<string>()
    existingThreads.forEach(t => { usedIds.add(t.participantA); usedIds.add(t.participantB) })
    usedIds.delete(myProfile.id)

    const candidate = await prisma.communityProfile.findFirst({
      where: { isSynthetic: true, id: { notIn: [...usedIds] } },
      include: { user: { select: { firstName: true } } },
    })
    if (!candidate) { res.status(404).json({ error: 'No available synthetic profile' }); return }

    const thread = await prisma.dMThread.create({
      data: {
        participantA: candidate.id,
        participantB: myProfile.id,
        status: 'PENDING',
        messages: {
          create: {
            senderId: candidate.id,
            content: `Hey — really liked your latest work. Any chance to chat about a collab?`,
          },
        },
      },
      include: { messages: true },
    })

    await prisma.notification.create({
      data: {
        recipientId: myProfile.id,
        fromUserId: candidate.id,
        type: 'DM_REQUEST_RECEIVED',
        threadId: thread.id,
      },
    })

    res.json({ ok: true, threadId: thread.id, from: candidate.user.firstName })
  } catch (e: any) {
    res.status(500).json({ error: 'Failed', detail: e?.message })
  }
})

router.post('/trigger-featured-work-cron', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await generateWeeklyFeaturedWork()
    res.json({ ok: true, result })
  } catch (e: any) {
    res.status(500).json({ error: 'Failed', detail: e?.message })
  }
})

router.post('/trigger-featured-creator-cron', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await generateWeeklyFeaturedCreators()
    res.json({ ok: true, result })
  } catch (e: any) {
    res.status(500).json({ error: 'Failed', detail: e?.message })
  }
})

router.post('/trigger-peer-cron', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await generateWeeklyPeerSuggestions()
    res.json({ ok: true, result })
  } catch (e: any) {
    res.status(500).json({ error: 'Failed', detail: e?.message })
  }
})

router.post('/backfill-subheadlines', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profiles = await prisma.communityProfile.findMany({
      where: { isSynthetic: true },
      include: { user: { select: { primaryIndustry: true } } },
    })
    let updated = 0
    let skipped = 0
    for (const profile of profiles) {
      const bucket = bucketFor(profile.user.primaryIndustry as string | null)
      if (!bucket) { skipped++; continue }
      const chips = SUB_CHIPS[bucket]
      const hash = profile.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
      const subHeadline = chips[hash % chips.length]
      if (profile.subHeadline === subHeadline) { skipped++; continue }
      await prisma.communityProfile.update({ where: { id: profile.id }, data: { subHeadline } })
      updated++
    }
    res.json({ ok: true, updated, skipped, total: profiles.length })
  } catch (e: any) {
    res.status(500).json({ error: 'Failed', detail: e?.message })
  }
})

export default router
