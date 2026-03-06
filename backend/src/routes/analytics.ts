import { Router, Response } from 'express';
import { LeadStatus } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
import prisma from '../lib/prisma';

// Helper to get start of month
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Helper to get start of year
function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

// Helper to get start of last month
function getStartOfLastMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

// Helper to get end of last month
function getEndOfLastMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
}

// Pipeline statuses (leads in active pipeline)
const PIPELINE_STATUSES: LeadStatus[] = ['NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'NEGOTIATING'];

// GET /api/analytics/dashboard - Main dashboard analytics
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const startOfMonth = getStartOfMonth(now);
    const startOfYear = getStartOfYear(now);
    const startOfLastMonth = getStartOfLastMonth();
    const endOfLastMonth = getEndOfLastMonth();

    // Get all leads for this user
    const allLeads = await prisma.lead.findMany({
      where: { assignedToId: userId },
      select: {
        id: true,
        status: true,
        estimatedValue: true,
        actualValue: true,
        createdAt: true,
        updatedAt: true,
        convertedAt: true,
        source: true,
      }
    });

    // Calculate metrics
    const totalLeads = allLeads.length;
    const bookedLeads = allLeads.filter(l => l.status === 'BOOKED');
    const lostLeads = allLeads.filter(l => l.status === 'LOST');
    const pipelineLeads = allLeads.filter(l => PIPELINE_STATUSES.includes(l.status));

    // Pipeline Value (estimated value of leads in pipeline)
    const pipelineValue = pipelineLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    // Booked This Month
    const bookedThisMonth = bookedLeads.filter(l => 
      l.convertedAt && l.convertedAt >= startOfMonth
    );
    const bookedThisMonthValue = bookedThisMonth.reduce((sum, l) => sum + (l.actualValue || 0), 0);

    // Booked Last Month (for comparison)
    const bookedLastMonth = bookedLeads.filter(l => 
      l.convertedAt && l.convertedAt >= startOfLastMonth && l.convertedAt <= endOfLastMonth
    );
    const bookedLastMonthValue = bookedLastMonth.reduce((sum, l) => sum + (l.actualValue || 0), 0);

    // Booked This Year (YTD)
    const bookedThisYear = bookedLeads.filter(l => 
      l.convertedAt && l.convertedAt >= startOfYear
    );
    const bookedThisYearValue = bookedThisYear.reduce((sum, l) => sum + (l.actualValue || 0), 0);

    // Total Booked (All Time)
    const totalBookedValue = bookedLeads.reduce((sum, l) => sum + (l.actualValue || 0), 0);

    // Conversion Rate (booked / total that aren't new)
    const processedLeads = allLeads.filter(l => l.status !== 'NEW');
    const conversionRate = processedLeads.length > 0 
      ? (bookedLeads.length / processedLeads.length) * 100 
      : 0;

    // Win Rate (booked / (booked + lost))
    const closedDeals = bookedLeads.length + lostLeads.length;
    const winRate = closedDeals > 0 
      ? (bookedLeads.length / closedDeals) * 100 
      : 0;

    // Average Deal Size
    const avgDealSize = bookedLeads.length > 0 
      ? totalBookedValue / bookedLeads.length 
      : 0;

    // Average Time to Close (days from creation to conversion)
    const closeTimes = bookedLeads
      .filter(l => l.convertedAt)
      .map(l => {
        const created = new Date(l.createdAt).getTime();
        const converted = new Date(l.convertedAt!).getTime();
        return (converted - created) / (1000 * 60 * 60 * 24); // days
      });
    const avgTimeToClose = closeTimes.length > 0 
      ? closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length 
      : 0;

    // Active Leads (not BOOKED or LOST)
    const activeLeads = allLeads.filter(l => l.status !== 'BOOKED' && l.status !== 'LOST');

    // Month-over-month change
    const monthChange = bookedLastMonthValue > 0 
      ? ((bookedThisMonthValue - bookedLastMonthValue) / bookedLastMonthValue) * 100 
      : bookedThisMonthValue > 0 ? 100 : 0;

    res.json({
      overview: {
        pipelineValue,
        bookedThisMonth: {
          value: bookedThisMonthValue,
          count: bookedThisMonth.length,
          monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          changePercent: monthChange,
        },
        bookedThisYear: {
          value: bookedThisYearValue,
          count: bookedThisYear.length,
          year: now.getFullYear(),
        },
        totalBooked: {
          value: totalBookedValue,
          count: bookedLeads.length,
        },
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      metrics: {
        avgDealSize: Math.round(avgDealSize * 100) / 100,
        avgTimeToClose: Math.round(avgTimeToClose * 10) / 10,
        activeLeads: activeLeads.length,
        winRate: Math.round(winRate * 10) / 10,
        totalLeads,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get analytics' });
  }
});

// GET /api/analytics/monthly-trend - Revenue trend by month
router.get('/monthly-trend', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    
    // Get last 12 months of data
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const bookedLeads = await prisma.lead.findMany({
      where: {
        assignedToId: userId,
        status: 'BOOKED',
        convertedAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        actualValue: true,
        convertedAt: true,
      },
    });

    // Group by month
    const monthlyData: Record<string, { count: number; revenue: number }> = {};
    
    // Initialize all 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { count: 0, revenue: 0 };
    }

    // Fill in data
    bookedLeads.forEach(lead => {
      if (lead.convertedAt) {
        const date = new Date(lead.convertedAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].count++;
          monthlyData[key].revenue += lead.actualValue || 0;
        }
      }
    });

    // Convert to array format
    const trend = Object.entries(monthlyData).map(([key, data]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthKey: key,
        count: data.count,
        revenue: data.revenue,
      };
    });

    res.json({ trend });
  } catch (error) {
    console.error('Get monthly trend error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get monthly trend' });
  }
});

// GET /api/analytics/lead-sources - Lead source performance
router.get('/lead-sources', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const leads = await prisma.lead.findMany({
      where: { assignedToId: userId },
      select: {
        source: true,
        status: true,
        actualValue: true,
      },
    });

    // Group by source
    const sourceData: Record<string, { 
      total: number; 
      booked: number; 
      revenue: number;
    }> = {};

    leads.forEach(lead => {
      const source = lead.source;
      if (!sourceData[source]) {
        sourceData[source] = { total: 0, booked: 0, revenue: 0 };
      }
      sourceData[source].total++;
      if (lead.status === 'BOOKED') {
        sourceData[source].booked++;
        sourceData[source].revenue += lead.actualValue || 0;
      }
    });

    // Convert to array and calculate conversion rates
    const sources = Object.entries(sourceData)
      .map(([source, data]) => ({
        source,
        sourceLabel: source.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        totalLeads: data.total,
        bookedLeads: data.booked,
        conversionRate: data.total > 0 ? Math.round((data.booked / data.total) * 100 * 10) / 10 : 0,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate);

    res.json({ sources });
  } catch (error) {
    console.error('Get lead sources error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get lead sources' });
  }
});

// GET /api/analytics/pipeline-by-status - Pipeline breakdown by status
router.get('/pipeline-by-status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const leads = await prisma.lead.findMany({
      where: { assignedToId: userId },
      select: {
        status: true,
        estimatedValue: true,
        actualValue: true,
      },
    });

    // Status labels and colors
    const statusConfig: Record<LeadStatus, { label: string; color: string; order: number }> = {
      NEW: { label: 'New', color: '#6366f1', order: 1 },
      REVIEWING: { label: 'Reviewing', color: '#8b5cf6', order: 2 },
      CONTACTED: { label: 'Contacted', color: '#a855f7', order: 3 },
      QUALIFIED: { label: 'Qualified', color: '#d946ef', order: 4 },
      QUOTED: { label: 'Quoted', color: '#ec4899', order: 5 },
      NEGOTIATING: { label: 'Negotiating', color: '#f97316', order: 6 },
      BOOKED: { label: 'Booked', color: '#22c55e', order: 7 },
      LOST: { label: 'Lost', color: '#ef4444', order: 8 },
    };

    // Group by status
    const statusData: Record<LeadStatus, { count: number; value: number }> = {} as any;
    Object.keys(statusConfig).forEach(status => {
      statusData[status as LeadStatus] = { count: 0, value: 0 };
    });

    leads.forEach(lead => {
      statusData[lead.status].count++;
      // Use actualValue for BOOKED, estimatedValue for others
      const value = lead.status === 'BOOKED' 
        ? (lead.actualValue || 0) 
        : (lead.estimatedValue || 0);
      statusData[lead.status].value += value;
    });

    // Convert to array
    const pipeline = Object.entries(statusData)
      .map(([status, data]) => ({
        status,
        label: statusConfig[status as LeadStatus].label,
        color: statusConfig[status as LeadStatus].color,
        order: statusConfig[status as LeadStatus].order,
        count: data.count,
        value: data.value,
      }))
      .sort((a, b) => a.order - b.order);

    res.json({ pipeline });
  } catch (error) {
    console.error('Get pipeline by status error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get pipeline data' });
  }
});

export default router;
