import { useState, useEffect } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'
import {
  X,
  Plus,
  Trash,
  SpinnerGap,
  WarningCircle,
  FloppyDisk,
  PaperPlaneTilt,
  Eye,
  CurrencyDollar,
  Globe,
  CaretDown,
  FileText,
  Check,
  DownloadSimple,
  CheckCircle,
  Minus,
} from '@phosphor-icons/react'
import { 
  Lead, 
  Quote,
  QuoteLineItem,
  CreateQuoteData,
  PAYMENT_TERMS_OPTIONS,
  quotesApi,
  quoteTemplatesApi,
  QuoteTemplate,
  QuoteTemplateLineItem
} from '../services/api'
import { 
  formatCurrency, 
  AVAILABLE_CURRENCIES, 
  CurrencySettings,
  getMergedCurrencySettings 
} from '../utils/currency'
import { trackTemplateCreated, trackTemplateApplied } from '../utils/analytics'
import { getIndustryLanguage, IndustryType } from '../utils/industryLanguage'

interface UserCurrencySettings extends Partial<CurrencySettings> {
  defaultTaxRate?: number;
}

interface QuoteBuilderModalProps {
  lead: Lead;
  existingQuote?: Quote | null;
  userCurrencySettings?: UserCurrencySettings;
  userIndustry?: IndustryType;
  userName?: string;
  onClose: () => void;
  onSaved: (quote: Quote) => void;
  onSent?: (quote: Quote) => void;
}

const DEFAULT_TERMS = `1. This quote is valid for 30 days from the date of issue.
2. A deposit of 50% is required to secure your booking.
3. The remaining balance is due upon project completion.
4. Cancellations made within 7 days of the project date are subject to a 50% cancellation fee.
5. All prices are quoted in the specified currency.`;

// ── Pipeline Step ──
function PipelineStep({ step, label, state }: { step: number; label: string; state: 'done' | 'active' | 'todo' }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={
          state === 'done' ? { background: 'rgba(16,185,129,0.15)', color: '#059669' }
            : state === 'active' ? { background: 'rgba(108,46,219,0.15)', border: '0.5px solid rgba(108,46,219,0.3)', color: '#6C2EDB' }
            : { background: 'var(--surface-background)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }
        }
      >
        {state === 'done' ? <Check className="w-3 h-3" weight="bold" /> : state === 'active' ? <span className="w-1.5 h-1.5 rounded-full bg-[#6C2EDB]" /> : step}
      </div>
      <span className={`text-[10px] font-medium whitespace-nowrap ${state === 'active' ? 'text-[#6C2EDB] font-semibold' : state === 'done' ? 'text-emerald-600' : 'text-[var(--text-secondary)]'}`}>{label}</span>
    </div>
  )
}

function PipelineBar({ status }: { status?: string }) {
  const activeStep = !status || status === 'DRAFT' ? 2 : 4
  const steps = [
    { step: 1, label: 'Client', state: 'done' as const },
    { step: 2, label: 'Line items', state: activeStep === 2 ? 'active' as const : activeStep > 2 ? 'done' as const : 'todo' as const },
    { step: 3, label: 'Review', state: activeStep >= 3 ? 'done' as const : 'todo' as const },
    { step: 4, label: 'Send', state: activeStep === 4 ? 'active' as const : activeStep > 4 ? 'done' as const : 'todo' as const },
  ]
  return (
    <div className="flex items-center gap-0 px-5 py-2.5 flex-shrink-0 bg-[var(--surface-base)]" style={{ borderBottom: '0.5px solid var(--border)' }} data-testid="pipeline-bar">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : undefined }}>
          <PipelineStep {...s} />
          {i < steps.length - 1 && (
            <div className="flex-1 h-px mx-1.5" style={{ background: s.state === 'done' ? 'rgba(16,185,129,0.3)' : 'var(--border)', minWidth: '12px' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Client Preview Thumbnail ──
function ClientPreview({ leadName, userName, validUntil, total, currencySettings }: {
  leadName: string; userName?: string; validUntil: string; total: number; currencySettings: CurrencySettings
}) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface-background)' }}>
      <div className="h-1" style={{ background: 'linear-gradient(90deg, #6C2EDB, #a78bfa)' }} />
      <div className="px-3 py-2.5">
        <p className="text-[10px] font-bold text-text-primary truncate">{leadName}</p>
        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Quote from {userName || 'you'} · Valid {new Date(validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        <div className="space-y-1 mt-2.5">
          {[100, 80, 60, 85].map((w, i) => (
            <div key={i} className="h-1 rounded-sm bg-[var(--border)]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2.5 pt-2" style={{ borderTop: '0.5px solid var(--border)' }}>
          <span className="text-[10px] text-[var(--text-secondary)]">Total</span>
          <span className="text-xs font-extrabold text-text-primary tabular-nums">{formatCurrency(total, currencySettings)}</span>
        </div>
      </div>
    </div>
  )
}

// ── QuotePreview (preserved from original) ──
function QuotePreview({ lead, lineItems, subtotal, tax, taxAmount, total, paymentTerms, validUntil, terms, currencySettings, onBack, onSend, sending }: {
  lead: Lead; lineItems: QuoteLineItem[]; subtotal: number; tax: number; taxAmount: number; total: number; paymentTerms: string; validUntil: string; terms: string; currencySettings: CurrencySettings; onBack: () => void; onSend: () => void; sending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onBack}>
      <div className="bg-surface-base rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="quote-preview">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{lead.projectTitle}</h2>
              <p className="text-gray-600 mt-1">For {lead.clientName}</p>
            </div>
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <table className="w-full mb-6">
            <thead><tr className="border-b"><th className="text-left py-2 text-sm text-gray-500">Description</th><th className="text-right py-2 text-sm text-gray-500">Qty</th><th className="text-right py-2 text-sm text-gray-500">Price</th><th className="text-right py-2 text-sm text-gray-500">Total</th></tr></thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b"><td className="py-3 text-gray-900">{item.description}</td><td className="text-right py-3 text-gray-600">{item.quantity}</td><td className="text-right py-3 text-gray-600">{formatCurrency(item.price, currencySettings)}</td><td className="text-right py-3 font-medium text-gray-900">{formatCurrency(item.quantity * item.price, currencySettings)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">{formatCurrency(subtotal, currencySettings)}</span></div>
            {tax > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax ({tax}%)</span><span className="text-gray-900">{formatCurrency(taxAmount, currencySettings)}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span>{formatCurrency(total, currencySettings)}</span></div>
          </div>
          {terms && <div className="mt-6 p-4 bg-gray-50 rounded-lg"><h4 className="text-sm font-medium text-gray-700 mb-2">Terms</h4><p className="text-xs text-gray-500 whitespace-pre-line">{terms}</p></div>}
          <div className="flex gap-3 mt-8">
            <button onClick={onBack} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition" data-testid="quote-preview-back-btn">Back to Edit</button>
            <button onClick={onSend} disabled={sending} className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2" data-testid="quote-preview-send-btn">
              {sending ? <SpinnerGap className="w-5 h-5 animate-spin" /> : <PaperPlaneTilt className="w-5 h-5" />} {sending ? 'Sending...' : 'Send Quote'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──

export default function QuoteBuilderModal({ 
  lead, 
  existingQuote, 
  userCurrencySettings = {},
  userIndustry,
  userName,
  onClose, 
  onSaved,
  onSent 
}: QuoteBuilderModalProps) {
  const lang = getIndustryLanguage(userIndustry)
  const modalRef = useModalA11y(true, onClose)
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCurrencyOptions, setShowCurrencyOptions] = useState(false);
  
  // Template states
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [loadedTemplateName, setLoadedTemplateName] = useState('');

  // Form state
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(
    existingQuote?.lineItems || [{ description: '', quantity: 1, price: 0, total: 0 }]
  );
  const [tax, setTax] = useState(existingQuote?.tax || userCurrencySettings?.defaultTaxRate || 0);
  const [paymentTerms, setPaymentTerms] = useState(existingQuote?.paymentTerms || 'DEPOSIT_50');
  const [validUntil, setValidUntil] = useState(() => {
    if (existingQuote?.validUntil) {
      return new Date(existingQuote.validUntil).toISOString().split('T')[0];
    }
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [terms, setTerms] = useState(existingQuote?.terms || DEFAULT_TERMS);

  // Currency override state
  const [useCurrencyOverride, setUseCurrencyOverride] = useState(!!existingQuote?.currency);
  const [currencyOverride, setCurrencyOverride] = useState<Partial<CurrencySettings>>({
    currency: existingQuote?.currency || undefined,
    currencySymbol: existingQuote?.currencySymbol || undefined,
    currencyPosition: (existingQuote?.currencyPosition as 'BEFORE' | 'AFTER') || 'BEFORE',
    numberFormat: existingQuote?.numberFormat as any || undefined,
  });

  const effectiveCurrency = getMergedCurrencySettings(
    userCurrencySettings,
    useCurrencyOverride ? currencyOverride : {}
  );

  useEffect(() => { fetchTemplates() }, []);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    const result = await quoteTemplatesApi.getAll();
    if (result.data?.templates) setTemplates(result.data.templates);
    setLoadingTemplates(false);
  };

  const loadTemplate = (template: QuoteTemplate) => {
    const templateLineItems: QuoteLineItem[] = template.lineItems.map((item: QuoteTemplateLineItem) => ({
      description: item.description, quantity: item.quantity, price: item.price, total: item.quantity * item.price,
    }));
    setLineItems(templateLineItems);
    setPaymentTerms(template.paymentTerms);
    if (template.terms) setTerms(template.terms);
    setLoadedTemplateName(template.name);
    setShowTemplateDropdown(false);
    trackTemplateApplied();
    setTemplateSuccess(`Loaded template: ${template.name}`);
    setTimeout(() => setTemplateSuccess(''), 3000);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) { setError('Template name is required'); return; }
    if (lineItems.some(item => !item.description.trim())) { setError('All line items must have a description'); return; }
    setSavingTemplate(true); setError('');
    const templateData = {
      name: templateName.trim(), description: templateDescription.trim() || undefined,
      lineItems: lineItems.map(item => ({ description: item.description, quantity: item.quantity, price: item.price })),
      paymentTerms, terms: terms || undefined,
    };
    const result = await quoteTemplatesApi.create(templateData);
    setSavingTemplate(false);
    if (result.error) { setError(result.message || 'Failed to save template'); return; }
    await fetchTemplates();
    setShowSaveTemplateModal(false); setTemplateName(''); setTemplateDescription('');
    trackTemplateCreated();
    setTemplateSuccess('Template saved!');
    setTimeout(() => setTemplateSuccess(''), 4000);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;

  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'quantity' || field === 'price') {
      updated[index] = {
        ...updated[index], [field]: Number(value) || 0,
        total: field === 'quantity' ? (Number(value) || 0) * updated[index].price : updated[index].quantity * (Number(value) || 0)
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLineItems(updated);
  };

  const addLineItem = () => { setLineItems([...lineItems, { description: '', quantity: 1, price: 0, total: 0 }]) };
  const removeLineItem = (index: number) => { if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== index)) };

  const validate = (): boolean => {
    if (lineItems.some(item => !item.description.trim())) { setError('All line items must have a description'); return false; }
    if (lineItems.some(item => item.price <= 0)) { setError('All line items must have a price greater than 0'); return false; }
    if (new Date(validUntil) <= new Date()) { setError('Valid until date must be in the future'); return false; }
    if (useCurrencyOverride && !currencyOverride.currency) { setError('Please select a currency or disable the currency override'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true); setError('');
    const data: CreateQuoteData = {
      lineItems: lineItems.map(item => ({ description: item.description, quantity: item.quantity, price: item.price })),
      tax, paymentTerms, validUntil, terms,
      ...(useCurrencyOverride && currencyOverride.currency && {
        currency: currencyOverride.currency, currencySymbol: currencyOverride.currencySymbol,
        currencyPosition: currencyOverride.currencyPosition || 'BEFORE', numberFormat: currencyOverride.numberFormat,
      })
    };
    const result = existingQuote ? await quotesApi.update(existingQuote.id, data) : await quotesApi.create(lead.id, data);
    setLoading(false);
    if (result.error) { setError(result.message || 'Failed to save quote'); return; }
    if (result.data?.quote) onSaved(result.data.quote);
  };

  const handleSend = async () => {
    if (!validate()) return;
    setSending(true); setError('');
    const data: CreateQuoteData = {
      lineItems: lineItems.map(item => ({ description: item.description, quantity: item.quantity, price: item.price })),
      tax, paymentTerms, validUntil, terms,
      ...(useCurrencyOverride && currencyOverride.currency && {
        currency: currencyOverride.currency, currencySymbol: currencyOverride.currencySymbol,
        currencyPosition: currencyOverride.currencyPosition || 'BEFORE', numberFormat: currencyOverride.numberFormat,
      })
    };
    let quoteId = existingQuote?.id;
    if (!existingQuote) {
      const createResult = await quotesApi.create(lead.id, data);
      if (createResult.error || !createResult.data?.quote) { setError(createResult.message || 'Failed to create quote'); setSending(false); return; }
      quoteId = createResult.data.quote.id;
    } else {
      const updateResult = await quotesApi.update(existingQuote.id, data);
      if (updateResult.error) { setError(updateResult.message || 'Failed to update quote'); setSending(false); return; }
    }
    const sendResult = await quotesApi.send(quoteId!);
    setSending(false);
    if (sendResult.error) { setError(sendResult.message || 'Failed to send quote'); return; }
    setShowPreview(false);
    if (sendResult.data?.quote && onSent) onSent(sendResult.data.quote);
    else if (sendResult.data?.quote) onSaved(sendResult.data.quote);
  };

  // Derive status label
  const statusLabel = existingQuote?.status === 'SENT' ? 'Sent' : existingQuote?.status === 'VIEWED' ? 'Viewed' : existingQuote?.status === 'ACCEPTED' ? 'Approved' : existingQuote?.status === 'DECLINED' ? 'Declined' : 'Draft'
  const clientFirstName = lead.clientName.split(' ')[0]

  if (showPreview) {
    return (
      <QuotePreview lead={lead} lineItems={lineItems} subtotal={subtotal} tax={tax} taxAmount={taxAmount} total={total} paymentTerms={paymentTerms} validUntil={validUntil} terms={terms} currencySettings={effectiveCurrency} onBack={() => setShowPreview(false)} onSend={handleSend} sending={sending} />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-0 md:p-4" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className="bg-[var(--surface-base)] w-screen h-screen md:w-auto md:h-auto md:rounded-2xl overflow-hidden flex flex-col animate-modal-enter motion-reduce:animate-none"
        style={{ maxWidth: 'min(860px, 95vw)', maxHeight: 'min(800px, 95vh)', width: '100%', height: '100%', border: '0.5px solid var(--border-dark, var(--border))', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
        data-testid="quote-builder-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-builder-title"
      >
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <div className="min-w-0">
            <h2 id="quote-builder-title" className="text-sm font-extrabold text-text-primary truncate">
              {existingQuote ? `${lang.quote} #${existingQuote.quoteNumber || existingQuote.id.slice(-4).toUpperCase()}` : `New ${lang.quote} — ${lead.clientName}`}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {existingQuote?.quoteNumber || 'New'} · {statusLabel} · {existingQuote ? new Date(existingQuote.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleSave} disabled={loading} className="h-8 px-3 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-background)] transition-colors flex items-center gap-1.5 disabled:opacity-50" data-testid="save-draft-btn">
              {loading ? <SpinnerGap className="w-3 h-3 animate-spin" /> : <FloppyDisk className="w-3 h-3" />} Save draft
            </button>
            <button onClick={handleSend} disabled={sending} className="h-8 px-3.5 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50" style={{ background: '#6C2EDB' }} data-testid="send-quote-btn">
              {sending ? <SpinnerGap className="w-3 h-3 animate-spin" /> : <PaperPlaneTilt className="w-3 h-3" />} Send {lang.quote} →
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-background)] transition-colors text-[var(--text-secondary)]" aria-label="Close" title="Close (Esc)">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═══ Status Pipeline Bar ═══ */}
        <PipelineBar status={existingQuote?.status} />

        {/* ═══ Two-column body ═══ */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left column — builder area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-w-0">

            {/* Alerts */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs" role="alert" data-testid="builder-error">
                <WarningCircle className="w-4 h-4 flex-shrink-0" /> {error}
                <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
              </div>
            )}
            {templateSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-xs">
                <Check className="w-4 h-4 flex-shrink-0" /> {templateSuccess}
              </div>
            )}

            {/* Client card */}
            <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface-base)' }} data-testid="client-card">
              <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <span className="text-xs font-bold text-text-primary">{lang.client}</span>
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: 'rgba(108,46,219,0.15)', color: '#6C2EDB' }}>
                  {lead.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{lead.clientName}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{lead.clientEmail}{lead.clientPhone ? ` · ${lead.clientPhone}` : ''}</p>
                </div>
                {lead.projectType && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#6C2EDB] flex-shrink-0">
                    {lead.projectType.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3" style={{ borderTop: '0.5px solid var(--border)' }}>
                <div className="px-3.5 py-2.5" style={{ borderRight: '0.5px solid var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Project</p>
                  <p className="text-xs font-semibold text-text-primary truncate mt-0.5">{lead.projectTitle}</p>
                </div>
                {/* Hide the keyDate cell for fine-art commissions when no date is set — fine art rarely has a fixed date */}
                {!(userIndustry === 'FINE_ART' && !lead.keyDate && !lead.eventDate) ? (
                  <div className="px-3.5 py-2.5" style={{ borderRight: '0.5px solid var(--border)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">{lang.keyDate}</p>
                    <p className="text-xs font-semibold text-text-primary mt-0.5">{lead.keyDate || lead.eventDate ? new Date(lead.keyDate || lead.eventDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                  </div>
                ) : (
                  <div className="px-3.5 py-2.5" style={{ borderRight: '0.5px solid var(--border)' }} aria-hidden="true" />
                )}
                <div className="px-3.5 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Valid until</p>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="text-xs font-semibold text-text-primary mt-0.5 bg-transparent w-full cursor-pointer"
                    data-testid="valid-until-input"
                  />
                </div>
              </div>
            </div>

            {/* Line items card */}
            <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface-base)' }} data-testid="line-items-card">
              <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <span className="text-xs font-bold text-text-primary">{lang.quote} items</span>
                <div className="relative">
                  <button onClick={() => setShowTemplateDropdown(!showTemplateDropdown)} className="text-xs font-semibold text-[#6C2EDB] hover:underline" data-testid="load-package-btn">
                    Load package →
                  </button>
                  {showTemplateDropdown && (
                    <div className="absolute right-0 top-6 w-56 bg-[var(--surface-base)] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto" style={{ border: '0.5px solid var(--border)' }}>
                      {loadingTemplates ? (
                        <div className="p-3 text-center"><SpinnerGap className="w-4 h-4 animate-spin mx-auto text-[var(--text-secondary)]" /></div>
                      ) : templates.length === 0 ? (
                        <div className="p-3 text-center text-xs text-[var(--text-tertiary)]">No packages saved yet</div>
                      ) : (
                        templates.map(t => (
                          <button key={t.id} onClick={() => loadTemplate(t)} className="w-full px-3 py-2 text-left hover:bg-[var(--surface-background)] transition-colors" data-testid={`template-${t.id}`}>
                            <p className="text-xs font-semibold text-text-primary">{t.name}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">{t.lineItems.length} items · {formatCurrency(t.lineItems.reduce((s: number, i: QuoteTemplateLineItem) => s + i.quantity * i.price, 0), effectiveCurrency)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Column headers */}
              <div className="grid items-center px-3.5 py-2" style={{ gridTemplateColumns: '1fr 72px 72px 28px', borderBottom: '0.5px solid var(--border)', background: 'var(--surface-background)' }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">Description</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] text-center">Qty</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] text-right">Price</span>
                <span />
              </div>

              {/* Line item rows */}
              {lineItems.map((item, index) => (
                <div key={index} className="grid items-center px-3.5 py-2.5 group hover:bg-[var(--surface-background)] transition-colors" style={{ gridTemplateColumns: '1fr 72px 72px 28px', borderBottom: '0.5px solid var(--border-light, var(--border))' }} data-testid={`line-item-${index}`}>
                  <div>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full bg-transparent text-xs font-semibold text-text-primary placeholder:text-[var(--text-tertiary)] focus:outline-none"
                      data-testid={`line-desc-${index}`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateLineItem(index, 'quantity', e.target.value)}
                      min={1}
                      className="w-12 text-center bg-[var(--surface-background)] rounded-[5px] text-xs py-1 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#6C2EDB]"
                      style={{ border: '0.5px solid var(--border)' }}
                      data-testid={`line-qty-${index}`}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={item.price || ''}
                      onChange={e => updateLineItem(index, 'price', e.target.value)}
                      placeholder="0"
                      className="w-full text-right bg-transparent text-xs font-semibold text-text-primary tabular-nums placeholder:text-[var(--text-tertiary)] focus:outline-none"
                      data-testid={`line-price-${index}`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length <= 1}
                      className="w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-20"
                      style={{ background: lineItems.length > 1 ? 'rgba(239,68,68,0.08)' : undefined }}
                      title={lineItems.length <= 1 ? 'At least one item required' : 'Remove item'}
                      data-testid={`line-delete-${index}`}
                    >
                      <Minus className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add line item */}
              <button onClick={addLineItem} className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[#6C2EDB] transition-colors" style={{ borderTop: '0.5px dashed var(--border)' }} data-testid="add-line-item-btn">
                <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px]" style={{ border: '1.5px dashed var(--border)' }}>+</span>
                Add {lang.quote} item
              </button>
            </div>

            {/* Notes / Terms */}
            <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface-base)' }} data-testid="notes-card">
              <div className="px-3.5 py-2.5" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <span className="text-xs font-bold text-text-primary">Note to {lang.client}</span>
              </div>
              <div className="p-3.5">
                <textarea
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  placeholder={`Add a personal note to ${lang.client.toLowerCase()} — context, next steps, or a warm introduction to the ${lang.quote.toLowerCase()}...`}
                  className="w-full bg-[var(--surface-background)] text-text-primary text-xs placeholder:text-[var(--text-tertiary)] resize-none rounded-lg px-3 py-2.5"
                  style={{ border: '0.5px solid var(--border-dark, var(--border))', minHeight: '72px' }}
                  rows={3}
                  data-testid="terms-textarea"
                />
              </div>
            </div>

            {/* Totals card */}
            <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface-base)' }} data-testid="totals-card">
              <div className="px-3.5">
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <span className="text-xs text-[var(--text-secondary)]">Subtotal</span>
                  <span className="text-xs font-semibold text-text-primary tabular-nums">{formatCurrency(subtotal, effectiveCurrency)}</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <span className="text-xs text-[var(--text-secondary)]">Discount</span>
                  <span className="text-xs text-[var(--text-secondary)]">—</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--text-secondary)]">Tax</span>
                    <input
                      type="number"
                      value={tax || ''}
                      onChange={e => setTax(Number(e.target.value) || 0)}
                      className="w-10 text-center bg-[var(--surface-background)] rounded text-[10px] py-0.5 tabular-nums focus:outline-none"
                      style={{ border: '0.5px solid var(--border)' }}
                      placeholder="0"
                      data-testid="tax-input"
                    />
                    <span className="text-[10px] text-[var(--text-tertiary)]">%</span>
                  </div>
                  <span className="text-xs font-semibold text-text-primary tabular-nums">{formatCurrency(taxAmount, effectiveCurrency)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3.5 py-3" style={{ background: 'rgba(108,46,219,0.04)', borderTop: '0.5px solid rgba(108,46,219,0.10)' }}>
                <span className="text-sm font-bold text-text-primary">Total</span>
                <span className="text-xl font-extrabold text-text-primary tabular-nums" data-testid="quote-total">{formatCurrency(total, effectiveCurrency)}</span>
              </div>
            </div>

            {/* Currency override (compact) */}
            <div className="flex items-center gap-2 px-1">
              <button onClick={() => setShowCurrencyOptions(!showCurrencyOptions)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors">
                <Globe className="w-3 h-3" /> Currency: {effectiveCurrency.currencySymbol} {effectiveCurrency.currency}
                <CaretDown className={`w-2.5 h-2.5 transition ${showCurrencyOptions ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={() => setShowPreview(true)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors ml-auto">
                <Eye className="w-3 h-3" /> Preview
              </button>
            </div>
            {showCurrencyOptions && (
              <div className="rounded-lg p-3 space-y-2" style={{ border: '0.5px solid var(--border)', background: 'var(--surface-background)' }}>
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <input type="checkbox" checked={useCurrencyOverride} onChange={e => setUseCurrencyOverride(e.target.checked)} className="rounded" />
                  Override default currency
                </label>
                {useCurrencyOverride && (
                  <select
                    value={currencyOverride.currency || ''}
                    onChange={e => {
                      const c = AVAILABLE_CURRENCIES.find(cur => cur.code === e.target.value);
                      if (c) setCurrencyOverride({ ...currencyOverride, currency: c.code, currencySymbol: c.symbol });
                    }}
                    className="w-full text-xs bg-[var(--surface-base)] rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
                    style={{ border: '0.5px solid var(--border)' }}
                    data-testid="currency-select"
                  >
                    <option value="">Select currency</option>
                    {AVAILABLE_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
                  </select>
                )}
              </div>
            )}
            {/* Payment terms (compact) */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] text-[var(--text-tertiary)]">Payment:</span>
              <select
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="text-[10px] bg-transparent text-[var(--text-secondary)] focus:outline-none cursor-pointer"
                data-testid="payment-terms-select"
              >
                {PAYMENT_TERMS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          {/* ═══ Right column — sidebar ═══ */}
          <div className="w-full md:w-[220px] flex-shrink-0 overflow-y-auto p-4 space-y-4" style={{ borderLeft: '0.5px solid var(--border)', background: 'var(--surface-base)' }}>

            {/* Value summary */}
            <div className="rounded-lg px-3.5 py-3" style={{ border: '0.5px solid var(--border)', background: 'var(--surface-background)' }} data-testid="value-summary">
              <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]">{lang.quote.toUpperCase()} VALUE</p>
              <p className="text-[22px] font-extrabold text-text-primary tabular-nums mt-1">{formatCurrency(total, effectiveCurrency)}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{lead.projectTitle} · {lead.keyDate || lead.eventDate ? new Date(lead.keyDate || lead.eventDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</p>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium" style={
                  existingQuote?.status === 'SENT' ? { background: 'rgba(108,46,219,0.1)', color: '#6C2EDB' }
                    : existingQuote?.status === 'VIEWED' ? { background: 'rgba(245,158,11,0.1)', color: '#92400E' }
                    : existingQuote?.status === 'ACCEPTED' ? { background: 'rgba(16,185,129,0.1)', color: '#065F46' }
                    : existingQuote?.status === 'DECLINED' ? { background: 'rgba(239,68,68,0.1)', color: '#991B1B' }
                    : { background: 'rgba(245,158,11,0.1)', color: '#92400E' }
                }>
                  <span className={`w-1.5 h-1.5 rounded-full ${existingQuote?.status === 'VIEWED' ? 'animate-pulse' : ''}`} style={{ background: existingQuote?.status === 'SENT' ? '#6C2EDB' : existingQuote?.status === 'VIEWED' ? '#D97706' : existingQuote?.status === 'ACCEPTED' ? '#059669' : existingQuote?.status === 'DECLINED' ? '#EF4444' : '#D97706' }} />
                  {existingQuote?.status === 'SENT' ? `Sent · ${existingQuote.sentAt ? new Date(existingQuote.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}` : existingQuote?.status === 'VIEWED' ? 'Viewed · waiting' : existingQuote?.status === 'ACCEPTED' ? 'Approved' : existingQuote?.status === 'DECLINED' ? 'Declined' : 'Draft · not sent'}
                </span>
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full h-[38px] rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              style={{ background: existingQuote?.status && existingQuote.status !== 'DRAFT' ? 'transparent' : '#6C2EDB', border: existingQuote?.status && existingQuote.status !== 'DRAFT' ? '1px solid var(--border)' : undefined, color: existingQuote?.status && existingQuote.status !== 'DRAFT' ? 'var(--text-secondary)' : 'white' }}
              data-testid="sidebar-send-btn"
            >
              {sending ? <SpinnerGap className="w-3.5 h-3.5 animate-spin" /> : <PaperPlaneTilt className="w-3.5 h-3.5" />}
              {existingQuote?.status && existingQuote.status !== 'DRAFT' ? 'Send reminder →' : `Send to ${clientFirstName} →`}
            </button>

            {/* Client preview thumbnail */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5">CLIENT PREVIEW</p>
              <ClientPreview leadName={lead.clientName} userName={userName} validUntil={validUntil} total={total} currencySettings={effectiveCurrency} />
            </div>

            {/* Saved packages */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5">SAVED PACKAGES</p>
              {templates.length === 0 ? (
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="w-full px-3 py-2.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[#6C2EDB] hover:border-[rgba(108,46,219,0.3)] transition-colors cursor-pointer text-left"
                  style={{ border: '1.5px dashed var(--border)' }}
                  data-testid="save-first-package-btn"
                >
                  Save your first package →
                </button>
              ) : (
                <div className="space-y-2">
                  {templates.slice(0, 3).map(t => (
                    <button
                      key={t.id}
                      onClick={() => loadTemplate(t)}
                      className="w-full px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer hover:border-[rgba(108,46,219,0.3)]"
                      style={{ border: '0.5px solid var(--border)', background: 'var(--surface-base)' }}
                      data-testid={`package-${t.id}`}
                    >
                      <p className="text-xs font-bold text-text-primary">{t.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{t.lineItems.length} items{t.description ? ` · ${t.description}` : ''}</p>
                      <p className="text-xs font-bold text-[#6C2EDB] mt-0.5">{formatCurrency(t.lineItems.reduce((s: number, i: QuoteTemplateLineItem) => s + i.quantity * i.price, 0), effectiveCurrency)}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="w-full px-3 py-2 rounded-lg text-[10px] font-medium text-[var(--text-secondary)] hover:text-[#6C2EDB] transition-colors text-left"
                    style={{ border: '1px dashed var(--border)' }}
                    data-testid="save-as-package-btn"
                  >
                    Save current as package →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowSaveTemplateModal(false)}>
          <div className="bg-[var(--surface-base)] rounded-xl p-5 w-full max-w-sm shadow-2xl" style={{ border: '0.5px solid var(--border)' }} onClick={e => e.stopPropagation()} data-testid="save-template-modal">
            <h3 className="text-sm font-bold text-text-primary mb-3">Save as Package</h3>
            <input
              type="text"
              placeholder="Package name (e.g. Wedding Standard)"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--surface-background)] text-text-primary placeholder:text-[var(--text-tertiary)] mb-2 focus:outline-none focus:ring-1 focus:ring-[#6C2EDB]"
              style={{ border: '0.5px solid var(--border)' }}
              data-testid="template-name-input"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={templateDescription}
              onChange={e => setTemplateDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--surface-background)] text-text-primary placeholder:text-[var(--text-tertiary)] mb-3 focus:outline-none"
              style={{ border: '0.5px solid var(--border)' }}
              data-testid="template-desc-input"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveTemplateModal(false)} className="flex-1 py-2 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-background)] transition">Cancel</button>
              <button onClick={saveAsTemplate} disabled={savingTemplate} className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-1.5" style={{ background: '#6C2EDB' }} data-testid="confirm-save-template">
                {savingTemplate ? <SpinnerGap className="w-3.5 h-3.5 animate-spin" /> : <FloppyDisk className="w-3.5 h-3.5" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
