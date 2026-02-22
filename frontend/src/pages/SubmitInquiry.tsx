import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { ServiceType, SERVICE_TYPE_LABELS, leadsApi } from '../services/api'

const SERVICE_TYPES: ServiceType[] = [
  'PHOTOGRAPHY', 'VIDEOGRAPHY', 'GRAPHIC_DESIGN', 'WEB_DESIGN', 
  'BRANDING', 'CONTENT_CREATION', 'CONSULTING', 'OTHER'
];

const SubmitInquiry = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    serviceType: 'PHOTOGRAPHY' as ServiceType,
    projectTitle: '',
    description: '',
    budget: '',
    timeline: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.clientName || !formData.clientEmail || !formData.projectTitle || !formData.description) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    const result = await leadsApi.submit({
      ...formData,
      source: 'WEBSITE',
    })

    setLoading(false)

    if (result.error) {
      setError(result.message || 'Failed to submit inquiry')
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="bg-dark-card rounded-2xl shadow-xl p-8 border border-dark-border">
            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-700/50">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-white">Thank You!</h1>
            <p className="text-gray-400 mb-6">
              Your inquiry has been submitted successfully. We'll review your project details and get back to you within 24-48 hours.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Sparkles className="w-8 h-8 text-violet-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              KOLOR STUDIO
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-white">Start Your Project</h1>
          <p className="text-gray-400">Tell us about your creative project and we'll get back to you within 24-48 hours</p>
        </div>

        {/* Form */}
        <div className="bg-dark-card rounded-2xl shadow-xl p-8 border border-dark-border">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-white">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500"
                    placeholder="John Smith"
                    data-testid="inquiry-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500"
                    placeholder="john@example.com"
                    data-testid="inquiry-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    name="clientCompany"
                    value={formData.clientCompany}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500"
                    placeholder="Your Company"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-white">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Service Type *
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white"
                    data-testid="inquiry-service-type"
                  >
                    {SERVICE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {SERVICE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    name="projectTitle"
                    value={formData.projectTitle}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500"
                    placeholder="e.g., Wedding Photography - June 2026"
                    data-testid="inquiry-project-title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition resize-none text-white placeholder-gray-500"
                    placeholder="Tell us about your project... What are you looking for? Any specific requirements or vision?"
                    data-testid="inquiry-description"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Budget Range
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white"
                    >
                      <option value="">Select a range</option>
                      <option value="Under $1,000">Under $1,000</option>
                      <option value="$1,000 - $3,000">$1,000 - $3,000</option>
                      <option value="$3,000 - $5,000">$3,000 - $5,000</option>
                      <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                      <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                      <option value="$25,000+">$25,000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timeline
                    </label>
                    <input
                      type="text"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition text-white placeholder-gray-500"
                      placeholder="e.g., March 2026, ASAP, Flexible"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/30 hover:shadow-xl hover:shadow-violet-900/40 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="inquiry-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Inquiry'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            By submitting, you agree to our terms of service and privacy policy.
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-400 hover:text-violet-400 text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SubmitInquiry
