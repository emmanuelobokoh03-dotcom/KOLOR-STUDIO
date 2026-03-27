const font = "'Inter', -apple-system, sans-serif"

const lineItems = [
  { name: 'Full-day coverage', sub: '8 hours · 2 locations · June 14th', price: '$2,800' },
  { name: 'Second photographer', sub: 'Full day coverage', price: '$600' },
  { name: 'Engagement session', sub: '2hr · location of choice', price: '$350' },
  { name: 'Premium album design', sub: '30-page lay-flat binding', price: '$450' },
]

const timeline = [
  { type: 'done' as const, title: 'Quote sent', time: 'March 25 · 2:14pm' },
  { type: 'active' as const, title: 'Your approval', time: 'Waiting for you' },
  { type: 'pending' as const, title: 'Sign contract', time: 'After approval' },
  { type: 'pending' as const, title: 'Booking confirmed', time: "You're all set" },
]

function TimelineDot({ type }: { type: 'done' | 'active' | 'pending' }) {
  if (type === 'done') return (
    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6L5 8.5L9.5 4" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  )
  if (type === 'active') return (
    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(108,46,219,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6C2EDB' }} />
    </span>
  )
  return <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#F3F0FB', border: '1.5px dashed #EDE8F5', flexShrink: 0 }} />
}

export default function PortalMock({ className }: { className?: string }) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: font, fontSize: 14, boxSizing: 'border-box', background: '#F9F7FE', color: '#1A1A2E' }}>
      {/* Portal nav */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid #EDE8F5', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOLOR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8891A' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Awaiting your approval</span>
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Need help?</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ padding: '28px 32px', borderRight: '1px solid #EDE8F5', overflow: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E' }}>Hi Jessica — here&rsquo;s your quote <span style={{ color: '#a78bfa' }}>&#10022;</span></div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>From Sarah Chen · Wedding Photography · Sent March 25, 2025</div>
          </div>

          {/* Quote card */}
          <div style={{ background: '#fff', border: '1px solid #EDE8F5', borderRadius: 12, boxShadow: '0 2px 8px rgba(108,46,219,0.06)', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(108,46,219,0.06), rgba(108,46,219,0.02))', borderBottom: '1px solid #EDE8F5', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1A2E' }}>Summer Wedding Photography</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Quote #QT-0031 · Valid until April 14, 2025</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(108,46,219,0.1)', border: '1px solid rgba(108,46,219,0.2)', color: '#6C2EDB', borderRadius: 99, padding: '3px 10px' }}>Quote ready</span>
            </div>

            <div style={{ padding: '0 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '8px 0', borderBottom: '1px solid #F3F0FB', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.04em' }}>
                <span>Service</span><span style={{ textAlign: 'right' }}>Price</span>
              </div>
              {lineItems.map(l => (
                <div key={l.name} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '10px 0', borderBottom: '1px solid #F3F0FB', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>{l.name}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{l.sub}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{l.price}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#F9F7FE', borderTop: '1px solid #EDE8F5' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1A1A2E', fontVariantNumeric: 'tabular-nums' }}>$4,200</span>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {timeline.map((step, i) => (
              <div key={step.title} style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <TimelineDot type={step.type} />
                  {i < timeline.length - 1 && <span style={{ width: 1, flex: 1, minHeight: 20, background: '#EDE8F5' }} />}
                </div>
                <div style={{ paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: step.type === 'active' ? '#6C2EDB' : step.type === 'pending' ? '#9CA3AF' : '#1A1A2E' }}>{step.title}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{step.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ background: '#fff', padding: 24, display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '1px solid #EDE8F5', overflow: 'auto' }}>
          {/* Summary */}
          <div style={{ background: 'linear-gradient(135deg, rgba(108,46,219,0.08), rgba(108,46,219,0.03))', border: '1px solid rgba(108,46,219,0.2)', borderRadius: 10, padding: '14px 16px' }}>
            {[
              { l: 'Client', v: 'Jessica Liu' },
              { l: 'Date', v: 'June 14, 2025' },
              { l: 'Photographer', v: 'Sarah Chen' },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#6B7280' }}>{r.l}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#1A1A2E' }}>{r.v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(108,46,219,0.1)', paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#6B7280' }}>Total</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#6C2EDB' }}>$4,200</span>
            </div>
          </div>

          {/* Action */}
          <div style={{ background: '#F9F7FE', border: '1px solid #EDE8F5', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>Ready to approve?</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>Approving confirms you&rsquo;ve reviewed the quote. You&rsquo;ll sign the contract next.</div>
            <div style={{ width: '100%', height: 44, background: '#6C2EDB', color: '#fff', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7L6 10L11 4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Approve quote
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Request changes instead</div>
          </div>

          {/* Signature */}
          <div style={{ background: '#fff', border: '1px solid #EDE8F5', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Your signature</div>
            <div style={{ border: '1.5px dashed #D4CAF0', borderRadius: 8, height: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: '#6C2EDB' }}>Jessica Liu</span>
              <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Click to sign</span>
            </div>
          </div>

          {/* Security */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '8px 12px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#374151' }}>256-bit SSL · legally binding e-signature</span>
          </div>

          {/* Note */}
          <div style={{ background: '#F9F7FE', border: '0.5px solid #EDE8F5', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 700 }}>Questions?</strong> Reply directly to Sarah at sarah@studiokolor.co or use the chat button below.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
