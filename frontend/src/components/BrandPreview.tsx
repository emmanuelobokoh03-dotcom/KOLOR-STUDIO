import { useState } from 'react'
import {
  Image as Image,
  FileText,
  Layout,
  Check,
  CaretRight,
  Star,
  CalendarBlank,
  Clock,
  Envelope
} from '@phosphor-icons/react'

interface BrandPreviewProps {
  primary: string
  accent: string
  font: string
  logoUrl: string | null
}

type PreviewTab = 'portfolio' | 'quote' | 'portal'

function adjustBrightness(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amt))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

function PortfolioPreview({ primary, accent, font, logoUrl }: BrandPreviewProps) {
  return (
    <div className="bg-surface-base rounded-lg overflow-hidden text-gray-900 h-full" data-testid="preview-portfolio">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-5 w-5 rounded object-contain" />
          ) : (
            <div className="h-5 w-5 rounded flex items-center justify-center" style={{ background: primary }}>
              <span className="text-white text-[8px] font-bold">K</span>
            </div>
          )}
          <span className="font-bold text-[11px]" style={{ fontFamily: font, color: '#111' }}>Your Studio</span>
        </div>
        <div className="flex gap-3 text-[9px] font-medium text-text-tertiary">
          <span style={{ color: primary, borderBottom: `1.5px solid ${primary}`, paddingBottom: 1 }}>Work</span>
          <span>About</span>
          <span>Contact</span>
        </div>
      </div>

      {/* Hero */}
      <div className="px-4 py-4 text-center">
        <h3 className="text-sm font-bold mb-1" style={{ fontFamily: font, color: '#111' }}>Creative Portfolio</h3>
        <p className="text-[9px] text-text-tertiary">Showcasing exceptional visual storytelling</p>
      </div>

      {/* Gallery Grid */}
      <div className="px-3 grid grid-cols-3 gap-1.5">
        {[
          { h: 'h-16', color: `${primary}15` },
          { h: 'h-16', color: `${accent}15` },
          { h: 'h-16', color: `${primary}10` },
        ].map((item, i) => (
          <div
            key={i}
            className={`${item.h} rounded-md relative group cursor-pointer overflow-hidden`}
            style={{ background: item.color }}
          >
            <Image className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: `${primary}40` }} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5" style={{ background: `linear-gradient(transparent 40%, ${primary}CC)` }}>
              <span className="text-white text-[7px] font-medium">Project {i + 1}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Featured badge */}
      <div className="px-3 mt-2 mb-3 flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-medium" style={{ background: `${accent}15`, color: accent }}>
          <Star className="w-2.5 h-2.5" /> Featured
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-medium" style={{ background: `${primary}15`, color: primary }}>
          Photography
        </div>
      </div>

      {/* CTA */}
      <div className="px-3 pb-3">
        <button className="w-full py-1.5 rounded-md text-white text-[9px] font-semibold" style={{ background: primary }}>
          Get in Touch
        </button>
      </div>
    </div>
  )
}

function QuotePreview({ primary, accent, font, logoUrl }: BrandPreviewProps) {
  return (
    <div className="bg-surface-base rounded-lg overflow-hidden text-gray-900 h-full" data-testid="preview-quote">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-5 w-5 rounded object-contain" />
          ) : (
            <div className="h-5 w-5 rounded flex items-center justify-center" style={{ background: primary }}>
              <span className="text-white text-[8px] font-bold">K</span>
            </div>
          )}
          <div>
            <span className="font-bold text-[10px] block leading-tight" style={{ fontFamily: font, color: '#111' }}>Your Studio</span>
            <span className="text-[7px] text-text-secondary">Professional Quotes</span>
          </div>
        </div>
        <div className="text-[8px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${accent}15`, color: accent }}>
          Pending
        </div>
      </div>

      {/* Quotes Content */}
      <div className="px-4 py-3">
        <h4 className="text-[11px] font-bold mb-2" style={{ fontFamily: font, color: '#111' }}>Brand Photography Package</h4>
        
        {/* Line Items */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-[8px] pb-1 border-b font-medium" style={{ borderColor: `${primary}20`, color: primary }}>
            <span>Service</span><span>Amount</span>
          </div>
          {[
            { name: 'Photo Session (4h)', price: '$800' },
            { name: 'Editing & Retouching', price: '$400' },
            { name: 'Digital Delivery', price: '$150' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between text-[8px] text-gray-600 py-0.5">
              <span>{item.name}</span><span>{item.price}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-1.5 px-2 rounded-md text-[10px] font-bold" style={{ background: `${primary}10`, color: primary }}>
          <span>Total</span><span>$1,350.00</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex gap-1.5">
        <button className="flex-1 py-1.5 rounded-md text-white text-[9px] font-semibold" style={{ background: primary }}>
          Accept Quotes
        </button>
        <button className="flex-1 py-1.5 rounded-md text-[9px] font-semibold border" style={{ borderColor: `${accent}40`, color: accent }}>
          Message
        </button>
      </div>
    </div>
  )
}

function PortalPreview({ primary, accent, font, logoUrl }: BrandPreviewProps) {
  const steps = [
    { label: 'New', done: true },
    { label: 'Quoted', done: true },
    { label: 'Booked', active: true },
    { label: 'Delivered', done: false },
  ]

  return (
    <div className="bg-surface-base rounded-lg overflow-hidden text-gray-900 h-full" data-testid="preview-portal">
      {/* Header */}
      <div className="px-4 py-3" style={{ background: `linear-gradient(135deg, ${primary}, ${adjustBrightness(primary, 30)})` }}>
        <div className="flex items-center gap-2 mb-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-5 w-5 rounded object-contain bg-white/20 p-0.5" />
          ) : (
            <div className="h-5 w-5 rounded flex items-center justify-center bg-white/20">
              <span className="text-white text-[8px] font-bold">K</span>
            </div>
          )}
          <span className="font-bold text-[11px] text-white" style={{ fontFamily: font }}>Your Studio</span>
        </div>
        <h4 className="text-white text-[10px] font-semibold leading-tight">Wedding Photography</h4>
        <p className="text-white/70 text-[8px]">Client: Sarah Johnson</p>
      </div>

      {/* Status Timeline */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 relative">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold"
                style={{
                  background: s.done ? primary : s.active ? `${primary}20` : '#F3F4F6',
                  color: s.done ? 'white' : s.active ? primary : '#9CA3AF',
                  border: s.active ? `1.5px solid ${primary}` : 'none',
                }}
              >
                {s.done ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </div>
              <span className="text-[7px] font-medium" style={{ color: s.done || s.active ? primary : '#9CA3AF' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 p-2 rounded-md border border-gray-100 group cursor-pointer hover:border-gray-200">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${primary}10` }}>
              <FileText className="w-3 h-3" style={{ color: primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[8px] font-medium text-gray-800 block">View Contract</span>
              <span className="text-[7px] text-text-secondary">Signed on Mar 1</span>
            </div>
            <CaretRight className="w-3 h-3 text-text-secondary" />
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md border border-gray-100 group cursor-pointer hover:border-gray-200">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${accent}10` }}>
              <CalendarBlank className="w-3 h-3" style={{ color: accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[8px] font-medium text-gray-800 block">Upcoming Session</span>
              <span className="text-[7px] text-text-secondary">Mar 15, 2:00 PM</span>
            </div>
            <CaretRight className="w-3 h-3 text-text-secondary" />
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="px-4 pb-3">
        <button className="w-full py-1.5 rounded-md text-white text-[9px] font-semibold flex items-center justify-center gap-1" style={{ background: primary }}>
          <Envelope className="w-3 h-3" /> Contact Studio
        </button>
      </div>
    </div>
  )
}

export default function BrandPreview({ primary, accent, font, logoUrl }: BrandPreviewProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('portfolio')

  const tabs: { key: PreviewTab; label: string; icon: React.ElementType }[] = [
    { key: 'portfolio', label: 'Portfolio', icon: Image },
    { key: 'quote', label: 'Quotes', icon: FileText },
    { key: 'portal', label: 'Portal', icon: Layout },
  ]

  return (
    <div className="flex flex-col h-full" data-testid="brand-preview-panel">
      {/* Tab Bar */}
      <div className="flex gap-1 mb-3 p-1 bg-surface-base rounded-lg">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-light-50 text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            style={activeTab === t.key ? { boxShadow: `0 0 0 1px ${primary}30` } : undefined}
            data-testid={`preview-tab-${t.key}`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }} />
        <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">Live Preview</span>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 rounded-xl border border-light-200 overflow-hidden bg-surface-base p-2 min-h-0">
        <div className="h-full overflow-auto rounded-lg">
          {activeTab === 'portfolio' && <PortfolioPreview primary={primary} accent={accent} font={font} logoUrl={logoUrl} />}
          {activeTab === 'quote' && <QuotePreview primary={primary} accent={accent} font={font} logoUrl={logoUrl} />}
          {activeTab === 'portal' && <PortalPreview primary={primary} accent={accent} font={font} logoUrl={logoUrl} />}
        </div>
      </div>
    </div>
  )
}
