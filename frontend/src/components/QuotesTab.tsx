import { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus, 
  Send, 
  Eye, 
  Trash2, 
  Copy, 
  Edit3,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Download
} from 'lucide-react'
import { 
  Lead,
  Quote, 
  QUOTE_STATUS_LABELS, 
  QUOTE_STATUS_COLORS,
  quotesApi,
  authApi
} from '../services/api'
import { formatCurrency, getMergedCurrencySettings, CurrencySettings } from '../utils/currency'
import QuoteBuilderModal from './QuoteBuilderModal'
import { 
  trackQuoteCreated, 
  trackQuoteSent, 
  trackQuoteDuplicated
} from '../utils/analytics'

interface QuotesTabProps {
  lead: Lead;
  onQuoteUpdate?: () => void;
}

export default function QuotesTab({ lead, onQuoteUpdate }: QuotesTabProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userCurrencySettings, setUserCurrencySettings] = useState<Partial<CurrencySettings>>({});

  useEffect(() => {
    fetchQuotes();
    fetchUserSettings();
  }, [lead.id]);

  const fetchQuotes = async () => {
    setLoading(true);
    const result = await quotesApi.getByLead(lead.id);
    if (result.data?.quotes) {
      setQuotes(result.data.quotes);
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

  const handleSendQuote = async (quoteId: string) => {
    setSendingId(quoteId);
    const result = await quotesApi.send(quoteId);
    setSendingId(null);

    if (result.error) {
      alert(result.message || 'Failed to send quote');
      return;
    }

    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      trackQuoteSent(quote.total);
    }
    fetchQuotes();
    onQuoteUpdate?.();
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
      case 'VIEWED': return <Eye className="w-4 h-4 text-purple-400" />;
      case 'SENT': return <Send className="w-4 h-4 text-blue-400" />;
      case 'EXPIRED': return <Clock className="w-4 h-4 text-orange-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          Quotes ({quotes.length})
        </h3>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition font-medium text-sm"
          data-testid="create-quote-btn"
        >
          <Plus className="w-4 h-4" />
          Create Quote
        </button>
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">No quotes yet</h4>
          <p className="text-gray-400 mb-6">
            Create your first quote to send to this client.
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition font-medium"
          >
            Create Your First Quote
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const currencySettings = getQuoteCurrencySettings(quote);
            return (
            <div
              key={quote.id}
              className="bg-dark-bg-secondary rounded-xl p-4 border border-dark-border hover:border-violet-500/30 transition"
              data-testid={`quote-card-${quote.id}`}
            >
              <div className="flex items-start justify-between">
                {/* Quote Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(quote.status)}
                    <span className="font-mono text-sm text-gray-400">{quote.quoteNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${QUOTE_STATUS_COLORS[quote.status]}`}>
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-white mb-2">
                    {formatCurrency(quote.total, currencySettings)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Created {formatDate(quote.createdAt)}</span>
                    <span>•</span>
                    <span>Valid until {formatDate(quote.validUntil)}</span>
                  </div>
                  
                  {quote.status === 'ACCEPTED' && quote.acceptedAt && (
                    <div className="mt-2 text-sm text-green-400">
                      Accepted on {formatDate(quote.acceptedAt)}
                    </div>
                  )}
                  {quote.status === 'DECLINED' && quote.declinedAt && (
                    <div className="mt-2 text-sm text-red-400">
                      Declined on {formatDate(quote.declinedAt)}
                      {quote.declineReason && (
                        <span className="block text-gray-400 mt-1">
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
                        className="p-2 text-gray-400 hover:text-violet-400 hover:bg-violet-900/30 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendQuote(quote.id)}
                        disabled={sendingId === quote.id}
                        className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm font-medium disabled:opacity-50"
                      >
                        {sendingId === quote.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
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
                          : 'border border-dark-border text-gray-300 hover:bg-dark-card-hover'
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

                  {/* More Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === quote.id ? null : quote.id)}
                      className="p-2 text-gray-400 hover:bg-dark-card-hover rounded-lg transition"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    
                    {menuOpenId === quote.id && (
                      <div className="absolute right-0 top-10 bg-dark-card rounded-lg shadow-xl border border-dark-border py-1 z-10 min-w-[150px]">
                        <a
                          href={`/quote/${quote.quoteToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 text-left text-sm hover:bg-dark-card-hover text-gray-300 flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> View Quote
                        </a>
                        <button
                          onClick={() => {
                            quotesApi.downloadPdf(quote.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-dark-card-hover text-gray-300 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </button>
                        <button
                          onClick={() => handleCopyLink(quote)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-dark-card-hover text-gray-300 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" /> Copy Link
                        </button>
                        <button
                          onClick={() => handleDuplicateQuote(quote.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-dark-card-hover text-gray-300 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" /> Duplicate
                        </button>
                        {quote.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDeleteQuote(quote.id)}
                            disabled={deletingId === quote.id}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-900/30 text-red-400 flex items-center gap-2"
                          >
                            {deletingId === quote.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
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

      {/* Quote Builder Modal */}
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
    </div>
  );
}
