import { Router, Response } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import prisma from '../lib/prisma'

const router = Router()

// GET /api/pipeline/:leadId
// Single round-trip for the lead Pipeline tab: quotes + contracts + user
// currency settings — replaces 3-5 separate API calls.
router.get('/:leadId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadId = req.params.leadId as string
    const userId = req.userId!

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, assignedToId: userId },
      select: { id: true },
    })
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' })
      return
    }

    const [quotes, contracts, userSettings] = await Promise.all([
      prisma.quote.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
        include: {
          incomeRecords: {
            select: {
              id: true,
              amount: true,
              status: true,
              depositAmount: true,
              depositPaid: true,
              depositPaidAt: true,
              finalAmount: true,
              finalPaid: true,
              finalPaidAt: true,
              receivedDate: true,
              expectedDate: true,
            },
          },
        },
      }),
      prisma.contract.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          clientAgreed: true,
          clientAgreedAt: true,
          sentAt: true,
          createdAt: true,
          updatedAt: true,
          content: true,
          templateType: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          currency: true,
          currencySymbol: true,
          currencyPosition: true,
          numberFormat: true,
        },
      }),
    ])

    res.json({
      quotes,
      contracts,
      userSettings: userSettings || {},
      leadId,
    })
  } catch (error) {
    console.error('Pipeline endpoint error:', error)
    res.status(500).json({ error: 'Server Error' })
  }
})

export default router
