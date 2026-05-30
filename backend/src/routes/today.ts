import { Router, Response } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import prisma from '../lib/prisma'

const router = Router()

// GET /api/today — Attention items for the Today screen
// Returns: { attention: AttentionItem[], inProgress: LeadSummary[], generatedAt: string }
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000)
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 3600000)

    const [newLeads, staleLeads, unsignedContracts, expiringQuotes,
           viewedQuotes, inProgressLeads] = await Promise.all([
      prisma.lead.findMany({
        where: { assignedToId: userId, status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, clientName: true, projectType: true, createdAt: true, estimatedValue: true },
      }),
      prisma.lead.findMany({
        where: {
          assignedToId: userId,
          updatedAt: { lt: sevenDaysAgo },
          status: { notIn: ['BOOKED', 'LOST'] },
        },
        orderBy: { updatedAt: 'asc' },
        take: 5,
        select: { id: true, clientName: true, projectType: true, status: true, updatedAt: true },
      }),
      prisma.contract.findMany({
        where: {
          lead: { assignedToId: userId },
          clientAgreed: false,
          status: { in: ['SENT', 'VIEWED'] },
        },
        orderBy: { sentAt: 'asc' },
        take: 5,
        include: { lead: { select: { id: true, clientName: true, projectType: true } } },
      }),
      prisma.quote.findMany({
        where: {
          lead: { assignedToId: userId },
          validUntil: { gte: now, lte: threeDaysFromNow },
          status: { in: ['SENT', 'VIEWED'] },
        },
        orderBy: { validUntil: 'asc' },
        take: 5,
        include: { lead: { select: { id: true, clientName: true, projectType: true } } },
      }),
      prisma.quote.findMany({
        where: {
          lead: { assignedToId: userId },
          viewedAt: { lt: seventyTwoHoursAgo },
          status: { in: ['SENT', 'VIEWED'] },
        },
        orderBy: { viewedAt: 'asc' },
        take: 3,
        include: { lead: { select: { id: true, clientName: true, projectType: true } } },
      }),
      prisma.lead.findMany({
        where: {
          assignedToId: userId,
          status: { notIn: ['BOOKED', 'LOST'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true, clientName: true, projectType: true, status: true,
          estimatedValue: true, updatedAt: true, keyDate: true, eventDate: true,
        },
      }),
    ])

    interface AttentionItem {
      id: string
      type: string
      priority: number
      clientName: string
      leadId: string
      label: string
      sublabel: string
      actionLabel: string
      actionRoute: string
      daysOverdue?: number
    }

    const attention: AttentionItem[] = []

    for (const lead of newLeads) {
      const hoursAgo = Math.floor((now.getTime() - new Date(lead.createdAt).getTime()) / 3600000)
      const daysAgo = Math.floor(hoursAgo / 24)
      attention.push({
        id: `new-${lead.id}`,
        type: 'new_inquiry',
        priority: Math.max(70 - daysAgo * 10, 20),
        clientName: lead.clientName,
        leadId: lead.id,
        label: `New inquiry from ${lead.clientName}`,
        sublabel: daysAgo === 0 ? `${hoursAgo}h ago` : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`,
        actionLabel: 'Review',
        actionRoute: 'overview',
      })
    }

    for (const contract of unsignedContracts) {
      if (!contract.sentAt || !contract.lead) continue
      const daysSinceSent = Math.floor((now.getTime() - new Date(contract.sentAt).getTime()) / 86400000)
      attention.push({
        id: `contract-${contract.id}`,
        type: 'contract_unsigned',
        priority: Math.min(80 + daysSinceSent * 3, 100),
        clientName: contract.lead.clientName,
        leadId: contract.lead.id,
        label: `${contract.lead.clientName} hasn't signed yet`,
        sublabel: `Day ${daysSinceSent} — contract waiting`,
        actionLabel: 'Send reminder',
        actionRoute: 'pipeline',
        daysOverdue: daysSinceSent,
      })
    }

    for (const quote of expiringQuotes) {
      if (!quote.validUntil || !quote.lead) continue
      const daysLeft = Math.ceil((new Date(quote.validUntil).getTime() - now.getTime()) / 86400000)
      attention.push({
        id: `expiry-${quote.id}`,
        type: 'quote_expiring',
        priority: Math.min(75 + (3 - daysLeft) * 5, 100),
        clientName: quote.lead.clientName,
        leadId: quote.lead.id,
        label: `Quote expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        sublabel: `${quote.lead.clientName} · ${new Date(quote.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        actionLabel: 'Follow up',
        actionRoute: 'pipeline',
      })
    }

    for (const quote of viewedQuotes) {
      if (!quote.viewedAt || !quote.lead) continue
      const daysAgo = Math.floor((now.getTime() - new Date(quote.viewedAt).getTime()) / 86400000)
      attention.push({
        id: `viewed-${quote.id}`,
        type: 'quote_viewed',
        priority: 60 + daysAgo * 2,
        clientName: quote.lead.clientName,
        leadId: quote.lead.id,
        label: `${quote.lead.clientName} viewed your quote`,
        sublabel: `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago — no decision yet`,
        actionLabel: 'Follow up',
        actionRoute: 'pipeline',
      })
    }

    for (const lead of staleLeads) {
      const daysStale = Math.floor((now.getTime() - new Date(lead.updatedAt).getTime()) / 86400000)
      attention.push({
        id: `stale-${lead.id}`,
        type: 'stale_lead',
        priority: 40 + daysStale,
        clientName: lead.clientName,
        leadId: lead.id,
        label: `${lead.clientName} needs follow-up`,
        sublabel: `${daysStale} days since last activity`,
        actionLabel: 'View',
        actionRoute: 'overview',
        daysOverdue: daysStale,
      })
    }

    attention.sort((a, b) => b.priority - a.priority)
    const topAttention = attention.slice(0, 8)

    res.json({
      attention: topAttention,
      inProgress: inProgressLeads,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Today endpoint error:', error)
    res.status(500).json({ error: 'Server Error' })
  }
})

export default router
