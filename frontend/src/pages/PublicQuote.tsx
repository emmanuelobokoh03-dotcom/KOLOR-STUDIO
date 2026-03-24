import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  Clock,
  SpinnerGap,
  WarningCircle,
  Envelope,
  Phone,
  CalendarBlank,
  DownloadSimple
} from '@phosphor-icons/react'
import { quotesApi, Quote, PAYMENT_TERMS_OPTIONS } from '../services/api'
import { formatCurrency, CurrencySettings, getMergedCurrencySettings } from '../utils/currency'
import { trackQuoteViewed, trackQuoteAccepted, trackQuoteDeclined } from '../utils/analytics'

export default function PublicQuote() {
  const { quoteToken } = useParams<{ quoteToken: string }>();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    if (quoteToken) {
      fetchQuote();
    }
  }, [quoteToken]);

  const fetchQuote = async () => {
    setLoading(true);
    const result = await quotesApi.getByToken(quoteToken!);
    
    if (result.error) {
      setError(result.message || 'Failed to load quote');
    } else if (result.data?.quote) {
      setQuote(result.data.quote);
      // Track quote viewed
      trackQuoteViewed();
    }
    
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!quoteToken) return;
    
    setAccepting(true);
    const result = await quotesApi.accept(quoteToken);
    setAccepting(false);
    
    if (result.error) {
      setError(result.message || 'Failed to accept quote');
      return;
    }
    
    // Track quote accepted with value
    if (quote) {
      trackQuoteAccepted(quote.total);
    }
    setActionSuccess('accepted');
    fetchQuote();
  };

  const handleDecline = async () => {
    if (!quoteToken) return;
    
    setDeclining(true);
    const result = await quotesApi.decline(quoteToken, declineReason || undefined);
    setDeclining(false);
    
    if (result.error) {
      setError(result.message || 'Failed to decline quote');
      return;
    }
    
    trackQuoteDeclined();
    setShowDeclineModal(false);
    setActionSuccess('declined');
    fetchQuote();
  };

  // Get currency settings from the quote
  const getCurrencySettings = (): CurrencySettings => {
    if (!quote) {
      return { currency: 'USD', currencySymbol: '$', currencyPosition: 'BEFORE', numberFormat: '1,000.00' };
    }
    
    // Use currencySettings from API response if available
    if (quote.currencySettings) {
      return {
        currency: quote.currencySettings.currency,
        currencySymbol: quote.currencySettings.currencySymbol,
        currencyPosition: quote.currencySettings.currencyPosition as 'BEFORE' | 'AFTER',
        numberFormat: quote.currencySettings.numberFormat as any,
      };
    }
    
    // Fallback: merge from quote and createdBy
    return getMergedCurrencySettings(
      {
        currency: quote.createdBy?.currency,
        currencySymbol: quote.createdBy?.currencySymbol,
        currencyPosition: quote.createdBy?.currencyPosition as any,
        numberFormat: quote.createdBy?.numberFormat as any,
      },
      {
        currency: quote.currency || undefined,
        currencySymbol: quote.currencySymbol || undefined,
        currencyPosition: quote.currencyPosition as any,
        numberFormat: quote.numberFormat as any,
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = quote && new Date(quote.validUntil) < new Date() && quote.status !== 'ACCEPTED';
  const canAct = quote && ['SENT', 'VIEWED'].includes(quote.status) && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SpinnerGap weight="duotone" className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-surface-base rounded-2xl shadow-xl p-8 max-w-md text-center">
          <WarningCircle weight="duotone" className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Not Found</h1>
          <p className="text-gray-600 mb-6">
            This quote may have been deleted or the link is invalid.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const currencySettings = getCurrencySettings();
  const paymentTermsLabel = PAYMENT_TERMS_OPTIONS.find(o => o.value === quote.paymentTerms)?.label || quote.paymentTerms;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 to-brand-primary/5 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Banner */}
        {actionSuccess && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            actionSuccess === 'accepted' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {actionSuccess === 'accepted' ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
            <div>
              <p className="font-semibold">
                {actionSuccess === 'accepted' ? 'Quote Accepted!' : 'Quote Declined'}
              </p>
              <p className="text-sm">
                {actionSuccess === 'accepted' 
                  ? 'Thank you! The studio has been notified and will be in touch soon.'
                  : 'The studio has been notified of your decision.'}
              </p>
            </div>
          </div>
        )}

        {/* Quote Document */}
        <div className="bg-surface-base rounded-2xl shadow-xl overflow-hidden" data-testid="public-quote">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-primary text-white p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {quote.createdBy?.studioName || 'Quote'}
                </h1>
                <p className="text-purple-600 font-mono text-sm">
                  Quote #{quote.quoteNumber}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => quotesApi.downloadPdfByToken(quoteToken!)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition"
                  data-testid="download-pdf-btn"
                >
                  <DownloadSimple weight="bold" className="w-4 h-4" />
                  Download PDF
                </button>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  quote.status === 'ACCEPTED' ? 'bg-green-500 text-white' :
                  quote.status === 'DECLINED' ? 'bg-red-500 text-white' :
                  quote.status === 'EXPIRED' || isExpired ? 'bg-gray-500 text-white' :
                  'bg-white/20 text-white'
                }`}>
                  {quote.status === 'ACCEPTED' ? 'Accepted' :
                   quote.status === 'DECLINED' ? 'Declined' :
                   isExpired ? 'Expired' :
                   quote.status === 'VIEWED' ? 'Pending Response' :
                   'Pending Review'}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Client & Project Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-100">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Prepared For</p>
                <p className="text-lg font-semibold text-gray-900">{quote.lead?.clientName}</p>
                <p className="text-gray-600">{quote.lead?.clientEmail}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Project</p>
                <p className="text-lg font-semibold text-gray-900">{quote.lead?.projectTitle}</p>
                {quote.lead?.serviceType && (
                  <p className="text-gray-600 capitalize">{quote.lead.serviceType.replace('_', ' ').toLowerCase()}</p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-tertiary">Description</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-tertiary w-20">Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-text-tertiary w-28">Price</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-text-tertiary w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.lineItems.map((item, index) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="py-3 px-4 text-gray-900">{item.description}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.price, currencySettings)}</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-medium">{formatCurrency(item.total, currencySettings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="space-y-3 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(quote.subtotal, currencySettings)}</span>
                </div>
                {quote.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({quote.tax}%)</span>
                    <span className="text-gray-900">{formatCurrency(quote.taxAmount, currencySettings)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-brand-primary" data-testid="quote-total">
                    {formatCurrency(quote.total, currencySettings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-brand-primary/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-brand-primary mb-2">
                  <CalendarBlank className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide font-medium">Payment Terms</span>
                </div>
                <p className="text-gray-900 font-medium">{paymentTermsLabel}</p>
              </div>
              <div className={`rounded-xl p-4 ${isExpired ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className={`flex items-center gap-2 mb-2 ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                  <Clock className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide font-medium">Valid Until</span>
                </div>
                <p className={`font-medium ${isExpired ? 'text-red-700' : 'text-gray-900'}`}>
                  {formatDate(quote.validUntil)}
                  {isExpired && ' (Expired)'}
                </p>
              </div>
            </div>

            {/* T&C */}
            {quote.terms && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.terms}</p>
                </div>
              </div>
            )}

            {/* Studio Contact */}
            {quote.createdBy && (
              <div className="border-t border-gray-100 pt-6">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-3">Questions? Contact us</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {quote.createdBy.email && (
                    <a 
                      href={`mailto:${quote.createdBy.email}`}
                      className="flex items-center gap-2 text-brand-primary hover:text-brand-primary-dark"
                    >
                      <Envelope className="w-4 h-4" />
                      {quote.createdBy.email}
                    </a>
                  )}
                  {quote.createdBy.phone && (
                    <a 
                      href={`tel:${quote.createdBy.phone}`}
                      className="flex items-center gap-2 text-brand-primary hover:text-brand-primary-dark"
                    >
                      <Phone className="w-4 h-4" />
                      {quote.createdBy.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {canAct && !actionSuccess && (
            <div className="bg-gray-50 p-6 border-t border-gray-100">
              <p className="text-center text-gray-600 mb-4">
                Please review the quote above and respond:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition font-semibold disabled:opacity-50"
                  data-testid="accept-quote-btn"
                >
                  {accepting ? (
                    <SpinnerGap className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Accept Quote
                </button>
                <button
                  onClick={() => setShowDeclineModal(true)}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-surface-base text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold"
                  data-testid="decline-quote-btn"
                >
                  <XCircle className="w-5 h-5" />
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Expired Notice */}
          {isExpired && quote.status !== 'ACCEPTED' && quote.status !== 'DECLINED' && (
            <div className="bg-red-50 p-6 border-t border-red-100 text-center">
              <WarningCircle weight="duotone" className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">This quote has expired</p>
              <p className="text-red-600 text-sm mt-1">
                Please contact the studio for an updated quote.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-text-tertiary text-sm">
          Powered by <span className="font-semibold text-brand-primary">KOLOR STUDIO</span>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-base rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Decline Quote</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to decline this quote? You can optionally provide a reason.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining (optional)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-brand-primary resize-none mb-4"
              data-testid="decline-reason-input"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={declining}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition disabled:opacity-50"
                data-testid="confirm-decline-btn"
              >
                {declining ? (
                  <SpinnerGap className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Decline Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
