import { useState, useRef } from 'react'
import {
  X,
  Send,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  User,
  FileText,
  Link
} from 'lucide-react'
import { Lead, leadsApi } from '../services/api'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { trackEmailSent } from '../utils/analytics'

interface EmailComposerModalProps {
  lead: Lead;
  onClose: () => void;
  onSent: () => void;
}

// Custom toolbar for dark theme
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

const quillFormats = ['bold', 'italic', 'underline', 'list', 'bullet', 'link']

export default function EmailComposerModal({ lead, onClose, onSent }: EmailComposerModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const quillRef = useRef<ReactQuill>(null)

  // Insert quick snippet into editor
  const insertSnippet = (text: string) => {
    const quill = quillRef.current?.getEditor()
    if (quill) {
      const range = quill.getSelection(true)
      quill.insertText(range.index, text)
      quill.setSelection(range.index + text.length, 0)
    }
  }

  const handleSend = async () => {
    // Validation
    if (!subject.trim()) {
      setError('Subject is required')
      return
    }
    
    // Strip HTML and check length
    const plainText = body.replace(/<[^>]*>/g, '').trim()
    if (plainText.length < 10) {
      setError('Message must be at least 10 characters')
      return
    }

    // Validate CC/BCC emails if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (cc.trim()) {
      const ccEmails = cc.split(',').map(e => e.trim()).filter(Boolean)
      for (const email of ccEmails) {
        if (!emailRegex.test(email)) {
          setError(`Invalid CC email: ${email}`)
          return
        }
      }
    }
    if (bcc.trim()) {
      const bccEmails = bcc.split(',').map(e => e.trim()).filter(Boolean)
      for (const email of bccEmails) {
        if (!emailRegex.test(email)) {
          setError(`Invalid BCC email: ${email}`)
          return
        }
      }
    }

    setSending(true)
    setError('')

    const result = await leadsApi.sendEmail(lead.id, {
      subject: subject.trim(),
      body: body,
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
    })

    setSending(false)

    if (result.error) {
      setError(result.message || 'Failed to send email')
      return
    }

    trackEmailSent()
    setSuccess(true)
    setTimeout(() => {
      onSent()
      onClose()
    }, 1500)
  }

  if (success) {
    return (
      <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-dark-card rounded-2xl shadow-2xl w-full max-w-md border border-dark-border p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-700/30">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Email Sent!</h3>
          <p className="text-gray-400">
            Your email has been sent to {lead.clientName}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-dark-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="email-composer-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Email {lead.clientName}
              </h2>
              <p className="text-brand-primary-light text-sm mt-1">
                {lead.projectTitle}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* To Field (read-only) */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">To</label>
            <div className="px-3 py-2 bg-dark-bg-secondary/50 border border-dark-border rounded-lg text-gray-400 text-sm">
              {lead.clientEmail}
            </div>
          </div>

          {/* CC/BCC Toggle */}
          <button
            onClick={() => setShowCc(!showCc)}
            className="flex items-center gap-1 text-sm text-brand-primary-light hover:text-brand-primary-light transition"
          >
            {showCc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showCc ? 'Hide CC/BCC' : 'Add CC/BCC'}
          </button>

          {showCc && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">CC (comma separated)</label>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-brand-primary"
                  placeholder="cc@example.com"
                  data-testid="email-cc-input"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">BCC (comma separated)</label>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-brand-primary"
                  placeholder="bcc@example.com"
                  data-testid="email-bcc-input"
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg-secondary border border-dark-border rounded-lg text-white text-sm focus:ring-2 focus:ring-brand-primary"
              placeholder="Enter email subject..."
              data-testid="email-subject-input"
            />
          </div>

          {/* Quick Insert Snippets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Quick insert:</span>
            <button
              onClick={() => insertSnippet(lead.clientName)}
              className="flex items-center gap-1 px-2 py-1 bg-dark-bg-secondary border border-dark-border rounded text-xs text-gray-400 hover:text-white hover:border-brand-primary transition"
              title="Insert client name"
            >
              <User className="w-3 h-3" />
              Client Name
            </button>
            <button
              onClick={() => insertSnippet(lead.projectTitle)}
              className="flex items-center gap-1 px-2 py-1 bg-dark-bg-secondary border border-dark-border rounded text-xs text-gray-400 hover:text-white hover:border-brand-primary transition"
              title="Insert project title"
            >
              <FileText className="w-3 h-3" />
              Project Title
            </button>
            <button
              onClick={() => insertSnippet(`https://kolor-growth-engine.preview.emergentagent.com/portal/${lead.portalToken}`)}
              className="flex items-center gap-1 px-2 py-1 bg-dark-bg-secondary border border-dark-border rounded text-xs text-gray-400 hover:text-white hover:border-brand-primary transition"
              title="Insert client portal link"
            >
              <Link className="w-3 h-3" />
              Portal Link
            </button>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Message *</label>
            <div className="email-editor-container">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={body}
                onChange={setBody}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your message..."
                className="bg-dark-bg-secondary rounded-lg border border-dark-border text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-border flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:bg-dark-card-hover rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition font-medium disabled:opacity-50"
            data-testid="send-email-btn"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Email
          </button>
        </div>
      </div>

      {/* Custom styles for Quill in dark theme */}
      <style>{`
        .email-editor-container .ql-toolbar {
          background: var(--dark-bg-secondary, #1a1a2e);
          border-color: var(--dark-border, #2d2d44) !important;
          border-radius: 0.5rem 0.5rem 0 0;
        }
        .email-editor-container .ql-toolbar .ql-stroke {
          stroke: #9ca3af;
        }
        .email-editor-container .ql-toolbar .ql-fill {
          fill: #9ca3af;
        }
        .email-editor-container .ql-toolbar button:hover .ql-stroke,
        .email-editor-container .ql-toolbar button.ql-active .ql-stroke {
          stroke: #a78bfa;
        }
        .email-editor-container .ql-toolbar button:hover .ql-fill,
        .email-editor-container .ql-toolbar button.ql-active .ql-fill {
          fill: #a78bfa;
        }
        .email-editor-container .ql-container {
          background: var(--dark-bg-secondary, #1a1a2e);
          border-color: var(--dark-border, #2d2d44) !important;
          border-radius: 0 0 0.5rem 0.5rem;
          min-height: 200px;
          font-size: 0.875rem;
        }
        .email-editor-container .ql-editor {
          color: white;
          min-height: 180px;
        }
        .email-editor-container .ql-editor.ql-blank::before {
          color: #6b7280;
          font-style: normal;
        }
        .email-editor-container .ql-editor a {
          color: #a78bfa;
        }
      `}</style>
    </div>
  )
}
