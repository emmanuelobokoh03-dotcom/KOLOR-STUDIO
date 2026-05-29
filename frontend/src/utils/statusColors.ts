// Centralised status pill styles — single source of truth for quote status colours
// Used in: QuoteBuilderModal (mobile bar), QuotesTab, LeadCard

export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
export type LeadStatus = 'NEW' | 'REVIEWING' | 'CONTACTED' | 'QUALIFIED' | 'QUOTED' | 'FINALIZING' | 'BOOKED' | 'LOST'

export interface PillStyle {
  background: string
  color: string
  dotColor: string
  label: string
}

export function getQuoteStatusPillStyle(status: QuoteStatus | string | undefined): PillStyle {
  switch (status) {
    case 'ACCEPTED':
      return { background: 'rgba(16,185,129,0.1)', color: '#065F46', dotColor: '#059669', label: 'Approved' }
    case 'SENT':
      return { background: 'rgba(108,46,219,0.1)', color: '#6C2EDB', dotColor: '#6C2EDB', label: 'Sent' }
    case 'VIEWED':
      return { background: 'rgba(245,158,11,0.1)', color: '#92400E', dotColor: '#D97706', label: 'Viewed' }
    case 'DECLINED':
      return { background: 'rgba(239,68,68,0.1)', color: '#991B1B', dotColor: '#DC2626', label: 'Declined' }
    case 'EXPIRED':
      return { background: 'rgba(107,114,128,0.1)', color: '#374151', dotColor: '#6B7280', label: 'Expired' }
    case 'DRAFT':
    default:
      return { background: 'rgba(245,158,11,0.08)', color: '#92400E', dotColor: '#D97706', label: 'Draft' }
  }
}

export function getLeadStatusPillStyle(status: LeadStatus | string | undefined): PillStyle {
  switch (status) {
    case 'BOOKED':
      return { background: 'rgba(16,185,129,0.1)', color: '#065F46', dotColor: '#059669', label: 'Booked' }
    case 'QUOTED':
    case 'FINALIZING':
      return { background: 'rgba(108,46,219,0.1)', color: '#6C2EDB', dotColor: '#6C2EDB', label: status === 'QUOTED' ? 'Quoted' : 'Finalizing' }
    case 'QUALIFIED':
      return { background: 'rgba(59,130,246,0.1)', color: '#1E40AF', dotColor: '#3B82F6', label: 'Qualified' }
    case 'CONTACTED':
      return { background: 'rgba(16,185,129,0.08)', color: '#065F46', dotColor: '#10B981', label: 'Contacted' }
    case 'REVIEWING':
      return { background: 'rgba(245,158,11,0.1)', color: '#92400E', dotColor: '#D97706', label: 'Reviewing' }
    case 'LOST':
      return { background: 'rgba(239,68,68,0.08)', color: '#991B1B', dotColor: '#DC2626', label: 'Lost' }
    case 'NEW':
    default:
      return { background: 'rgba(107,114,128,0.08)', color: '#374151', dotColor: '#9CA3AF', label: 'New' }
  }
}
