import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Star as StarIcon, PaperPlaneTilt, Check, Heart, Sparkle } from '@phosphor-icons/react'

interface TestimonialRequest {
  id: string
  clientName: string
  submittedAt: string | null
  user: {
    studioName: string | null
    firstName: string | null
    lastName: string | null
    brandLogoUrl: string | null
    brandPrimaryColor: string | null
  }
}

export default function SubmitTestimonial() {
  const { token } = useParams<{ token: string }>()
  const [request, setRequest] = useState<TestimonialRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [recommend, setRecommend] = useState(true)
  const [clientName, setClientName] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || ''
        const res = await fetch(`${API_URL}/api/testimonials/submit/${token}`)
        if (!res.ok) { setError('This testimonial link is invalid or expired.'); setLoading(false); return }
        const data = await res.json()
        setRequest(data.testimonial)
        setClientName(data.testimonial.clientName || '')
        if (data.testimonial.submittedAt) setSubmitted(true)
      } catch { setError('Failed to load. Please try again.') }
      setLoading(false)
    }
    if (token) fetchRequest()
  }, [token])

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a rating'); return }
    if (!content.trim()) { setError('Please share your experience'); return }
    if (!consentGiven) { setError('Please agree to share your testimonial'); return }
    setError('')
    setSubmitting(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_URL}/api/testimonials/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, content: content.trim(), recommend, clientName, consentGiven })
      })
      if (res.ok) setSubmitted(true)
      else { const d = await res.json(); setError(d.error || 'Failed to submit') }
    } catch { setError('Network error. Please try again.') }
    setSubmitting(false)
  }

  const primary = request?.user?.brandPrimaryColor || '#A855F7'

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full" />
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `${primary}15` }}>
          <Heart weight="duotone" className="w-10 h-10" style={{ color: primary }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h1>
        <p className="text-gray-600 mb-2">Your testimonial has been submitted and is being reviewed.</p>
        <p className="text-sm text-text-secondary">
          {request?.user?.studioName || 'The studio'} appreciates your feedback!
        </p>
      </div>
    </div>
  )

  const studioName = request?.user?.studioName || `${request?.user?.firstName || ''} ${request?.user?.lastName || ''}`.trim() || 'Studio'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4" data-testid="submit-testimonial-page">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {request?.user?.brandLogoUrl ? (
            <img src={request.user.brandLogoUrl} alt="" className="h-12 w-12 rounded-xl mx-auto mb-4 object-contain" />
          ) : (
            <div className="h-12 w-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: primary }}>
              <Sparkle className="w-6 h-6 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Share Your Experience</h1>
          <p className="text-text-tertiary">
            How was your experience with <span className="font-semibold" style={{ color: primary }}>{studioName}</span>?
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
            <div className="flex items-center gap-1.5 justify-center" data-testid="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                >
                  <StarIcon
                    className="w-9 h-9"
                    fill={(hoverRating || rating) >= star ? '#FBBF24' : 'none'}
                    stroke={(hoverRating || rating) >= star ? '#FBBF24' : '#D1D5DB'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-text-tertiary mt-2">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Exceptional'][rating]}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Experience</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 text-sm placeholder:text-text-secondary resize-none"
              style={{ '--tw-ring-color': `${primary}40` } as any}
              data-testid="testimonial-content"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 text-sm"
              style={{ '--tw-ring-color': `${primary}40` } as any}
              data-testid="testimonial-name"
            />
          </div>

          {/* Recommend */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRecommend(!recommend)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${recommend ? 'border-transparent' : 'border-gray-300'}`}
              style={recommend ? { background: primary } : undefined}
              data-testid="recommend-checkbox"
            >
              {recommend && <Check className="w-3 h-3 text-white" />}
            </button>
            <span className="text-sm text-gray-700">I would recommend {studioName} to others</span>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setConsentGiven(!consentGiven)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${consentGiven ? 'border-transparent' : 'border-gray-300'}`}
              style={consentGiven ? { background: primary } : undefined}
              data-testid="consent-checkbox"
            >
              {consentGiven && <Check className="w-3 h-3 text-white" />}
            </button>
            <span className="text-xs text-text-tertiary leading-relaxed">
              I agree that my testimonial and name may be displayed publicly on the studio's website and marketing materials.
            </span>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-600 text-center" data-testid="submit-error">{error}</p>}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ background: primary }}
            data-testid="submit-testimonial-btn"
          >
            {submitting ? (
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <><PaperPlaneTilt weight="bold" className="w-4 h-4" /> Submit Testimonial</>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-text-secondary mt-6" data-testid="powered-by-badge">
          Powered by{' '}
          <a href="/" className="text-brand-primary hover:underline transition">Kolor Studio</a>
        </p>
      </div>
    </div>
  )
}
