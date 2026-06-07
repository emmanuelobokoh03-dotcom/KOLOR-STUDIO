import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// POST /api/waitlist — capture email for public launch notification
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' })
      return
    }

    const normalized = email.trim().toLowerCase()

    // Store in DB — upsert to avoid duplicates
    await prisma.$executeRawUnsafe(
      `INSERT INTO "WaitlistEntry" (id, email, "createdAt") VALUES (gen_random_uuid(), $1, NOW()) ON CONFLICT (email) DO NOTHING`,
      normalized
    )

    // Non-blocking confirmation email via Resend
    if (process.env.RESEND_API_KEY) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `KOLOR Studio <${process.env.SENDER_EMAIL || 'noreply@kolorstudio.app'}>`,
          to: normalized,
          subject: "You're on the list — KOLOR Studio",
          html: `<p style="font-family:monospace">You're on the waitlist for KOLOR Studio's public launch.</p><p style="font-family:monospace">We'll reach out when the doors open.</p><p style="font-family:monospace">— Emmanuel, KOLOR Studio</p>`,
        }),
      }).catch(() => { /* silent */ })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('[WAITLIST]', err)
    res.status(500).json({ error: 'Failed to save email' })
  }
})

// GET /api/waitlist/count — public, no auth required
router.get('/count', async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await prisma.waitlistEntry.count()
    res.json({ count })
  } catch {
    res.json({ count: 0 })
  }
})

export default router
