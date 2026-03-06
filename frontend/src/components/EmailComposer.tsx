import { useState, useRef, useEffect } from 'react';
import { Mail, Eye, Send, X, Loader2, Edit3 } from 'lucide-react';

interface EmailComposerProps {
  type: 'quote' | 'contract';
  recipientName: string;
  recipientEmail: string;
  projectTitle: string;
  userName: string;
  studioName?: string;
  onSend: (subject: string, message: string) => Promise<void>;
  onCancel: () => void;
}

export default function EmailComposer({
  type,
  recipientName,
  recipientEmail,
  projectTitle,
  userName,
  studioName,
  onSend,
  onCancel,
}: EmailComposerProps) {
  const firstName = recipientName.split(' ')[0];

  const [subject, setSubject] = useState(
    type === 'quote'
      ? `Your ${projectTitle} quote is ready!`
      : `Please review your ${projectTitle} agreement`
  );

  const [message, setMessage] = useState(
    type === 'quote'
      ? `Hi ${firstName},\n\nThanks so much for your interest! I've prepared a custom quote for your project "${projectTitle}".\n\nPlease review the details and let me know if you have any questions. I'm excited about the possibility of working together!\n\nLooking forward to hearing from you,\n${userName}${studioName ? `\n${studioName}` : ''}`
      : `Hi ${firstName},\n\nYour agreement for "${projectTitle}" is ready for review and signature.\n\nPlease take a moment to read through the terms. Once you're ready, you can sign electronically using the link in this email.\n\nLet me know if you have any questions!\n\nBest regards,\n${userName}${studioName ? `\n${studioName}` : ''}`
  );

  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await onSend(subject.trim(), message.trim());
    } catch {
      // Error handling is done by parent
    } finally {
      setSending(false);
    }
  };

  const insertVariable = (value: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = message.substring(0, start);
    const after = message.substring(end);
    setMessage(before + value + after);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + value.length;
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" data-testid="email-composer-modal">
      <div
        className="bg-[#1A1A1A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[#333] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-primary/20 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-brand-primary-light" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#FAFAFA]" data-testid="email-composer-title">
                {type === 'quote' ? 'Send Quote' : 'Send Contract'}
              </h2>
              <p className="text-xs text-[#A3A3A3]">Customize your message to {firstName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
            data-testid="email-composer-close"
          >
            <X className="w-5 h-5 text-[#A3A3A3]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Preview toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#A3A3A3] border border-[#333] rounded-lg hover:bg-[#333] transition-colors"
              data-testid="email-preview-toggle"
            >
              {showPreview ? <><Edit3 className="w-3.5 h-3.5" /> Edit</> : <><Eye className="w-3.5 h-3.5" /> Preview</>}
            </button>
          </div>

          {showPreview ? (
            /* Preview Mode */
            <div className="bg-white text-gray-900 rounded-xl overflow-hidden" data-testid="email-preview">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">To:</span> {recipientName} &lt;{recipientEmail}&gt;
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium text-gray-700">Subject:</span> {subject}
                </p>
              </div>
              <div className="px-6 py-5">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">{message}</div>
                <div className="mt-6 pt-5 border-t border-gray-200">
                  <div
                    className="inline-block px-6 py-3 text-white text-sm font-semibold rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                  >
                    {type === 'quote' ? 'View Quote Details' : 'Review & Sign Agreement'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <>
              {/* Recipient (read-only) */}
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] uppercase tracking-wide mb-1.5">To</label>
                <div className="px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-[#A3A3A3] text-sm">
                  {recipientName} ({recipientEmail})
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] uppercase tracking-wide mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl text-[#FAFAFA] text-sm focus:outline-none focus:border-brand-primary transition-colors"
                  placeholder="Email subject..."
                  data-testid="email-subject-input"
                />
              </div>

              {/* Quick Insert */}
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] uppercase tracking-wide mb-1.5">Quick Insert</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Client Name', value: recipientName },
                    { label: 'First Name', value: firstName },
                    { label: 'Project Title', value: projectTitle },
                    { label: 'Your Name', value: userName },
                    ...(studioName ? [{ label: 'Studio Name', value: studioName }] : []),
                  ].map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => insertVariable(v.value)}
                      className="px-2.5 py-1 bg-[#0F0F0F] border border-[#333] hover:border-brand-primary/50 rounded-lg text-xs text-[#A3A3A3] hover:text-brand-primary-light transition-colors"
                      data-testid={`insert-${v.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message body */}
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] uppercase tracking-wide mb-1.5">Message</label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#333] rounded-xl text-[#FAFAFA] text-sm font-mono leading-relaxed focus:outline-none focus:border-brand-primary transition-colors resize-none"
                  placeholder="Write your message..."
                  data-testid="email-message-input"
                />
                <p className="text-[10px] text-gray-600 mt-1.5">
                  Keep it personal and friendly — a warm message builds trust!
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#333] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onCancel}
            disabled={sending}
            className="px-4 py-2.5 text-sm font-medium text-[#A3A3A3] border border-[#333] rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
            data-testid="email-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="email-send-btn"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send {type === 'quote' ? 'Quote' : 'Contract'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
