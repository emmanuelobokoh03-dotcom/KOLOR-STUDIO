import { useState, useEffect } from 'react'
import { InlineHint } from './InlineHint'
import {
  FileText,
  Plus,
  PaperPlaneTilt,
  Eye,
  Trash,
  Copy,
  PencilSimple,
  SpinnerGap,
  CheckCircle,
  XCircle,
  Clock,
  ArrowSquareOut,
  DotsThree,
  DownloadSimple
} from '@phosphor-icons/react'
import { 
  Lead,
  Quote, 
  QUOTE_STATUS_LABELS, 
  QUOTE_STATUS_COLORS,
  quotesApi,
  authApi,
  paymentsApi
} from '../services/api'
import { formatCurrency, getMergedCurrencySettings, CurrencySettings } from '../utils/currency'
import QuoteBuilderModal from './QuoteBuilderModal'
import EmailComposer from './EmailComposer'
import PaymentTracker from './PaymentTracker'
import { 
  trackQuoteCreated, 
  trackQuoteSent, 
  trackQuoteDuplicated
} from '../utils/analytics'

interface QuoteTabProps {
  lead: Lead;
  onQuoteUpdate?: () => void;
  onQuoteSent?: () => void;
}

export default function QuotesTab({ lead, onQuoteUpdate, onQuoteSent }: QuoteTabProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userCurrencySettings, setUserCurrencySettings] = useState<Partial<CurrencySettings>>({});
  const [emailComposerQuote, setEmailComposerQuote] = useState<Quote | null>(null);
  const [userName, setUserName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [incomeMap, setIncomeMap] = useState<Record<string, string>>({}); // quoteId -> incomeId

  useEffect(() => {
    fetchQuotes();
    fetchUserSettings();
  }, [lead.id]);

  const fetchQuotes = async () => {
    setLoading(true);
    const result = await quotesApi.getByLead(lead.id);
    if (result.data?.quotes) {
      setQuotes(result.data.quotes);
      // Fetch income IDs for accepted quotes (for payment tracker)
      const accepted = result.data.quotes.filter(q => q.status === 'ACCEPTED');
      const map: Record<string, string> = {};
      await Promise.all(accepted.map(async (q) => {
        const payRes = await paymentsApi.getByQuote(q.id);
        if (payRes.data?.incomeId) map[q.id] = payRes.data.incomeId;
      }));
      setIncomeMap(map);
    }
    setLoading(false);
  };

  const fetchUserSettings = async () => {
    const result = await authApi.getMe();
    if (result.data?.user) {
      setUserCurrencySettings({
        currency: result.data.user.currency,
        currencySymbol: result.data.user.currencySymbol,
        currencyPosition: result.data.user.currencyPosition as 'BEFORE' | 'AFTER',
        numberFormat: result.data.user.numberFormat as any,
      });
      setUserName(`${result.data.user.firstName} ${result.data.user.lastName}`.trim());
      setStudioName(result.data.user.studioName || '');
    }
  };

  // Get currency settings for a quote (quote override or user default)
  const getQuoteCurrencySettings = (quote: Quote) => {
    return getMergedCurrencySettings(userCurrencySettings, {
      currency: quote.currency || undefined,
      currencySymbol: quote.currencySymbol || undefined,
      currencyPosition: quote.currencyPosition as any,
      numberFormat: quote.numberFormat as any,
    });
  };

  const handleSendQuoteClick = (quote: Quote) => {
    setEmailComposerQuote(quote);
  };

  const handleEmailSend = async (subject: string, message: string) => {
    if (!emailComposerQuote) return;
    setSendingId(emailComposerQuote.id);
    const result = await quotesApi.send(emailComposerQuote.id, { subject, message });
    setSendingId(null);

    if (result.error) {
      throw new Error(result.message || 'Failed to send quote');
    }

    // Check if email was actually delivered (field is inside result.data)
    if (result.data?.emailSent === false) {
      console.warn('[QuotesTab] Quote status updated but email delivery failed:', result.data?.emailError || result.message);
      fetchQuotes();
      onQuoteUpdate?.();
      setEmailComposerQuote(null);
      throw new Error('Quote saved but email delivery failed. Please verify your sending domain at resend.com/domains.');
    }

    trackQuoteSent(emailComposerQuote.total);
    setEmailComposerQuote(null);
    fetchQuotes();
    onQuoteUpdate?.();
    onQuoteSent?.();
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    setDeletingId(quoteId);
    const result = await quotesApi.delete(quoteId);
    setDeletingId(null);
    setMenuOpenId(null);

    if (result.error) {
      alert(result.message || 'Failed to delete quote');
      return;
    }

    fetchQuotes();
    onQuoteUpdate?.();
  };

  const handleDuplicateQuote = async (quoteId: string) => {
    const result = await quotesApi.duplicate(quoteId);
    setMenuOpenId(null);

    if (result.error) {
      alert(result.message || 'Failed to duplicate quote');
      return;
    }

    trackQuoteDuplicated();
    fetchQuotes();
    onQuoteUpdate?.();
  };

  const handleCopyLink = async (quote: Quote) => {
    const url = `${window.location.origin}/quote/${quote.quoteToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
    setMenuOpenId(null);
  };

  const handleQuoteSaved = (quote: Quote) => {
    setShowBuilder(false);
    setEditingQuote(null);
    trackQuoteCreated(quote.total, quote.currency || 'USD', quote.lineItems?.length || 0);
    fetchQuotes();
    onQuoteUpdate?.();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'DECLINED': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'VIEWED': return <Eye className="w-4 h-4 text-purple-600" />;
      case 'SENT': return <PaperPlaneTilt weight="bold" className="w-4 h-4 text-blue-600" />;
      case 'EXPIRED': return <Clock className="w-4 h-4 text-orange-400" />;
      default: return <FileText className="w-4 h-4 text-text-secondary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <SpinnerGap className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600" />
          Quotes ({quotes.length})
        </h3>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition font-medium text-sm"
          data-testid="create-quote-btn"
        >
          <Plus weight="bold" className="w-4 h-4" />
          Create Quotes
        </button>
      </div>

      {quotes.length === 0 && (
        <InlineHint storageKey="seen_first_quote_tip" variant="violet">
          <span className="text-xs"><strong>Sending your first quote?</strong> Add line items, set your rate, and send directly to your client's email. They can accept online!</span>
        </InlineHint>
      )}

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-20 px-6 text-center" data-testid="quotes-empty-state">
          <div className="text-5xl md:text-6xl mb-5 md:mb-6 opacity-40 select-none">&#x1F4B0;</div>
          <h3 className="text-xl md:text-2xl font-semibold text-text-primary mb-2 md:mb-3">No quotes yet</h3>
          <p className="text-sm md:text-base text-text-secondary max-w-md mb-5 md:mb-6 leading-relaxed">
            Send a professional quote to lock in this project and get paid what you're worth.
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary transition font-medium"
            data-testid="quotes-empty-cta"
          >
            <FileText className="w-5 h-5" />
            Create Quotes
          </button>
          <p className="text-xs text-text-tertiary mt-4 max-w-sm">
            <strong>Pro tip:</strong> Use quote templates to save time on similar projects.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const currencySettings = getQuoteCurrencySettings(quote);
            return (
            <div
              key={quote.id}
              className="bg-light-100 rounded-xl p-4 border border-light-200 hover:border-brand-primary/30 transition"
              data-testid={`quote-card-${quote.id}`}
            >
              <div className="flex items-start justify-between">
                {/* Quotes Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(quote.status)}
                    <span className="font-mono text-sm text-text-secondary">{quote.quoteNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${QUOTE_STATUS_COLORS[quote.status]}`}>
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-text-primary mb-2">
                    {formatCurrency(quote.total, currencySettings)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>Created {formatDate(quote.createdAt)}</span>
                    <span>•</span>
                    <span>Valid until {formatDate(quote.validUntil)}</span>
                  </div>
                  
                  {quote.status === 'ACCEPTED' && quote.acceptedAt && (
                    <div className="mt-2 text-sm text-green-400">
                      Accepted on {formatDate(quote.acceptedAt)}
                    </div>
                  )}
                  {quote.status === 'ACCEPTED' && incomeMap[quote.id] && (
                    <PaymentTracker
                      incomeId={incomeMap[quote.id]}
                      totalAmount={quote.total}
                      currencySymbol={getQuoteCurrencySettings(quote).currencySymbol}
                    />
                  )}
                  {quote.status === 'DECLINED' && quote.declinedAt && (
                    <div className="mt-2 text-sm text-red-400">
                      Declined on {formatDate(quote.declinedAt)}
                      {quote.declineReason && (
                        <span className="block text-text-secondary mt-1">
                          Reason: "{quote.declineReason}"
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {quote.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => { setEditingQuote(quote); setShowBuilder(true); }}
                        className="p-2 text-text-secondary hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Edit"
                      >
                        <PencilSimple className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendQuoteClick(quote)}
                        disabled={sendingId === quote.id}
                        className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition text-sm font-medium disabled:opacity-50"
                        data-testid={`send-quote-${quote.id}`}
                      >
                        {sendingId === quote.id ? (
                          <SpinnerGap className="w-4 h-4 animate-spin" />
                        ) : (
                          <PaperPlaneTilt weight="bold" className="w-4 h-4" />
                        )}
                        Send
                      </button>
                    </>
                  )}

                  {(quote.status === 'SENT' || quote.status === 'VIEWED') && (
                    <button
                      onClick={() => handleCopyLink(quote)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                        copiedId === quote.id
                          ? 'bg-green-600 text-white'
                          : 'border border-light-200 text-text-secondary hover:bg-light-100'
                      }`}
                    >
                      {copiedId === quote.id ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  )}

                  {/* More List */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === quote.id ? null : quote.id)}
                      className="p-2 text-text-secondary hover:bg-light-100 rounded-lg transition"
                    >
                      <DotsThree className="w-4 h-4" />
                    </button>
                    
                    {menuOpenId === quote.id && (
                      <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl border border-light-200 py-1 z-10 min-w-[150px]">
                        <a
                          href={`/quote/${quote.quoteToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 text-left text-sm hover:bg-light-100 text-text-secondary flex items-center gap-2"
                        >
                          <ArrowSquareOut className="w-4 h-4" /> View Quotes
                        </a>
                        <button
                          onClick={() => {
                            quotesApi.downloadPdf(quote.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-light-100 text-text-secondary flex items-center gap-2"
                        >
                          <DownloadSimple weight="bold" className="w-4 h-4" /> Download PDF
                        </button>
                        <button
                          onClick={() => handleCopyLink(quote)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-light-100 text-text-secondary flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" /> Copy Link
                        </button>
                        <button
                          onClick={() => handleDuplicateQuote(quote.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-light-100 text-text-secondary flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" /> Duplicate
                        </button>
                        {(quote.status === 'SENT' || quote.status === 'VIEWED') && (
                          <button
                            onClick={() => { setMenuOpenId(null); handleSendQuoteClick(quote); }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-light-100 text-text-secondary flex items-center gap-2"
                            data-testid={`resend-quote-${quote.id}`}
                          >
                            <PaperPlaneTilt weight="bold" className="w-4 h-4" /> Resend
                          </button>
                        )}
                        {quote.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDeleteQuote(quote.id)}
                            disabled={deletingId === quote.id}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-400 flex items-center gap-2"
                          >
                            {deletingId === quote.id ? (
                              <SpinnerGap className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash className="w-4 h-4" />
                            )}
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Quotes Builder Modal */}
      {showBuilder && (
        <QuoteBuilderModal
          lead={lead}
          existingQuote={editingQuote}
          userCurrencySettings={userCurrencySettings}
          onClose={() => { setShowBuilder(false); setEditingQuote(null); }}
          onSaved={handleQuoteSaved}
          onSent={handleQuoteSaved}
        />
      )}

      {/* Email Composer Modal */}
      {emailComposerQuote && (
        <EmailComposer
          type="quote"
          recipientName={lead.clientName}
          recipientEmail={lead.clientEmail}
          projectTitle={lead.projectTitle}
          userName={userName}
          studioName={studioName}
          onSend={handleEmailSend}
          onCancel={() => setEmailComposerQuote(null)}
        />
      )}
    </div>
  );
}
