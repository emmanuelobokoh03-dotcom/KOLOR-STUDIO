import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SpinnerGap, WarningCircle, CheckCircle, ArrowLeft, Sparkle } from '@phosphor-icons/react'
import { ServiceType, leadsApi } from '../services/api'
import { getIndustryLanguage, IndustryType } from '../utils/industryLanguage'

interface CreatorInfo {
  studioName?: string
  firstName?: string
  lastName?: string
  businessName?: string
  brandPrimaryColor?: string
  brandAccentColor?: string
  brandLogoUrl?: string
  industry?: string
}

// Service type options per industry
const PHOTO_SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'VIDEOGRAPHY', label: 'Videography' },
  { value: 'CONTENT_CREATION', label: 'Content Creation' },
  { value: 'OTHER', label: 'Other' },
]

const DESIGN_SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'BRANDING', label: 'Brand Identity' },
  { value: 'WEB_DESIGN', label: 'UI/UX Design' },
  { value: 'GRAPHIC_DESIGN', label: 'Graphic Design' },
  { value: 'WEB_DESIGN', label: 'Web Design' },
  { value: 'OTHER', label: 'Motion Design' },
  { value: 'ILLUSTRATION', label: 'Illustration' },
  { value: 'OTHER', label: 'Other' },
]

const FINE_ART_SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'FINE_ART', label: 'Original painting' },
  { value: 'FINE_ART', label: 'Limited edition print' },
  { value: 'FINE_ART', label: 'Custom sculpture' },
  { value: 'FINE_ART', label: 'Mixed media' },
  { value: 'OTHER', label: 'Other' },
]

// Generic fallback
const GENERIC_SERVICE_TYPES: ServiceType[] = [
  'PHOTOGRAPHY', 'VIDEOGRAPHY', 'GRAPHIC_DESIGN', 'WEB_DESIGN',
  'BRANDING', 'ILLUSTRATION', 'FINE_ART',
  'CONTENT_CREATION', 'CONSULTING', 'OTHER'
]

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  BRANDING: 'Branding',
  ILLUSTRATION: 'Illustration',
  FINE_ART: 'Fine Art',
  CONTENT_CREATION: 'Content Creation',
  CONSULTING: 'Consulting',
  OTHER: 'Other',
}

type ProjectType = 'SERVICE' | 'COMMISSION' | 'PROJECT' | 'PRODUCT_SALE'
const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  SERVICE: 'Service',
  COMMISSION: 'Commission',
  PROJECT: 'Project',
  PRODUCT_SALE: 'Product Sale',
}
const PROJECT_TYPES: ProjectType[] = ['SERVICE', 'COMMISSION', 'PROJECT', 'PRODUCT_SALE']

const BUDGET_OPTIONS = [
  'Under $1,000', '$1,000 - $3,000', '$3,000 - $5,000',
  '$5,000 - $10,000', '$10,000 - $25,000', '$25,000+',
]

const SubmitInquiry = () => {
  const [searchParams] = useSearchParams()
  const studioId = searchParams.get('studio') || undefined
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Creator info fetched from API
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null)
  const [hasMeetingTypes, setHasMeetingTypes] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    serviceType: 'PHOTOGRAPHY' as ServiceType,
    projectType: 'SERVICE' as ProjectType,
    projectTitle: '',
    description: '',
    budget: '',
    timeline: '',
    // Industry-specific extras (mapped into description/timeline on submit)
    location: '',
    source: '',
    medium: '',
    dimensions: '',
    serviceLabel: '', // For fine art, stores the label like "Original painting"
  })

  // Fetch creator info
  useEffect(() => {
    if (!studioId) return
    const API_URL = import.meta.env.VITE_API_URL || ''
    fetch(`${API_URL}/api/portfolio/public/${studioId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) setCreatorInfo(d.user)
      })
      .catch(() => {})
    fetch(`${API_URL}/api/book/${studioId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setHasMeetingTypes((d?.meetingTypes?.length || 0) > 0))
      .catch(() => {})
  }, [studioId])

  // Brand tokens
  const brandPrimary = creatorInfo?.brandPrimaryColor || '#6C2EDB'
  const brandLogo = creatorInfo?.brandLogoUrl || null
  const industry = (creatorInfo?.industry || (studioId ? 'PHOTOGRAPHY' : null)) as IndustryType | null
  const lang = industry ? getIndustryLanguage(industry) : null
  const studioDisplayName = creatorInfo?.studioName
    || creatorInfo?.businessName
    || (creatorInfo?.firstName && creatorInfo?.lastName
      ? `${creatorInfo.firstName} ${creatorInfo.lastName}` : null)

  const initials = (creatorInfo?.firstName?.[0] || 'K').toUpperCase()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const inputStyle = (field: string) => ({
    width: '100%', height: 46, borderRadius: 10, fontSize: 13, padding: '0 14px',
    background: '#FDFCFF', color: '#1A1A2E', outline: 'none',
    border: `0.5px solid ${focusedField === field ? brandPrimary : '#EDE8F5'}`,
    boxShadow: focusedField === field ? `0 0 0 3px ${brandPrimary}18` : 'none',
    transition: 'border-color 200ms, box-shadow 200ms',
  })

  const textareaStyle = (field: string) => ({
    width: '100%', borderRadius: 10, fontSize: 13, padding: '12px 14px',
    background: '#FDFCFF', color: '#1A1A2E', outline: 'none', resize: 'none' as const,
    border: `0.5px solid ${focusedField === field ? brandPrimary : '#EDE8F5'}`,
    boxShadow: focusedField === field ? `0 0 0 3px ${brandPrimary}18` : 'none',
    transition: 'border-color 200ms, box-shadow 200ms',
  })

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600 as const, color: '#6B7280', marginBottom: 6 }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.clientName || !formData.clientEmail || !formData.description) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Build description with industry extras
    let fullDescription = formData.description
    if (industry === 'PHOTOGRAPHY' && formData.location) {
      fullDescription += `\n\nLocation: ${formData.location}`
    }
    if (industry === 'PHOTOGRAPHY' && formData.source) {
      fullDescription += `\nReferred via: ${formData.source}`
    }
    if (industry === 'FINE_ART') {
      if (formData.medium) fullDescription += `\n\nMedium: ${formData.medium}`
      if (formData.dimensions) fullDescription += `\nSize: ${formData.dimensions}`
    }
    if (industry === 'DESIGN' && formData.clientCompany) {
      fullDescription += `\n\nCompany: ${formData.clientCompany}`
    }

    // Auto-generate project title if not provided
    const projectTitle = formData.projectTitle
      || (industry === 'PHOTOGRAPHY' ? `${SERVICE_TYPE_LABELS[formData.serviceType]} Inquiry` : '')
      || (industry === 'DESIGN' ? `${SERVICE_TYPE_LABELS[formData.serviceType]} Project` : '')
      || (industry === 'FINE_ART' ? `${formData.serviceLabel || 'Fine Art'} Commission` : '')
      || 'New Inquiry'

    const result = await leadsApi.submit({
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone || undefined,
      clientCompany: formData.clientCompany || undefined,
      serviceType: formData.serviceType,
      projectType: formData.projectType,
      projectTitle,
      description: fullDescription,
      budget: formData.budget || undefined,
      timeline: formData.timeline || undefined,
      source: 'WEBSITE',
      studioId,
    })

    setLoading(false)

    if (result.error) {
      setError(result.message || 'Failed to submit inquiry')
      return
    }

    setSuccess(true)
  }

  // ─── Success state ───
  if (success) {
    const successHeading = industry === 'PHOTOGRAPHY' ? 'Inquiry sent!'
      : industry === 'DESIGN' ? 'Brief received!'
      : industry === 'FINE_ART' ? 'Commission inquiry sent!'
      : 'Thank you!'

    const projectWord = industry === 'PHOTOGRAPHY' ? 'shoot'
      : industry === 'DESIGN' ? 'project'
      : industry === 'FINE_ART' ? 'commission'
      : 'project'

    const bookLabel = industry === 'DESIGN' ? 'Book a scoping call'
      : industry === 'FINE_ART' ? 'Book a collector conversation'
      : 'Book a discovery call'

    return (
      <div style={{ minHeight: '100vh', background: '#F9F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }} data-testid="inquiry-success">
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #BBF7D0' }}>
            <CheckCircle weight="duotone" className="w-8 h-8" style={{ color: '#16A34A' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', marginBottom: 12 }} data-testid="inquiry-success-heading">{successHeading}</h1>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.65, marginBottom: 24 }}>
            We've let {studioDisplayName || 'the studio'} know about your {projectWord}.
            <br />Expect a reply within 24 hours.
          </p>

          {hasMeetingTypes && studioId && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Can't wait?</p>
              <Link
                to={`/book/${studioId}`}
                style={{ color: brandPrimary, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
                data-testid="inquiry-success-book"
              >
                {bookLabel} →
              </Link>
            </div>
          )}

          {studioId ? (
            <Link
              to={`/portfolio/${studioId}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
              data-testid="inquiry-success-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {studioDisplayName ? `${studioDisplayName}'s portfolio` : 'portfolio'}
            </Link>
          ) : (
            <Link
              to="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ─── Heading & sub per industry ───
  const formHeading = studioId && studioDisplayName
    ? (industry === 'DESIGN' ? `Send a brief to ${studioDisplayName}` : industry === 'FINE_ART' ? `Send a commission inquiry to ${studioDisplayName}` : `Send an inquiry to ${studioDisplayName}`)
    : 'Start your project'

  const formSub = industry === 'PHOTOGRAPHY' ? 'Tell me about your shoot and I\'ll get back to you within 24 hours'
    : industry === 'DESIGN' ? 'Describe your project and I\'ll get back to you within 24 hours'
    : industry === 'FINE_ART' ? 'Tell me about your commission and I\'ll get back to you within 24 hours'
    : 'Tell us about your creative project and we\'ll get back to you within 24-48 hours'

  const messageLabel = industry === 'PHOTOGRAPHY' ? 'Tell me about your shoot *'
    : industry === 'DESIGN' ? 'Describe your project *'
    : industry === 'FINE_ART' ? 'Tell me about your commission *'
    : 'Project Description *'

  const messagePlaceholder = industry === 'PHOTOGRAPHY' ? 'Share your vision, vibe, and any details I should know about your shoot...'
    : industry === 'DESIGN' ? 'What are you building? Who is it for? What do you want it to feel like?'
    : industry === 'FINE_ART' ? 'Describe what you have in mind — subject, mood, where it will live, any references...'
    : 'Tell us about your project... What are you looking for? Any specific requirements or vision?'

  const bookLabel = industry === 'DESIGN' ? 'Book a scoping call'
    : industry === 'FINE_ART' ? 'Book a collector conversation'
    : 'Book a discovery call'

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7FE' }} data-testid="inquiry-page">
      <div className="inquiry-layout">
        {/* ─── Left Panel ─── */}
        <aside className="inquiry-left-panel" style={{ background: '#FFFFFF', borderRight: '0.5px solid #EDE8F5', padding: '48px 40px' }} data-testid="inquiry-left-panel">
          {/* Creator identity */}
          {studioId && studioDisplayName ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {brandLogo ? (
                  <img src={brandLogo} alt="" style={{ height: 40, objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: brandPrimary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>
                )}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 4 }} data-testid="inquiry-studio-name">{studioDisplayName}</h2>
              <p style={{ fontSize: 13, color: '#6B7280' }}>You're reaching out to {studioDisplayName}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Sparkle className="w-7 h-7" style={{ color: '#6C2EDB' }} />
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(135deg, #6C2EDB, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOLOR</span>
            </div>
          )}

          {/* What happens next */}
          <div className="inquiry-timeline" style={{ marginTop: 40 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', fontWeight: 700, marginBottom: 20 }}>
              WHAT HAPPENS NEXT
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: brandPrimary, flexShrink: 0 }} />
                  <div style={{ width: 1, flex: 1, background: '#EDE8F5', margin: '4px 0' }} />
                </div>
                <div style={{ paddingBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>You submit this form</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Takes about 2 minutes</p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px solid #D1D5DB`, background: '#fff', flexShrink: 0 }} />
                  <div style={{ width: 1, flex: 1, background: '#EDE8F5', margin: '4px 0' }} />
                </div>
                <div style={{ paddingBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>They review your inquiry</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Within 24 hours</p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px solid #D1D5DB`, background: '#fff', flexShrink: 0 }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>They'll be in touch</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>With a quote or a call invite</p>
                </div>
              </div>
            </div>

            {/* Book a call link */}
            {hasMeetingTypes && studioId && (
              <div style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid #EDE8F5' }}>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Prefer a call first?</p>
                <Link
                  to={`/book/${studioId}`}
                  style={{ fontSize: 13, fontWeight: 700, color: brandPrimary, textDecoration: 'none' }}
                  data-testid="inquiry-book-call"
                >
                  {bookLabel} →
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* ─── Right Panel: Form ─── */}
        <main className="inquiry-right-panel" style={{ padding: '48px 40px' }} data-testid="inquiry-form-panel">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A2E', marginBottom: 6 }} data-testid="inquiry-heading">{formHeading}</h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28, lineHeight: 1.55 }}>{formSub}</p>

          {error && (
            <div style={{ marginBottom: 20, padding: '12px 14px', background: '#FEF2F2', border: '0.5px solid #FECACA', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#DC2626' }}>
              <WarningCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Contact fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text" name="clientName" value={formData.clientName} onChange={handleChange}
                  onFocus={() => setFocusedField('clientName')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('clientName')} placeholder="Your name" required
                  data-testid="inquiry-name"
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange}
                  onFocus={() => setFocusedField('clientEmail')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('clientEmail')} placeholder="you@email.com" required
                  data-testid="inquiry-email"
                />
              </div>
              <div>
                <label style={labelStyle}>Phone (optional)</label>
                <input
                  type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleChange}
                  onFocus={() => setFocusedField('clientPhone')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('clientPhone')} placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* ─── INDUSTRY-SPECIFIC FIELDS ─── */}
            {industry === 'PHOTOGRAPHY' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Type of shoot</label>
                    <select name="serviceType" value={formData.serviceType} onChange={handleChange}
                      onFocus={() => setFocusedField('serviceType')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('serviceType')} data-testid="inquiry-service-type">
                      {PHOTO_SERVICE_TYPES.map(t => <option key={t.value + t.label} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Shoot date (optional)</label>
                    <input type="date" name="timeline" value={formData.timeline} onChange={handleChange}
                      onFocus={() => setFocusedField('timeline')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('timeline')} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Location (optional)</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange}
                      onFocus={() => setFocusedField('location')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('location')} placeholder="City, venue name, or TBD" />
                  </div>
                  <div>
                    <label style={labelStyle}>How did you find us</label>
                    <select name="source" value={formData.source} onChange={handleChange}
                      onFocus={() => setFocusedField('source')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('source')}>
                      <option value="">Select</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Referral">Referral</option>
                      <option value="Google">Google</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {industry === 'DESIGN' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Type of project</label>
                    <select name="serviceType" value={formData.serviceType} onChange={handleChange}
                      onFocus={() => setFocusedField('serviceType')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('serviceType')} data-testid="inquiry-service-type">
                      {DESIGN_SERVICE_TYPES.map((t, i) => <option key={`${t.value}-${i}`} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Desired deadline (optional)</label>
                    <input type="date" name="timeline" value={formData.timeline} onChange={handleChange}
                      onFocus={() => setFocusedField('timeline')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('timeline')} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Budget range</label>
                    <select name="budget" value={formData.budget} onChange={handleChange}
                      onFocus={() => setFocusedField('budget')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('budget')}>
                      <option value="">Select a range</option>
                      {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Company or brand name</label>
                    <input type="text" name="clientCompany" value={formData.clientCompany} onChange={handleChange}
                      onFocus={() => setFocusedField('clientCompany')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('clientCompany')} placeholder="Your company" />
                  </div>
                </div>
              </>
            )}

            {industry === 'FINE_ART' && (
              <>
                <div>
                  <label style={labelStyle}>Type of commission</label>
                  <select name="serviceType" value={formData.serviceType}
                    onChange={(e) => {
                      const idx = e.target.selectedIndex
                      const label = FINE_ART_SERVICE_TYPES[idx]?.label || ''
                      setFormData({ ...formData, serviceType: e.target.value as ServiceType, serviceLabel: label })
                    }}
                    onFocus={() => setFocusedField('serviceType')} onBlur={() => setFocusedField(null)}
                    style={inputStyle('serviceType')} data-testid="inquiry-service-type">
                    {FINE_ART_SERVICE_TYPES.map((t, i) => <option key={`${t.value}-${i}`} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Medium preference (optional)</label>
                    <input type="text" name="medium" value={formData.medium} onChange={handleChange}
                      onFocus={() => setFocusedField('medium')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('medium')} placeholder="Oil, watercolour, charcoal, TBD..." />
                  </div>
                  <div>
                    <label style={labelStyle}>Approximate size (optional)</label>
                    <input type="text" name="dimensions" value={formData.dimensions} onChange={handleChange}
                      onFocus={() => setFocusedField('dimensions')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('dimensions')} placeholder="60×80cm, A3, life-size, TBD..." />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Delivery timeline (optional)</label>
                    <input type="text" name="timeline" value={formData.timeline} onChange={handleChange}
                      onFocus={() => setFocusedField('timeline')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('timeline')} placeholder="3 months, end of 2025, flexible..." />
                  </div>
                  <div>
                    <label style={labelStyle}>Budget range</label>
                    <select name="budget" value={formData.budget} onChange={handleChange}
                      onFocus={() => setFocusedField('budget')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('budget')}>
                      <option value="">Select a range</option>
                      {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Generic fallback — no studioId or unknown industry */}
            {(!studioId || !industry) && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Project Category *</label>
                    <select name="serviceType" value={formData.serviceType} onChange={handleChange}
                      onFocus={() => setFocusedField('serviceType')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('serviceType')} data-testid="inquiry-service-type">
                      {GENERIC_SERVICE_TYPES.map(t => <option key={t} value={t}>{SERVICE_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Project Type *</label>
                    <select name="projectType" value={formData.projectType} onChange={handleChange}
                      onFocus={() => setFocusedField('projectType')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('projectType')} data-testid="inquiry-project-type">
                      {PROJECT_TYPES.map(t => <option key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Project Title *</label>
                  <input type="text" name="projectTitle" value={formData.projectTitle} onChange={handleChange}
                    onFocus={() => setFocusedField('projectTitle')} onBlur={() => setFocusedField(null)}
                    style={inputStyle('projectTitle')} placeholder="e.g., Brand Photography - June 2026"
                    data-testid="inquiry-project-title" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Budget Range</label>
                    <select name="budget" value={formData.budget} onChange={handleChange}
                      onFocus={() => setFocusedField('budget')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('budget')}>
                      <option value="">Select a range</option>
                      {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Timeline</label>
                    <input type="text" name="timeline" value={formData.timeline} onChange={handleChange}
                      onFocus={() => setFocusedField('timeline')} onBlur={() => setFocusedField(null)}
                      style={inputStyle('timeline')} placeholder="e.g., March 2026, ASAP, Flexible" />
                  </div>
                </div>
              </>
            )}

            {/* Message textarea (always shown) */}
            <div>
              <label style={labelStyle}>{messageLabel}</label>
              <textarea
                name="description" value={formData.description} onChange={handleChange} rows={5}
                onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField(null)}
                style={textareaStyle('description')} placeholder={messagePlaceholder} required
                data-testid="inquiry-description"
              />
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', height: 50, borderRadius: 10, background: brandPrimary, color: '#fff',
                fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 200ms', minWidth: 44,
              }}
              data-testid="inquiry-submit"
            >
              {loading ? (
                <>
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Inquiry'
              )}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
            By submitting, you agree to our terms of service and privacy policy.
          </p>

          {/* Back link */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            {studioId ? (
              <Link
                to={`/portfolio/${studioId}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 13, textDecoration: 'none' }}
                data-testid="inquiry-back-to-portfolio"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {studioDisplayName ? `${studioDisplayName}'s portfolio` : 'portfolio'}
              </Link>
            ) : (
              <Link
                to="/"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 13, textDecoration: 'none' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            )}
          </div>
        </main>
      </div>

      {/* Responsive layout CSS */}
      <style>{`
        .inquiry-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          min-height: 100vh;
        }
        @media (max-width: 768px) {
          .inquiry-layout {
            grid-template-columns: 1fr;
          }
          .inquiry-left-panel {
            padding: 28px 20px !important;
            border-right: none !important;
            border-bottom: 0.5px solid #EDE8F5;
          }
          .inquiry-timeline {
            display: none !important;
          }
          .inquiry-right-panel {
            padding: 28px 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default SubmitInquiry
