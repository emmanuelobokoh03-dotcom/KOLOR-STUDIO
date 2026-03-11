import { useState, useEffect } from 'react'
import {
  TrendUp,
  CalendarBlank,
  CurrencyDollar,
  Crosshair,
  Clock,
  Users,
  Trophy,
  ChartBar,
  ArrowsClockwise,
  SpinnerGap,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from '@phosphor-icons/react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  analyticsApi,
  DashboardAnalytics,
  MonthlyTrendData,
  LeadSourceData,
  PipelineStatusData,
  User
} from '../services/api'
import { formatCurrency, CurrencySettings } from '../utils/currency'

interface AnalyticsDashboardProps {
  user: User | null;
  onFilterByStatus?: (status: string | null) => void;
}

export default function AnalyticsDashboard({ user, onFilterByStatus }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardAnalytics | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendData[]>([])
  const [leadSources, setLeadSources] = useState<LeadSourceData[]>([])
  const [pipeline, setPipeline] = useState<PipelineStatusData[]>([])

  // Get user currency settings
  const currencySettings: CurrencySettings = {
    currency: user?.currency || 'USD',
    currencySymbol: user?.currencySymbol || '$',
    currencyPosition: (user?.currencyPosition as 'BEFORE' | 'AFTER') || 'BEFORE',
    numberFormat: (user?.numberFormat as any) || '1,000.00',
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    
    const [dashboardRes, trendRes, sourcesRes, pipelineRes] = await Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getMonthlyTrend(),
      analyticsApi.getLeadSources(),
      analyticsApi.getPipelineByStatus(),
    ])

    if (dashboardRes.data) setDashboard(dashboardRes.data)
    if (trendRes.data) setMonthlyTrend(trendRes.data.trend)
    if (sourcesRes.data) setLeadSources(sourcesRes.data.sources)
    if (pipelineRes.data) setPipeline(pipelineRes.data.pipeline)

    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
  }

  const getChangeIndicator = (change: number) => {
    if (change > 0) return { icon: ArrowUpRight, color: 'text-green-400', bg: 'bg-green-900/30' }
    if (change < 0) return { icon: ArrowDownRight, color: 'text-red-400', bg: 'bg-red-50' }
    return { icon: Minus, color: 'text-text-secondary', bg: 'bg-light-100' }
  }

  const getConversionRateColor = (rate: number) => {
    if (rate >= 40) return 'text-green-400'
    if (rate >= 20) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <ChartBar weight="duotone" className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Unable to load analytics. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Revenue Analytics</h2>
          <p className="text-text-secondary text-sm mt-1">
            Track your business performance and revenue trends
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-light-200 rounded-lg text-text-secondary hover:bg-light-100 transition disabled:opacity-50"
          data-testid="refresh-analytics"
        >
          <ArrowsClockwise className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Value */}
        <div className="bg-gradient-to-br from-brand-primary-dark/40 to-brand-primary-dark/40 rounded-xl p-5 border border-purple-200" data-testid="card-pipeline">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-brand-primary/30 rounded-lg">
              <TrendUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-purple-600 mb-1">Pipeline Value</p>
          <p className="text-3xl font-bold text-purple-700">
            {formatCurrency(dashboard.overview.pipelineValue, currencySettings)}
          </p>
          <p className="text-xs text-purple-600 mt-2">Total potential revenue</p>
        </div>

        {/* Booked This Month */}
        <div className="bg-white rounded-xl p-5 border border-light-200" data-testid="card-this-month">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CalendarBlank className="w-5 h-5 text-emerald-600" />
            </div>
            {dashboard.overview.bookedThisMonth.changePercent !== 0 && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeIndicator(dashboard.overview.bookedThisMonth.changePercent).bg} ${getChangeIndicator(dashboard.overview.bookedThisMonth.changePercent).color}`}>
                {(() => {
                  const { icon: Icon } = getChangeIndicator(dashboard.overview.bookedThisMonth.changePercent)
                  return <Icon className="w-3 h-3" />
                })()}
                {Math.abs(dashboard.overview.bookedThisMonth.changePercent).toFixed(0)}%
              </div>
            )}
          </div>
          <p className="text-sm text-text-secondary mb-1">Booked This Month</p>
          <p className="text-3xl font-bold text-text-primary">
            {formatCurrency(dashboard.overview.bookedThisMonth.value, currencySettings)}
          </p>
          <p className="text-xs text-text-tertiary mt-2">
            {dashboard.overview.bookedThisMonth.count} booking{dashboard.overview.bookedThisMonth.count !== 1 ? 's' : ''} in {dashboard.overview.bookedThisMonth.monthName}
          </p>
        </div>

        {/* Year to Date */}
        <div className="bg-white rounded-xl p-5 border border-light-200" data-testid="card-ytd">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ChartBar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-1">Year to Date</p>
          <p className="text-3xl font-bold text-text-primary">
            {formatCurrency(dashboard.overview.bookedThisYear.value, currencySettings)}
          </p>
          <p className="text-xs text-text-tertiary mt-2">
            {dashboard.overview.bookedThisYear.count} booking{dashboard.overview.bookedThisYear.count !== 1 ? 's' : ''} in {dashboard.overview.bookedThisYear.year}
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-xl p-5 border border-light-200" data-testid="card-conversion">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Crosshair className="w-5 h-5 text-amber-700" />
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-1">Conversion Rate</p>
          <p className={`text-3xl font-bold ${getConversionRateColor(dashboard.overview.conversionRate)}`}>
            {dashboard.overview.conversionRate}%
          </p>
          <p className="text-xs text-text-tertiary mt-2">Inquiry to booking</p>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-light-100 rounded-xl p-4 border border-light-200">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollar className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-text-secondary">Avg Deal Size</span>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {formatCurrency(dashboard.metrics.avgDealSize, currencySettings)}
          </p>
        </div>

        <div className="bg-light-100 rounded-xl p-4 border border-light-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-text-secondary">Avg Time to Close</span>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {dashboard.metrics.avgTimeToClose} days
          </p>
        </div>

        <div className="bg-light-100 rounded-xl p-4 border border-light-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-text-secondary">Active Leads</span>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {dashboard.metrics.activeLeads}
          </p>
        </div>

        <div className="bg-light-100 rounded-xl p-4 border border-light-200">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-text-secondary">Win Rate</span>
          </div>
          <p className={`text-xl font-bold ${getConversionRateColor(dashboard.metrics.winRate)}`}>
            {dashboard.metrics.winRate}%
          </p>
        </div>
      </div>

      {/* Monthly Revenue Trend Chart */}
      <div className="bg-white rounded-xl p-6 border border-light-200">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Trend</h3>
        {monthlyTrend.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value, { ...currencySettings, numberFormat: '1,000.00' }).replace('.00', '')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={((value: number | undefined) => value !== undefined ? [formatCurrency(value, currencySettings), 'Revenue'] : ['—', 'Revenue']) as any}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {monthlyTrend.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === monthlyTrend.length - 1 ? '#8b5cf6' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-text-tertiary">
            <p>No booking data available yet</p>
          </div>
        )}
      </div>

      {/* Bottom Section: Lead Sources & Pipeline */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead Source Performance */}
        <div className="bg-white rounded-xl p-6 border border-light-200">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Lead Source Performance</h3>
          {leadSources.length > 0 ? (
            <div className="space-y-3">
              {leadSources.map((source) => (
                <div key={source.source} className="bg-light-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">{source.sourceLabel}</span>
                    <span className={`text-sm font-semibold ${getConversionRateColor(source.conversionRate)}`}>
                      {source.conversionRate}% conversion
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <span>{source.totalLeads} leads • {source.bookedLeads} booked</span>
                    <span className="text-purple-600">
                      {formatCurrency(source.revenue, currencySettings)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-light-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-primary to-brand-primary rounded-full"
                      style={{ width: `${Math.min(source.conversionRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <p>No lead source data available</p>
            </div>
          )}
        </div>

        {/* Pipeline by Stage */}
        <div className="bg-white rounded-xl p-6 border border-light-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Pipeline by Stage</h3>
            {onFilterByStatus && (
              <span className="text-xs text-text-tertiary">Click to filter</span>
            )}
          </div>
          {pipeline.length > 0 ? (
            <div className="space-y-3">
              {pipeline.filter(p => p.count > 0 || ['NEW', 'BOOKED'].includes(p.status)).map((stage) => (
                <div 
                  key={stage.status} 
                  className={`flex items-center gap-4 ${onFilterByStatus ? 'cursor-pointer hover:bg-light-100 rounded-lg p-2 -mx-2 transition' : ''}`}
                  onClick={() => onFilterByStatus?.(stage.status)}
                  data-testid={`pipeline-stage-${stage.status.toLowerCase()}`}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{stage.label}</span>
                      <span className="text-sm text-text-secondary">{stage.count} leads</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex-1 h-1.5 bg-light-200 rounded-full overflow-hidden mr-4">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            backgroundColor: stage.color,
                            width: `${Math.min((stage.count / Math.max(...pipeline.map(p => p.count), 1)) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-purple-600 whitespace-nowrap">
                        {formatCurrency(stage.value, currencySettings)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <p>No pipeline data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-text-tertiary">
        Last updated: {new Date(dashboard.updatedAt).toLocaleString()}
      </div>
    </div>
  )
}
