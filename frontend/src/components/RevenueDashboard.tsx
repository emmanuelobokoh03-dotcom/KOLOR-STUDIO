import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Target, ArrowUpRight, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface RevenueStats {
  thisMonth: number
  thisMonthCount: number
  monthOverMonth: number
  ytd: number
  yearGoal: number
  goalProgress: number
  expected: number
  expectedCount: number
  monthlyTrend: { month: string; amount: number }[]
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`
  return `$${amount.toLocaleString()}`
}

export default function RevenueDashboard() {
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || ''
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_URL}/api/crm/revenue`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setStats(await res.json())
      } catch (err) {
        console.error('Failed to fetch revenue:', err)
      }
      setLoading(false)
    }
    fetchRevenue()
  }, [])

  if (loading) {
    return (
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#262626] p-5 animate-pulse" data-testid="revenue-dashboard-loading">
        <div className="h-4 bg-[#333] rounded w-32 mb-4" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[#222] rounded-xl" />)}
        </div>
        <div className="h-32 bg-[#222] rounded-xl" />
      </div>
    )
  }

  if (!stats) return null

  const chartColor = getComputedStyle(document.documentElement).getPropertyValue('--color-brand-primary-rgb')?.trim()
  const brandRGB = chartColor ? `rgb(${chartColor})` : '#A855F7'
  const brandRGBLight = chartColor ? `rgba(${chartColor}, 0.3)` : 'rgba(168,85,247,0.3)'

  return (
    <div className="bg-[#1A1A1A] rounded-2xl border border-[#262626] overflow-hidden" data-testid="revenue-dashboard">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#FAFAFA]">Revenue Overview</h3>
            <p className="text-xs text-[#666]">Track your earnings</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* This Month */}
          <div className="bg-[#0F0F0F] rounded-xl p-3 border border-[#262626]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-[#888] uppercase tracking-wider">This Month</span>
              {stats.monthOverMonth !== 0 && (
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${stats.monthOverMonth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stats.monthOverMonth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(stats.monthOverMonth)}%
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-[#FAFAFA]" data-testid="revenue-this-month">{formatCurrency(stats.thisMonth)}</p>
            <p className="text-[10px] text-[#666]">{stats.thisMonthCount} payment{stats.thisMonthCount !== 1 ? 's' : ''}</p>
          </div>

          {/* YTD */}
          <div className="bg-[#0F0F0F] rounded-xl p-3 border border-[#262626]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-[#888] uppercase tracking-wider">Year to Date</span>
              <Calendar className="w-3 h-3 text-[#666]" />
            </div>
            <p className="text-lg font-bold text-[#FAFAFA]" data-testid="revenue-ytd">{formatCurrency(stats.ytd)}</p>
            <p className="text-[10px] text-[#666]">of {formatCurrency(stats.yearGoal)} goal</p>
          </div>

          {/* Expected */}
          <div className="bg-[#0F0F0F] rounded-xl p-3 border border-[#262626]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-[#888] uppercase tracking-wider">Pipeline</span>
              <ArrowUpRight className="w-3 h-3 text-[#666]" />
            </div>
            <p className="text-lg font-bold text-amber-400" data-testid="revenue-expected">{formatCurrency(stats.expected)}</p>
            <p className="text-[10px] text-[#666]">{stats.expectedCount} pending</p>
          </div>

          {/* Goal Progress */}
          <div className="bg-[#0F0F0F] rounded-xl p-3 border border-[#262626]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-[#888] uppercase tracking-wider">Goal</span>
              <Target className="w-3 h-3 text-[#666]" />
            </div>
            <p className="text-lg font-bold text-[#FAFAFA]" data-testid="revenue-goal">{stats.goalProgress}%</p>
            <div className="w-full h-1.5 bg-[#333] rounded-full mt-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.goalProgress, 100)}%`, background: brandRGB }}
              />
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-[#0F0F0F] rounded-xl p-3 border border-[#262626]">
          <p className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-3">Monthly Revenue (12 months)</p>
          <div className="h-[120px]" data-testid="revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#666', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#666', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v > 0 ? `$${v >= 1000 ? `${v/1000}k` : v}` : ''}
                  width={35}
                />
                <Tooltip
                  contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8, fontSize: 12, color: '#FFF' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="amount" fill={brandRGB} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
