import BrandSettings from '../BrandSettings'
import EmailSignatureSettings from '../EmailSignatureSettings'
import EmailSignatureGenerator from '../EmailSignatureGenerator'

export default function BrandStudioTab() {
  return (
    <div className="space-y-8" data-testid="brand-studio-tab">
      <BrandSettings />
      <EmailSignatureSettings />
      <EmailSignatureGenerator />
    </div>
  )
}
