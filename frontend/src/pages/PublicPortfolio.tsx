import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { SpinnerGap, Star, X, CaretLeft, CaretRight, List as ListIcon } from '@phosphor-icons/react'
import { 
  portfolioApi, 
  PortfolioItem, 
  PortfolioCategory, 
  PORTFOLIO_CATEGORY_LABELS 
} from '../services/api'
import { getIndustryLanguage, IndustryType } from '../utils/industryLanguage'

export default function PublicPortfolio() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState<{
    id: string; name: string; firstName?: string; lastName?: string;
    studioName?: string; businessName?: string; speciality?: string;
    industry?: string; brandPrimaryColor?: string; brandAccentColor?: string;
    brandFontFamily?: string; brandLogoUrl?: string;
  } | null>(null)
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [hasMeetingTypes, setHasMeetingTypes] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Filters
  const [activeCategory, setActiveCategory] = useState<PortfolioCategory | 'ALL'>('ALL')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  
  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Brand tokens
  const brandPrimary = userInfo?.brandPrimaryColor || '#6C2EDB'
  const brandAccent = userInfo?.brandAccentColor || '#E8891A'
  const brandFont = userInfo?.brandFontFamily || 'Inter'
  const brandLogo = userInfo?.brandLogoUrl || null
  const industry = (userInfo?.industry || 'PHOTOGRAPHY') as IndustryType
  const lang = getIndustryLanguage(industry)

  const studioDisplayName = userInfo?.studioName || userInfo?.businessName
    || (userInfo?.firstName && userInfo?.lastName
        ? `${userInfo.firstName} ${userInfo.lastName}`
        : userInfo?.name)
    || 'Portfolio'
  const initials = (userInfo?.firstName?.[0] || userInfo?.name?.[0] || 'K').toUpperCase()
  const featuredCount = useMemo(() => items.filter(i => i.featured).length, [items])

  // Fetch portfolio
  const fetchPortfolio = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    const result = await portfolioApi.getPublic(userId)
    
    if (result.error) {
      setError(result.message || 'Portfolio not found')
    } else if (result.data) {
      setUserInfo(result.data.user)
      setItems(result.data.portfolio)
      setFilteredItems(result.data.portfolio)
    }
    
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchPortfolio()
    // Fetch testimonials
    if (userId) {
      const API_URL = import.meta.env.VITE_API_URL || ''
      fetch(`${API_URL}/api/testimonials/public/${userId}`)
        .then(r => r.ok ? r.json() : { testimonials: [] })
        .then(d => setTestimonials(d.testimonials || []))
        .catch(() => {})
    }
  }, [fetchPortfolio, userId])

  // Check if meeting types exist
  useEffect(() => {
    if (!userId) return
    const API_URL = import.meta.env.VITE_API_URL || ''
    fetch(`${API_URL}/api/book/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setHasMeetingTypes((d?.meetingTypes?.length || 0) > 0))
      .catch(() => {})
  }, [userId])

  // Apply filters
  useEffect(() => {
    let filtered = [...items]
    
    if (activeCategory !== 'ALL') {
      filtered = filtered.filter(item => item.category === activeCategory)
    }
    
    if (showFeaturedOnly) {
      filtered = filtered.filter(item => item.featured)
    }
    
    setFilteredItems(filtered)
  }, [items, activeCategory, showFeaturedOnly])

  // Get unique categories from items
  const categories = Array.from(new Set(items.map(item => item.category)))

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = 'auto'
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % filteredItems.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, filteredItems.length])

  // Hover state for cards
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SpinnerGap className="w-8 h-8 animate-spin" style={{ color: brandPrimary }} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '0.5px solid #EDE8F5' }}>
            <X className="w-8 h-8" style={{ color: '#9CA3AF' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Portfolio Not Found</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>{error}</p>
          <Link
            to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#6C2EDB', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const currentItem = filteredItems[lightboxIndex]

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7FE', fontFamily: `${brandFont}, Inter, sans-serif` }} data-testid="public-portfolio-page">
      {/* ─── Navigation Bar ─── */}
      <nav style={{ height: 60, background: '#FFFFFF', borderBottom: '0.5px solid #EDE8F5', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', padding: '0 40px' }} data-testid="portfolio-nav">
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {brandLogo ? (
              <img src={brandLogo} alt="" style={{ height: 32, objectFit: 'contain' }} data-testid="portfolio-brand-logo" />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: brandPrimary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }} data-testid="portfolio-brand-initials">
                {initials}
              </div>
            )}
          </div>

          {/* Center: Studio name */}
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} className="hidden md:block" data-testid="portfolio-nav-studio-name">
            {studioDisplayName}
          </span>

          {/* Right: Links (desktop) */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 24 }}>
            <a href="#portfolio-grid" style={{ fontSize: 13, fontWeight: 600, color: brandPrimary, borderBottom: `1.5px solid ${brandPrimary}`, paddingBottom: 2, textDecoration: 'none' }}>Work</a>
            <a href="#inquiry-section" style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', textDecoration: 'none' }}>Contact</a>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ padding: 12, background: 'none', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }} data-testid="portfolio-mobile-menu-btn">
            <ListIcon className="w-5 h-5" style={{ color: '#1A1A2E' }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden" style={{ background: '#FFFFFF', borderBottom: '0.5px solid #EDE8F5', padding: '12px 40px', display: 'flex', flexDirection: 'column', gap: 8, position: 'sticky', top: 60, zIndex: 49 }}>
          <a href="#portfolio-grid" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 14, fontWeight: 600, color: brandPrimary, textDecoration: 'none', padding: '8px 0' }}>Work</a>
          <a href="#inquiry-section" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', textDecoration: 'none', padding: '8px 0' }}>Contact</a>
        </div>
      )}

      {/* ─── Hero Section ─── */}
      <section style={{ background: '#FFFFFF', padding: '72px 40px 64px', textAlign: 'center', borderBottom: '0.5px solid #EDE8F5' }} data-testid="portfolio-hero">
        {brandLogo && (
          <img src={brandLogo} alt="" style={{ height: 56, objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />
        )}

        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, letterSpacing: '-0.025em', color: '#1A1A2E', margin: 0, lineHeight: 1.15 }} data-testid="portfolio-hero-title">
          {studioDisplayName}
        </h1>

        {userInfo?.speciality && (
          <p
            style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}
            data-testid="portfolio-speciality"
          >
            {userInfo.speciality}
          </p>
        )}

        {/* CTA row */}
        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#inquiry-section"
            style={{ height: 48, borderRadius: 10, background: brandPrimary, color: '#fff', fontSize: 14, fontWeight: 700, padding: '0 28px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', minWidth: 44 }}
            data-testid="portfolio-cta-inquiry"
          >
            Work with me
          </a>
          {hasMeetingTypes && (
            <Link
              to={`/book/${userId}`}
              style={{ height: 48, borderRadius: 10, border: `1.5px solid ${brandPrimary}`, color: brandPrimary, background: 'transparent', fontSize: 14, fontWeight: 700, padding: '0 28px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', minWidth: 44 }}
              data-testid="portfolio-cta-book"
            >
              Book a call
            </Link>
          )}
        </div>

        {/* Stats strip */}
        {items.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1A1A2E' }} data-testid="portfolio-stats">
            <span>{items.length} works</span>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span>{categories.length} categories</span>
            {featuredCount > 0 && (
              <>
                <span style={{ color: '#D1D5DB' }}>·</span>
                <span>{featuredCount} featured</span>
              </>
            )}
          </div>
        )}
      </section>

      {/* ─── Filter Bar ─── */}
      {items.length > 0 && (
        <div id="portfolio-grid" style={{ position: 'sticky', top: 60, background: 'rgba(249,247,254,0.95)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid #EDE8F5', padding: '12px 40px', zIndex: 10 }} data-testid="portfolio-filter-bar">
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="hide-scrollbar">
            {/* All pill */}
            <button
              onClick={() => setActiveCategory('ALL')}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: '0.5px solid', minWidth: 44, minHeight: 44,
                background: activeCategory === 'ALL' ? brandPrimary : '#FFFFFF',
                color: activeCategory === 'ALL' ? '#FFFFFF' : '#6B7280',
                borderColor: activeCategory === 'ALL' ? brandPrimary : '#EDE8F5',
              }}
              data-testid="portfolio-filter-all"
            >
              All
            </button>
            
            {/* Dynamic categories */}
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: '0.5px solid', minWidth: 44, minHeight: 44,
                  background: activeCategory === cat ? brandPrimary : '#FFFFFF',
                  color: activeCategory === cat ? '#FFFFFF' : '#6B7280',
                  borderColor: activeCategory === cat ? brandPrimary : '#EDE8F5',
                }}
                data-testid={`portfolio-filter-${cat}`}
              >
                {PORTFOLIO_CATEGORY_LABELS[cat]}
              </button>
            ))}
            
            {/* Divider */}
            <div style={{ width: 1, height: 24, background: '#EDE8F5', margin: '0 4px', flexShrink: 0 }} className="hidden sm:block" />
            
            {/* Featured pill */}
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: '0.5px solid', minWidth: 44, minHeight: 44,
                background: showFeaturedOnly ? 'rgba(251,191,36,0.15)' : '#FFFFFF',
                color: showFeaturedOnly ? '#92400E' : '#6B7280',
                borderColor: showFeaturedOnly ? 'rgba(251,191,36,0.4)' : '#EDE8F5',
              }}
              data-testid="portfolio-filter-featured"
            >
              <Star className="w-3.5 h-3.5" style={showFeaturedOnly ? { fill: '#92400E' } : {}} />
              Featured
            </button>
          </div>
        </div>
      )}

      {/* ─── Portfolio Grid ─── */}
      <main style={{ padding: '40px', maxWidth: 1280, margin: '0 auto' }} data-testid="portfolio-grid-section">
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 16px' }}>
            <div style={{ width: 64, height: 64, background: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '0.5px solid #EDE8F5' }}>
              <Star className="w-8 h-8" style={{ color: '#9CA3AF' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>
              {items.length === 0 ? 'Portfolio is Empty' : 'No Items Match Filters'}
            </h2>
            <p style={{ color: '#6B7280', fontSize: 14 }}>
              {items.length === 0 
                ? 'Check back later for creative work samples' 
                : 'Try adjusting your filter selection'}
            </p>
          </div>
        ) : (
          <div className="portfolio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredItems.map((item, index) => {
              const isHovered = hoveredCard === item.id
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFFFF', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                    border: `0.5px solid ${isHovered ? brandPrimary : '#EDE8F5'}`,
                    boxShadow: isHovered ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 200ms ease',
                  }}
                  onClick={() => openLightbox(index)}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  data-testid={`portfolio-card-${item.id}`}
                >
                  {/* Image */}
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 500ms', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                      loading="lazy"
                    />
                    
                    {/* Featured badge */}
                    {item.featured && (
                      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'rgba(251,191,36,0.9)', color: '#78350F', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        <Star className="w-3 h-3" style={{ fill: '#78350F' }} />
                        Featured
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)', opacity: isHovered ? 1 : 0, transition: 'opacity 200ms', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16 }}>
                      <h3 style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{item.title}</h3>
                      <p style={{ color: brandAccent, fontSize: 12, marginTop: 4 }}>{PORTFOLIO_CATEGORY_LABELS[item.category]}</p>
                    </div>
                  </div>
                  
                  {/* Card bottom */}
                  <div style={{ padding: '12px 14px' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                    <span style={{ fontSize: 11, color: brandPrimary }}>{PORTFOLIO_CATEGORY_LABELS[item.category]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ─── Testimonials Section ─── */}
      {testimonials.length > 0 && (
        <section style={{ padding: '80px 40px', background: '#FFFFFF', borderTop: '0.5px solid #EDE8F5' }} data-testid="portfolio-testimonials">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A2E', marginBottom: 12 }}>
                What {lang.clients.toLowerCase()} say
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                {[1,2,3,4,5].map(s => {
                  const avg = testimonials.reduce((a: number, t: any) => a + t.rating, 0) / testimonials.length
                  return <Star key={s} className="w-5 h-5" fill={s <= Math.round(avg) ? '#FBBF24' : 'none'} stroke={s <= Math.round(avg) ? '#FBBF24' : '#D1D5DB'} strokeWidth={1.5} />
                })}
              </div>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Based on {testimonials.length} review{testimonials.length !== 1 ? 's' : ''}</p>
            </div>

            <div style={{ display: 'grid', gap: 24 }} className="testimonial-grid">
              {testimonials.slice(0, 6).map((t: any) => (
                <TestimonialCard key={t.id} testimonial={t} brandPrimary={brandPrimary} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Inquiry CTA Section ─── */}
      <section id="inquiry-section" style={{ padding: '80px 40px', borderTop: `0.5px solid ${brandPrimary}22`, background: `${brandPrimary}08` }} data-testid="portfolio-inquiry-cta">
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#1A1A2E', marginBottom: 12 }}>
            Ready to work together?
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.65, marginBottom: 32 }}>
            Tell me about your project and I'll get back to you within 24 hours.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={`/inquiry?studio=${userId}`}
              style={{ height: 50, borderRadius: 10, background: brandPrimary, color: '#fff', fontSize: 15, fontWeight: 700, padding: '0 32px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', minWidth: 44 }}
              data-testid="portfolio-send-inquiry"
            >
              Send an inquiry
            </Link>
            {hasMeetingTypes && (
              <Link
                to={`/book/${userId}`}
                style={{ height: 50, borderRadius: 10, border: `1.5px solid ${brandPrimary}`, color: brandPrimary, background: 'transparent', fontSize: 15, fontWeight: 700, padding: '0 32px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', minWidth: 44 }}
                data-testid="portfolio-book-call"
              >
                {lang.discoveryCall === 'Scoping call' ? 'Book a scoping call' : lang.discoveryCall === 'Collector conversation' ? 'Book a collector conversation' : 'Book a discovery call'}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: '0.5px solid #EDE8F5', padding: '24px 40px' }} data-testid="portfolio-footer">
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{studioDisplayName}</span>
          <Link to="/" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }} data-testid="powered-by-badge">
            Powered by KOLOR Studio
          </Link>
        </div>
      </footer>

      {/* ─── Lightbox ─── */}
      {lightboxOpen && currentItem && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeLightbox}
          data-testid="portfolio-lightbox"
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            style={{ position: 'absolute', top: 16, right: 16, padding: 8, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10, minWidth: 44, minHeight: 44 }}
            data-testid="lightbox-close"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Previous */}
          {filteredItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              style={{ position: 'absolute', left: 16, padding: 12, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', color: '#fff', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44 }}
              data-testid="lightbox-prev"
            >
              <CaretLeft className="w-6 h-6" />
            </button>
          )}
          
          {/* Image */}
          <div 
            style={{ maxWidth: '80vw', maxHeight: '80vh', margin: '0 16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentItem.imageUrl}
              alt={currentItem.title}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
            />
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>{currentItem.title}</h2>
              {currentItem.description && (
                <p style={{ color: '#9CA3AF', marginTop: 8, maxWidth: 640, margin: '8px auto 0' }}>{currentItem.description}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                <span style={{ padding: '4px 12px', background: `${brandPrimary}20`, color: brandPrimary, borderRadius: 999, fontSize: 13 }}>
                  {PORTFOLIO_CATEGORY_LABELS[currentItem.category]}
                </span>
                {currentItem.featured && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: 'rgba(251,191,36,0.2)', color: '#FBBF24', borderRadius: 999, fontSize: 13 }}>
                    <Star className="w-3 h-3" style={{ fill: '#FBBF24' }} />
                    Featured
                  </span>
                )}
              </div>
              {currentItem.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                  {currentItem.tags.map((tag, i) => (
                    <span key={i} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: 4, fontSize: 12 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p style={{ color: '#6B7280', fontSize: 13, marginTop: 16 }}>
                {lightboxIndex + 1} / {filteredItems.length}
              </p>
            </div>
          </div>
          
          {/* Next */}
          {filteredItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              style={{ position: 'absolute', right: 16, padding: 12, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', color: '#fff', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44 }}
              data-testid="lightbox-next"
            >
              <CaretRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Responsive CSS */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .testimonial-grid { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 1024px) { .testimonial-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .testimonial-grid { grid-template-columns: 1fr; } }
        @media (max-width: 480px) {
          .portfolio-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
        }
        @media (max-width: 768px) {
          nav[data-testid="portfolio-nav"] { padding: 0 20px !important; }
          section[data-testid="portfolio-hero"] { padding: 40px 20px !important; }
          section[data-testid="portfolio-inquiry-cta"] { padding: 48px 20px !important; }
          main[data-testid="portfolio-grid-section"] { padding: 24px 16px !important; }
          section[data-testid="portfolio-testimonials"] { padding: 48px 20px !important; }
          footer[data-testid="portfolio-footer"] { padding: 20px 20px !important; }
          div[data-testid="portfolio-filter-bar"] > div { padding: 12px 20px !important; }
        }
      `}</style>
    </div>
  )
}

function TestimonialCard({ testimonial: t, brandPrimary }: { testimonial: any; brandPrimary: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ background: '#FDFCFF', border: `0.5px solid ${hovered ? brandPrimary : '#EDE8F5'}`, borderRadius: 12, padding: 20, transition: 'border-color 200ms' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        {[1,2,3,4,5].map(s => (
          <Star key={s} className="w-4 h-4" fill={s <= t.rating ? '#FBBF24' : 'none'} stroke={s <= t.rating ? '#FBBF24' : '#D1D5DB'} strokeWidth={1.5} />
        ))}
      </div>
      <p style={{ color: '#6B7280', marginBottom: 16, fontStyle: 'italic', lineHeight: 1.6, fontSize: 14 }}>"{t.content}"</p>
      <p style={{ fontSize: 12, color: '#6B7280' }}>— {t.clientName}</p>
    </div>
  )
}
