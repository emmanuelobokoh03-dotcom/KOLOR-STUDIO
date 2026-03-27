const font = "'Inter', -apple-system, sans-serif"
const S: Record<string, React.CSSProperties> = {
  root: { width: '100%', height: '100%', overflow: 'hidden', display: 'flex', fontFamily: font, fontSize: 14, boxSizing: 'border-box', background: '#0A0814', color: '#fff' },
  sidebar: { width: 180, flexShrink: 0, background: '#0A0714', display: 'flex', flexDirection: 'column', padding: '14px 10px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' },
  logo: { fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14, paddingLeft: 4 },
  sLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', padding: '6px 6px 4px', marginTop: 4 },
  nav: { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 6px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 1 },
  navA: { background: 'rgba(108,46,219,0.18)', color: '#c4b5fd', fontWeight: 600 },
  dot: { width: 13, height: 13, borderRadius: 3, background: 'currentColor', opacity: 0.35, flexShrink: 0 },
  dotA: { opacity: 0.8 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', background: '#0F0B1E', overflow: 'hidden', minWidth: 0 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  content: { flex: 1, display: 'flex', gap: 16, padding: '16px 20px', overflow: 'hidden' },
  left: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' },
  right: { width: 200, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' },
  cardH: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  cardLabel: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' },
  cardAction: { fontSize: 9, color: '#6C2EDB', fontWeight: 500 },
  ghost: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, padding: '5px 12px', borderRadius: 6, cursor: 'default' },
  primary: { background: '#6C2EDB', color: '#fff', fontSize: 10, fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'default' },
  fieldLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 2, letterSpacing: '0.04em' },
  fieldVal: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  colH: { display: 'grid', gridTemplateColumns: '1fr 90px 70px 28px', padding: '6px 14px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)' },
  liRow: { display: 'grid', gridTemplateColumns: '1fr 90px 70px 28px', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' },
  qty: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' as const, padding: '2px 0', width: 32 },
  price: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' },
  del: { width: 18, height: 18, borderRadius: 4, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px' },
  tLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  tVal: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' },
}

const lines = [
  { name: 'Full-day coverage', sub: '8 hours · 2 locations', price: '$2,800' },
  { name: 'Second photographer', sub: 'Full day · same locations', price: '$600' },
  { name: 'Engagement session', sub: '2hr · location of choice', price: '$350' },
  { name: 'Premium album design', sub: '30-page · lay-flat binding', price: '$450' },
]

export default function QuoteMock({ className }: { className?: string }) {
  return (
    <div className={className} style={S.root}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.logo}>KOLOR</div>
        <div style={S.sLabel}>WORKSPACE</div>
        {['Dashboard', 'Leads', 'Quotes', 'Contracts'].map((n, i) => (
          <div key={n} style={{ ...S.nav, ...(i === 2 ? S.navA : {}) }}>
            <span style={{ ...S.dot, ...(i === 2 ? S.dotA : {}) }} />{n}
          </div>
        ))}
        <div style={S.sLabel}>SCHEDULE</div>
        <div style={S.nav}><span style={S.dot} />Calendar</div>
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>New Quote</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Quote #QT-0031 · Draft</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={S.ghost}>Save draft</span>
            <span style={S.primary}>Send quote →</span>
          </div>
        </div>

        <div style={S.content}>
          {/* Left column */}
          <div style={S.left}>
            {/* Client card */}
            <div style={S.card}>
              <div style={S.cardH}><span style={S.cardLabel}>Client</span><span style={S.cardAction}>Change</span></div>
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>JL</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Jessica Liu</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>jessica@liuweddings.com · +1 415 555 0192</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, background: 'rgba(108,46,219,0.15)', color: '#a78bfa', borderRadius: 99, padding: '2px 8px' }}>Wedding</span>
              </div>
              <div style={{ display: 'flex', gap: 12, padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {[{ l: 'Project', v: 'Summer Wedding Photography' }, { l: 'Date', v: 'June 14, 2025' }, { l: 'Valid until', v: 'April 14, 2025' }].map(f => (
                  <div key={f.l}><div style={S.fieldLabel}>{f.l}</div><div style={S.fieldVal}>{f.v}</div></div>
                ))}
              </div>
            </div>

            {/* Line items */}
            <div style={S.card}>
              <div style={S.cardH}><span style={S.cardLabel}>Line Items</span></div>
              <div style={S.colH}><span>Description</span><span style={{ textAlign: 'center' }}>Qty</span><span style={{ textAlign: 'right' }}>Price</span><span /></div>
              {lines.map(l => (
                <div key={l.name} style={S.liRow}>
                  <div><div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{l.name}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{l.sub}</div></div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}><span style={S.qty}>1×</span></div>
                  <div style={S.price}>{l.price}</div>
                  <div style={S.del}><span style={{ width: 8, height: 1.5, background: 'rgba(239,68,68,0.5)', borderRadius: 1 }} /></div>
                </div>
              ))}
              <div style={{ padding: '10px 14px', borderTop: '1px dashed rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px dashed rgba(108,46,219,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(108,46,219,0.6)', fontWeight: 700 }}>+</span>
                <span style={{ fontSize: 10, color: 'rgba(108,46,219,0.6)', fontWeight: 500 }}>Add line item</span>
              </div>
            </div>

            {/* Totals */}
            <div style={S.card}>
              {[{ l: 'Subtotal', v: '$4,200.00' }, { l: 'Discount', v: '—', c: '#10B981' }, { l: 'Tax (0%)', v: '$0.00' }].map(r => (
                <div key={r.l} style={S.totalRow}><span style={S.tLabel}>{r.l}</span><span style={{ ...S.tVal, color: r.c || S.tVal.color }}>{r.v}</span></div>
              ))}
              <div style={{ ...S.totalRow, background: 'rgba(108,46,219,0.06)', borderTop: '1px solid rgba(108,46,219,0.1)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>$4,200.00</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={S.right}>
            {/* Quote value */}
            <div style={S.card}>
              <div style={{ padding: '12px 14px' }}>
                <div style={S.fieldLabel}>QUOTE VALUE</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>$4,200</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Wedding · June 14th</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8891A' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Draft · not sent</span>
                </div>
              </div>
            </div>

            {/* Send btn */}
            <div style={{ background: '#6C2EDB', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'default' }}>
              Send to Jessica →
            </div>

            {/* Client preview */}
            <div style={S.card}>
              <div style={{ padding: '10px 14px' }}>
                <div style={S.fieldLabel}>CLIENT PREVIEW</div>
                <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: 4, background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)' }} />
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>KOLOR</div>
                    {[90, 70, 85, 60, 75, 50].map((w, i) => (
                      <div key={i} style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 4, width: `${w}%` }} />
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Total</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>$4,200</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ ...S.card, background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ ...S.fieldLabel, color: '#10B981' }}>STATS</div>
                {[
                  { l: 'Avg acceptance', v: '78%', c: '#10B981' },
                  { l: 'Avg response', v: '1.4 days' },
                  { l: 'Similar quotes', v: '6 sent' },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{r.l}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: r.c || 'rgba(255,255,255,0.6)' }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
