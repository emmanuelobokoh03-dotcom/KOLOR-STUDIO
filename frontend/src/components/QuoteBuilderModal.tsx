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
  DownloadSimple
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

interface UserCurrencySettings extends Partial<CurrencySettings> {
  defaultTaxRate?: number;
}

interface QuoteBuilderModalProps {
  lead: Lead;
  existingQuote?: Quote | null;
  userCurrencySettings?: UserCurrencySettings;
  onClose: () => void;
  onSaved: (quote: Quote) => void;
  onSent?: (quote: Quote) => void;
}

const DEFAULT_TERMS = `1. This quote is valid for 30 days from the date of issue.
2. A deposit of 50% is required to secure your booking.
3. The remaining balance is due upon project completion.
4. Cancellations made within 7 days of the project date are subject to a 50% cancellation fee.
5. All prices are quoted in the specified currency.`;

export default function QuoteBuilderModal({ 
  lead, 
  existingQuote, 
  userCurrencySettings = {},
  onClose, 
  onSaved,
  onSent 
}: QuoteBuilderModalProps) {
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

  // Currency override state (use quote's override or empty for user default)
  const [useCurrencyOverride, setUseCurrencyOverride] = useState(!!existingQuote?.currency);
  const [currencyOverride, setCurrencyOverride] = useState<Partial<CurrencySettings>>({
    currency: existingQuote?.currency || undefined,
    currencySymbol: existingQuote?.currencySymbol || undefined,
    currencyPosition: (existingQuote?.currencyPosition as 'BEFORE' | 'AFTER') || 'BEFORE',
    numberFormat: existingQuote?.numberFormat as any || undefined,
  });

  // Get effective currency settings (override or user default)
  const effectiveCurrency = getMergedCurrencySettings(
    userCurrencySettings,
    useCurrencyOverride ? currencyOverride : {}
  );

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    const result = await quoteTemplatesApi.getAll();
    if (result.data?.templates) {
      setTemplates(result.data.templates);
    }
    setLoadingTemplates(false);
  };

  // Load template into form
  const loadTemplate = (template: QuoteTemplate) => {
    const templateLineItems: QuoteLineItem[] = template.lineItems.map((item: QuoteTemplateLineItem) => ({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    }));
    setLineItems(templateLineItems);
    setPaymentTerms(template.paymentTerms);
    if (template.terms) {
      setTerms(template.terms);
    }
    setLoadedTemplateName(template.name);
    setShowTemplateDropdown(false);
    // Track template applied
    trackTemplateApplied();
    setTemplateSuccess(`Loaded template: ${template.name}`);
    setTimeout(() => setTemplateSuccess(''), 3000);
  };

  // Save current quote as template
  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    if (lineItems.some(item => !item.description.trim())) {
      setError('All line items must have a description');
      return;
    }

    setSavingTemplate(true);
    setError('');

    const templateData = {
      name: templateName.trim(),
      description: templateDescription.trim() || undefined,
      lineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentTerms,
      terms: terms || undefined,
    };

    const result = await quoteTemplatesApi.create(templateData);
    setSavingTemplate(false);

    if (result.error) {
      setError(result.message || 'Failed to save template');
      return;
    }

    // Refresh templates list
    await fetchTemplates();
    setShowSaveTemplateModal(false);
    setTemplateName('');
    setTemplateDescription('');
    // Track template created
    trackTemplateCreated();
    setTemplateSuccess('Template saved! You can reuse it for future quotes.');
    setTimeout(() => setTemplateSuccess(''), 4000);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;

  // Update line item
  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'quantity' || field === 'price') {
      updated[index] = {
        ...updated[index],
        [field]: Number(value) || 0,
        total: field === 'quantity' 
          ? (Number(value) || 0) * updated[index].price
          : updated[index].quantity * (Number(value) || 0)
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLineItems(updated);
  };

  // Add line item
  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, price: 0, total: 0 }]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Validate form
  const validate = (): boolean => {
    if (lineItems.some(item => !item.description.trim())) {
      setError('All line items must have a description');
      return false;
    }
    if (lineItems.some(item => item.price <= 0)) {
      setError('All line items must have a price greater than 0');
      return false;
    }
    if (new Date(validUntil) <= new Date()) {
      setError('Valid until date must be in the future');
      return false;
    }
    // Validate currency selection if override is enabled
    if (useCurrencyOverride && !currencyOverride.currency) {
      setError('Please select a currency or disable the currency override');
      return false;
    }
    return true;
  };

  // Save as draft
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    const data: CreateQuoteData = {
      lineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      tax,
      paymentTerms,
      validUntil,
      terms,
      // Include currency override if enabled AND currency is selected
      ...(useCurrencyOverride && currencyOverride.currency && {
        currency: currencyOverride.currency,
        currencySymbol: currencyOverride.currencySymbol,
        currencyPosition: currencyOverride.currencyPosition || 'BEFORE',
        numberFormat: currencyOverride.numberFormat,
      })
    };

    // Debug: log currency data being sent
    const result = existingQuote
      ? await quotesApi.update(existingQuote.id, data)
      : await quotesApi.create(lead.id, data);

    setLoading(false);

    if (result.error) {
      setError(result.message || 'Failed to save quote');
      return;
    }

    if (result.data?.quote) {
      onSaved(result.data.quote);
    }
  };

  // Send quote
  const handleSend = async () => {
    if (!validate()) return;

    setSending(true);
    setError('');

    // First save the quote
    const data: CreateQuoteData = {
      lineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      tax,
      paymentTerms,
      validUntil,
      terms,
      // Include currency override if enabled
      ...(useCurrencyOverride && currencyOverride.currency && {
        currency: currencyOverride.currency,
        currencySymbol: currencyOverride.currencySymbol,
        currencyPosition: currencyOverride.currencyPosition || 'BEFORE',
        numberFormat: currencyOverride.numberFormat,
      })
    };

    let quoteId = existingQuote?.id;

    if (!existingQuote) {
      const createResult = await quotesApi.create(lead.id, data);
      if (createResult.error || !createResult.data?.quote) {
        setError(createResult.message || 'Failed to create quote');
        setSending(false);
        return;
      }
      quoteId = createResult.data.quote.id;
    } else {
      const updateResult = await quotesApi.update(existingQuote.id, data);
      if (updateResult.error) {
        setError(updateResult.message || 'Failed to update quote');
        setSending(false);
        return;
      }
    }

    // Now send the quote
    const sendResult = await quotesApi.send(quoteId!);
    setSending(false);

    if (sendResult.error) {
      setError(sendResult.message || 'Failed to send quote');
      return;
    }

    if (sendResult.data?.quote && onSent) {
      onSent(sendResult.data.quote);
    } else if (sendResult.data?.quote) {
      onSaved(sendResult.data.quote);
    }
  };

  if (showPreview) {
    return (
      <QuotePreview
        lead={lead}
        lineItems={lineItems}
        subtotal={subtotal}
        tax={tax}
        taxAmount={taxAmount}
        total={total}
        paymentTerms={paymentTerms}
        validUntil={validUntil}
        terms={terms}
        currencySettings={effectiveCurrency}
        onBack={() => setShowPreview(false)}
        onSend={handleSend}
        sending={sending}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose} role="presentation">
      <div 
        className="bg-surface-base rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-light-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="quote-builder-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-builder-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="quote-builder-title" className="text-xl font-bold">
                {existingQuote ? 'Edit Quote' : 'Create Quote'}
              </h2>
              <p className="text-purple-600 text-sm mt-1">
                For {lead.clientName} • {lead.projectTitle}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Close quote builder" title="Close (Esc)"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-400" role="alert">
              <WarningCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {templateSuccess && (
            <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center gap-3 text-green-400">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{templateSuccess}</span>
            </div>
          )}

          {/* Template Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Load Template Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-light-100 border border-light-200 rounded-lg text-sm text-text-secondary hover:bg-light-100 transition"
                data-testid="load-template-btn"
              >
                <DownloadSimple weight="bold" className="w-4 h-4" />
                Load Template
                <CaretDown className={`w-3 h-3 transition ${showTemplateDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showTemplateDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-surface-base border border-light-200 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                  {loadingTemplates ? (
                    <div className="p-4 text-center text-text-secondary">
                      <SpinnerGap className="w-5 h-5 animate-spin mx-auto" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="p-4 text-center text-text-tertiary text-sm">
                      No templates saved yet
                    </div>
                  ) : (
                    templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => loadTemplate(template)}
                        className="w-full text-left px-4 py-3 hover:bg-light-100 border-b border-light-200 last:border-b-0 transition"
                        data-testid={`template-option-${template.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{template.name}</p>
                            {template.description && (
                              <p className="text-xs text-text-tertiary truncate">{template.description}</p>
                            )}
                            <p className="text-xs text-gray-600">
                              {(template.lineItems as QuoteTemplateLineItem[]).length} item{(template.lineItems as QuoteTemplateLineItem[]).length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Save as Template Button */}
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-light-100 border border-light-200 rounded-lg text-sm text-text-secondary hover:bg-light-100 transition"
              data-testid="save-template-btn"
            >
              <FileText className="w-4 h-4" />
              Save as Template
            </button>

            {loadedTemplateName && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                Using: {loadedTemplateName}
              </span>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <CurrencyDollar className="w-4 h-4 text-purple-600" />
              Line Items
            </h3>
            
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="bg-light-100 rounded-lg p-4 border border-light-200">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <label className="text-xs text-gray-600 mb-1 block">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base border border-light-200 rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Service description"
                        data-testid={`line-item-description-${index}`}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs text-gray-600 mb-1 block">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-2 bg-surface-base border border-light-200 rounded-lg text-text-primary text-sm text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        data-testid={`line-item-quantity-${index}`}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-gray-600 mb-1 block">Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price || ''}
                        onChange={(e) => updateLineItem(index, 'price', e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base border border-light-200 rounded-lg text-text-primary text-sm font-mono text-right focus:ring-2 focus:ring-purple-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                        data-testid={`line-item-price-${index}`}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-gray-600 mb-1 block">Total</label>
                      <div className="px-3 py-2 bg-white/50 border border-light-200 rounded-lg text-text-secondary text-sm font-mono text-right">
                        {formatCurrency(item.quantity * item.price, effectiveCurrency)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                        className="p-2 text-text-tertiary hover:text-red-400 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addLineItem}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition text-sm font-medium"
              data-testid="add-line-item"
            >
              <Plus weight="bold" className="w-4 h-4" />
              Add Line Item
            </button>
          </div>

          {/* Totals */}
          <div className="bg-light-100 rounded-xl p-4 border border-light-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary font-medium font-mono">{formatCurrency(subtotal, effectiveCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">Tax</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={tax || ''}
                    onChange={(e) => setTax(Number(e.target.value) || 0)}
                    className="w-16 px-2 py-1 bg-surface-base border border-light-200 rounded text-text-primary text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                    data-testid="tax-input"
                  />
                  <span className="text-text-secondary">%</span>
                </div>
                <span className="text-text-primary">{formatCurrency(taxAmount, effectiveCurrency)}</span>
              </div>
              <div className="pt-3 border-t border-light-200 flex justify-between">
                <span className="text-lg font-semibold text-text-primary">Total</span>
                <span className="text-2xl font-bold text-purple-600" data-testid="quote-total">
                  {formatCurrency(total, effectiveCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Currency Override Section */}
          <div className="bg-light-100 rounded-xl p-4 border border-light-200">
            <button
              type="button"
              onClick={() => setShowCurrencyOptions(!showCurrencyOptions)}
              className="w-full flex items-center justify-between text-sm text-text-secondary hover:text-text-secondary"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Currency Settings
                <span className="text-xs text-purple-600">
                  ({effectiveCurrency.currency} - {effectiveCurrency.currencySymbol})
                </span>
              </span>
              <CaretDown className={`w-4 h-4 transition ${showCurrencyOptions ? 'rotate-180' : ''}`} />
            </button>

            {showCurrencyOptions && (
              <div className="mt-4 space-y-4 pt-4 border-t border-light-200">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="useCurrencyOverride"
                    checked={useCurrencyOverride}
                    onChange={(e) => setUseCurrencyOverride(e.target.checked)}
                    className="w-4 h-4 rounded border-light-200 bg-light-100 text-brand-primary focus:ring-purple-500"
                  />
                  <label htmlFor="useCurrencyOverride" className="text-sm text-text-secondary">
                    Use different currency for this quote
                  </label>
                </div>

                {useCurrencyOverride && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Currency</label>
                      <select
                        value={currencyOverride.currency || ''}
                        onChange={(e) => {
                          const selected = AVAILABLE_CURRENCIES.find(c => c.code === e.target.value);
                          setCurrencyOverride({
                            ...currencyOverride,
                            currency: e.target.value,
                            currencySymbol: selected?.symbol || e.target.value,
                            currencyPosition: currencyOverride.currencyPosition || 'BEFORE'
                          });
                        }}
                        className="w-full px-3 py-2 bg-surface-base border border-light-200 rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-purple-500 [&>option]:bg-surface-base [&>option]:text-text-primary"
                        data-testid="currency-override-select"
                      >
                        <option value="">Select currency...</option>
                        {AVAILABLE_CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.symbol} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Position</label>
                      <select
                        value={currencyOverride.currencyPosition || 'BEFORE'}
                        onChange={(e) => setCurrencyOverride({
                          ...currencyOverride,
                          currencyPosition: e.target.value as 'BEFORE' | 'AFTER'
                        })}
                        className="w-full px-3 py-2 bg-surface-base border border-light-200 rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-purple-500 [&>option]:bg-surface-base [&>option]:text-text-primary"
                      >
                        <option value="BEFORE">Before ({currencyOverride.currencySymbol || '$'}100)</option>
                        <option value="AFTER">After (100{currencyOverride.currencySymbol || '$'})</option>
                      </select>
                    </div>
                  </div>
                )}

                <p className="text-xs text-text-tertiary">
                  {useCurrencyOverride 
                    ? 'This quote will use a different currency than your default settings.'
                    : 'Using your default currency settings from profile.'}
                </p>
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-light-200 rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-purple-500"
                data-testid="payment-terms-select"
              >
                {PAYMENT_TERMS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-light-100 border border-light-200 rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-purple-500"
                data-testid="valid-until-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Terms & Conditions</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-light-100 border border-light-200 rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Enter terms and conditions..."
              data-testid="terms-input"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-light-200 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:bg-light-100 rounded-lg transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-light-200 text-text-secondary rounded-lg hover:bg-light-100 transition font-medium disabled:opacity-50"
              data-testid="save-draft-btn"
            >
              {loading ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 border border-brand-primary text-purple-600 rounded-lg hover:bg-purple-50 transition font-medium"
              data-testid="preview-btn"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition font-medium disabled:opacity-50"
              data-testid="send-quote-btn"
            >
              {sending ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <PaperPlaneTilt weight="bold" className="w-4 h-4" />}
              Send to Client
            </button>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowSaveTemplateModal(false)}
        >
          <div 
            className="bg-surface-base rounded-xl shadow-2xl w-full max-w-md border border-light-200 p-6"
            onClick={(e) => e.stopPropagation()}
            data-testid="save-template-modal"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">Save as Template</h3>
              <button 
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 hover:bg-light-100 rounded transition"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-light-100 border border-light-200 rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Wedding Photography Package"
                  maxLength={100}
                  data-testid="template-name-input"
                />
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-1 block">Description (optional)</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-light-100 border border-light-200 rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Brief description of this template..."
                  rows={2}
                  maxLength={500}
                  data-testid="template-description-input"
                />
              </div>

              <div className="bg-light-100 rounded-lg p-3 border border-light-200">
                <p className="text-xs text-text-tertiary mb-2">This template will include:</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''}</li>
                  <li>• Payment terms: {PAYMENT_TERMS_OPTIONS.find(o => o.value === paymentTerms)?.label}</li>
                  {terms && <li>• Terms & conditions</li>}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2 text-text-secondary hover:bg-light-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={saveAsTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition font-medium disabled:opacity-50"
                data-testid="confirm-save-template-btn"
              >
                {savingTemplate ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quote Preview Component
interface QuotePreviewProps {
  lead: Lead;
  lineItems: QuoteLineItem[];
  subtotal: number;
  tax: number;
  taxAmount: number;
  total: number;
  paymentTerms: string;
  validUntil: string;
  terms: string;
  currencySettings: CurrencySettings;
  onBack: () => void;
  onSend: () => void;
  sending: boolean;
}

function QuotePreview({
  lead,
  lineItems,
  subtotal,
  tax,
  taxAmount,
  total,
  paymentTerms,
  validUntil,
  terms,
  currencySettings,
  onBack,
  onSend,
  sending
}: QuotePreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const paymentTermsLabel = PAYMENT_TERMS_OPTIONS.find(o => o.value === paymentTerms)?.label || paymentTerms;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-base rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Preview Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">KOLOR STUDIO</span>
            </div>
            <div className="text-right text-sm text-purple-600">
              <p>Preview Mode</p>
              <p className="text-xs">This is what your client will see</p>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <p className="text-sm text-text-tertiary mb-1">QUOTE FOR</p>
            <h2 className="text-xl font-bold text-gray-900">{lead.projectTitle}</h2>
            <p className="text-gray-600">{lead.clientName}</p>
          </div>

          {/* Line Items Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-text-tertiary">Description</th>
                <th className="text-center py-2 text-sm font-medium text-text-tertiary w-20">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-text-tertiary w-24">Price</th>
                <th className="text-right py-2 text-sm font-medium text-text-tertiary w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">{item.description || '—'}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">{formatCurrency(item.price, currencySettings)}</td>
                  <td className="py-3 text-right text-gray-900 font-medium">{formatCurrency(item.quantity * item.price, currencySettings)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(subtotal, currencySettings)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({tax}%)</span>
                  <span className="text-gray-900">{formatCurrency(taxAmount, currencySettings)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-brand-primary">{formatCurrency(total, currencySettings)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary mb-1">PAYMENT TERMS</p>
                <p className="text-gray-900 font-medium">{paymentTermsLabel}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">VALID UNTIL</p>
                <p className="text-gray-900 font-medium">{formatDate(validUntil)}</p>
              </div>
            </div>
            {terms && (
              <div>
                <p className="text-xs text-text-tertiary mb-1">TERMS & CONDITIONS</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{terms}</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Actions */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            ← Back to Edit
          </button>
          <button
            onClick={onSend}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition font-medium disabled:opacity-50"
          >
            {sending ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <PaperPlaneTilt weight="bold" className="w-4 h-4" />}
            Send to Client
          </button>
        </div>
      </div>
    </div>
  );
}
