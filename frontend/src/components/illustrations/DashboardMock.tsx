const S: Record<string, React.CSSProperties> = {
  root: { width: '100%', height: '100%', overflow: 'hidden', display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 14, boxSizing: 'border-box', background: '#0A0814', color: '#fff' },
  sidebar: { width: 180, flexShrink: 0, background: '#0A0714', display: 'flex', flexDirection: 'column', padding: '14px 10px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' },
  logo: { fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', background: 'linear-gradient(135deg, #a78bfa, #6C2EDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14, paddingLeft: 4 },
  userBlock: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 14 },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 },
  userName: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.2 },
  userRole: { fontSize: 9, color: 'rgba(255,255,255,0.3)' },
  sectionLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', padding: '6px 6px 4px', marginTop: 4 },
  navItem: { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 6px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 1, cursor: 'default' },
  navActive: { background: 'rgba(108,46,219,0.18)', color: '#c4b5fd', fontWeight: 600 },
  badge: { marginLeft: 'auto', fontSize: 8, fontWeight: 700, background: 'rgba(108,46,219,0.25)', color: '#c4b5fd', borderRadius: 99, padding: '1px 5px', lineHeight: '14px' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', background: '#0F0B1E', overflow: 'hidden', minWidth: 0 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  topTitle: { fontSize: 16, fontWeight: 800, color: '#fff' },
  topSub: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  topActions: { display: 'flex', alignItems: 'center', gap: 6 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  newLeadBtn: { background: '#6C2EDB', color: '#fff', fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'default', whiteSpace: 'nowrap' as const },
  content: { flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  statCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' },
  statLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 },
  statTrend: { fontSize: 10, fontWeight: 600, marginTop: 4 },
  contentRow: { display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, flex: 1, overflow: 'hidden' },
  panel: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  panelTitle: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' },
  panelLink: { fontSize: 10, color: '#6C2EDB', fontWeight: 500 },
  colHeaders: { display: 'grid', gridTemplateColumns: '1fr 60px 72px 56px', padding: '6px 14px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' },
  row: { display: 'grid', gridTemplateColumns: '1fr 60px 72px 56px', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' },
  rowAvatar: { width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0, marginRight: 6 },
  rowName: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.2 },
  rowSub: { fontSize: 9, color: 'rgba(255,255,255,0.2)' },
  rowType: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  rowValue: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' },
  statusBadge: { fontSize: 9, fontWeight: 600, borderRadius: '0 3px 3px 0', padding: '2px 6px', display: 'inline-block' },
  actItem: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 14px' },
  actDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 3 },
  actText: { fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, flex: 1 },
  actBold: { fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  actTime: { fontSize: 9, color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginLeft: 4 },
}

function Spark({ color, fill, pts }: { color: string; fill: string; pts: number[] }) {
  const W = 80, H = 22
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1
  const coords = pts.map((v, i) => ({ x: (i / (pts.length - 1)) * W, y: 3 + (1 - (v - mn) / rng) * (H - 6) }))
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x},${c.y}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', marginTop: 4 }}>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NavIcon({ active }: { active?: boolean }) {
  return <span style={{ width: 13, height: 13, borderRadius: 3, background: 'currentColor', opacity: active ? 0.8 : 0.35, flexShrink: 0 }} />
}

export default function DashboardMock({ className }: { className?: string }) {
  const leads = [
    { ini: 'JL', bg: 'rgba(167,139,250,0.2)', fg: '#a78bfa', name: 'Jessica Liu', sub: '2 days ago', type: 'Wedding', status: 'Quoted', sc: '#D97706', sb: 'rgba(217,119,6,0.1)', val: '$4,200' },
    { ini: 'MR', bg: 'rgba(52,211,153,0.18)', fg: '#6ee7b7', name: 'Marcus Reid', sub: '4 days ago', type: 'Portrait', status: 'Signed', sc: '#10B981', sb: 'rgba(16,185,129,0.1)', val: '$850' },
    { ini: 'AK', bg: 'rgba(251,191,36,0.18)', fg: '#fcd34d', name: 'Anika Kapoor', sub: 'Today', type: 'Commercial', status: 'Inquiry', sc: 'rgba(255,255,255,0.25)', sb: 'rgba(255,255,255,0.03)', val: '$6,500' },
    { ini: 'SL', bg: 'rgba(248,113,113,0.18)', fg: '#fca5a5', name: 'Sophie Laurent', sub: 'Yesterday', type: 'Wedding', status: 'Discovery', sc: '#6C2EDB', sb: 'rgba(108,46,219,0.1)', val: '$5,800' },
    { ini: 'TW', bg: 'rgba(96,165,250,0.18)', fg: '#93c5fd', name: 'Tom Walsh', sub: '3 days ago', type: 'Editorial', status: 'Signed', sc: '#10B981', sb: 'rgba(16,185,129,0.1)', val: '$3,200' },
  ]
  const activities = [
    { dot: '#10B981', text: <><b style={S.actBold}>Marcus</b> signed his contract</>, time: '2h ago' },
    { dot: '#E8891A', text: <><b style={S.actBold}>Jessica</b> received her quote</>, time: '5h ago' },
    { dot: '#6C2EDB', text: <>New inquiry from <b style={S.actBold}>Anika K.</b></>, time: 'Today' },
    { dot: '#93c5fd', text: <>Discovery call with <b style={S.actBold}>Sophie L.</b></>, time: 'Yest.' },
    { dot: '#10B981', text: <><b style={S.actBold}>Tom W.</b> signed · $3,200</>, time: '3d ago' },
  ]

  return (
    <div className={className} style={S.root}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.logo}>KOLOR</div>
        <div style={S.userBlock}>
          <span style={S.avatar}>SC</span>
          <div>
            <div style={S.userName}>Sarah Chen</div>
            <div style={S.userRole}>Wedding · Portrait</div>
          </div>
        </div>
        <div style={S.sectionLabel}>WORKSPACE</div>
        {[
          { label: 'Dashboard', active: true },
          { label: 'Leads', badge: '47' },
          { label: 'Quotes', badge: '3' },
          { label: 'Contracts' },
        ].map(n => (
          <div key={n.label} style={{ ...S.navItem, ...(n.active ? S.navActive : {}) }}>
            <NavIcon active={n.active} />
            {n.label}
            {n.badge && <span style={S.badge}>{n.badge}</span>}
          </div>
        ))}
        <div style={S.sectionLabel}>SCHEDULE</div>
        <div style={S.navItem}><NavIcon />Calendar</div>
        <div style={{ flex: 1 }} />
        <div style={{ ...S.navItem, marginTop: 'auto' }}><NavIcon />Help &amp; feedback</div>
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div>
            <div style={S.topTitle}>Good morning, Sarah <span style={{ color: '#a78bfa' }}>&#10022;</span></div>
            <div style={S.topSub}>3 leads awaiting quotes · Tuesday, 27 March</div>
          </div>
          <div style={S.topActions}>
            <span style={S.iconBtn}><span style={{ width: 12, height: 12, borderRadius: 2, border: '1.5px solid rgba(255,255,255,0.2)' }} /></span>
            <span style={S.iconBtn}><span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)' }} /></span>
            <span style={S.newLeadBtn}>+ New Lead</span>
          </div>
        </div>

        <div style={S.content}>
          {/* Stats */}
          <div style={S.statRow}>
            {[
              { label: 'ACTIVE LEADS', val: '47', color: '#6C2EDB', fill: 'rgba(108,46,219,0.12)', trend: '↑ 8 this week', tc: '#10B981', pts: [8, 12, 18, 22, 28, 35, 42, 47] },
              { label: 'QUOTES SENT', val: '12', color: '#E8891A', fill: 'rgba(232,137,26,0.10)', trend: '3 pending', tc: '#E8891A', pts: [3, 5, 4, 7, 8, 10, 11, 12] },
              { label: 'REVENUE', val: '$24k', color: '#10B981', fill: 'rgba(16,185,129,0.10)', trend: '↑ 18% vs last', tc: '#10B981', pts: [6, 8, 10, 14, 16, 18, 20, 24] },
              { label: 'SIGNED', val: '8', color: '#10B981', fill: 'rgba(16,185,129,0.10)', trend: '↑ 2 this month', tc: '#10B981', pts: [1, 2, 3, 3, 5, 6, 7, 8] },
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={S.statLabel}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={S.statValue}>{s.val}</div>
                    <div style={{ ...S.statTrend, color: s.tc }}>{s.trend}</div>
                  </div>
                  <Spark color={s.color} fill={s.fill} pts={s.pts} />
                </div>
              </div>
            ))}
          </div>

          {/* Leads table + Activity */}
          <div style={S.contentRow}>
            <div style={S.panel}>
              <div style={S.panelHeader}>
                <span style={S.panelTitle}>Recent Leads</span>
                <span style={S.panelLink}>View all →</span>
              </div>
              <div style={S.colHeaders}>
                <span>Client</span><span>Type</span><span>Status</span><span style={{ textAlign: 'right' }}>Value</span>
              </div>
              {leads.map(l => (
                <div key={l.ini} style={S.row}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ ...S.rowAvatar, background: l.bg, color: l.fg }}>{l.ini}</span>
                    <div><div style={S.rowName}>{l.name}</div><div style={S.rowSub}>{l.sub}</div></div>
                  </div>
                  <span style={S.rowType}>{l.type}</span>
                  <span style={{ ...S.statusBadge, borderLeft: `2px solid ${l.sc}`, background: l.sb, color: l.sc }}>{l.status}</span>
                  <span style={S.rowValue}>{l.val}</span>
                </div>
              ))}
            </div>

            <div style={S.panel}>
              <div style={S.panelHeader}><span style={S.panelTitle}>Activity</span></div>
              {activities.map((a, i) => (
                <div key={i} style={S.actItem}>
                  <span style={{ ...S.actDot, background: a.dot }} />
                  <span style={S.actText}>{a.text}</span>
                  <span style={S.actTime}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
