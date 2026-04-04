import { useNavigate } from 'react-router-dom'

// AUDIT FIX [10.1]: Custom 404 page
export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080612',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
      data-testid="not-found-page"
    >
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
        404
      </p>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
        This page doesn't exist.
      </h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 400, lineHeight: 1.6, marginBottom: 32 }}>
        The link you followed may be broken, or the page may have been removed.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: '#6C2EDB', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          data-testid="not-found-home-btn"
        >
          Back to home
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 24px', fontSize: 14, cursor: 'pointer' }}
          data-testid="not-found-back-btn"
        >
          Go back
        </button>
      </div>
    </div>
  )
}
