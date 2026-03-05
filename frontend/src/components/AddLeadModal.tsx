import { useState, useRef } from 'react'
import { InlineHint } from './InlineHint'
import { 
  ServiceType, 
  LeadSource,
  ProjectType,
  IndustryType,
  DeliverableType,
  SERVICE_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  INDUSTRY_TYPE_LABELS,
  DELIVERABLE_TYPE_LABELS,
  CreateLeadData,
  leadsApi 
} from '../services/api'
import { 
  X, Loader2, AlertCircle, CheckCircle,
  Camera, Briefcase, Palette, ShoppingBag,
  Monitor, PenTool, Brush, Megaphone, Scissors, Globe, Package, FileImage, Printer, Wrench, Layout, Layers,
  Upload, ImageIcon, Trash2
} from 'lucide-react'
import { trackLeadCreated } from '../utils/analytics'

interface AddLeadModalProps {
  onClose: () => void;
  onLeadCreated: () => void;
}

const SERVICE_TYPES: ServiceType[] = [
  'PHOTOGRAPHY', 'VIDEOGRAPHY', 'GRAPHIC_DESIGN', 'WEB_DESIGN', 
  'BRANDING', 'CONTENT_CREATION', 'CONSULTING', 'OTHER'
];

const LEAD_SOURCES: LeadSource[] = [
  'WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'REFERRAL', 
  'GOOGLE', 'LINKEDIN', 'TIKTOK', 'EMAIL', 'OTHER'
];

const PROJECT_TYPE_CONFIG: { type: ProjectType; icon: React.ElementType; desc: string; color: string }[] = [
  { type: 'SERVICE', icon: Camera, desc: 'Session or event', color: 'violet' },
  { type: 'COMMISSION', icon: Palette, desc: 'Custom artwork', color: 'amber' },
  { type: 'PROJECT', icon: Briefcase, desc: 'Multi-phase work', color: 'blue' },
  { type: 'PRODUCT_SALE', icon: ShoppingBag, desc: 'Product or print', color: 'emerald' },
];

const INDUSTRY_ICONS: Record<IndustryType, React.ElementType> = {
  PHOTOGRAPHY: Camera,
  VIDEOGRAPHY: Monitor,
  GRAPHIC_DESIGN: PenTool,
  WEB_DESIGN: Globe,
  ILLUSTRATION: Brush,
  FINE_ART: Palette,
  SCULPTURE: Scissors,
  BRANDING: Megaphone,
  CONTENT_CREATION: FileImage,
  OTHER: Layers,
};

const DELIVERABLE_CONFIG: { type: DeliverableType; icon: React.ElementType; color: string }[] = [
  { type: 'DIGITAL_FILES', icon: FileImage, color: 'blue' },
  { type: 'PHYSICAL_ART', icon: Palette, color: 'amber' },
  { type: 'PRINTS', icon: Printer, color: 'emerald' },
  { type: 'SERVICE', icon: Wrench, color: 'violet' },
  { type: 'WEBSITE', icon: Layout, color: 'cyan' },
  { type: 'MIXED', icon: Package, color: 'pink' },
];

export default function AddLeadModal({ onClose, onLeadCreated }: AddLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CreateLeadData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    serviceType: 'PHOTOGRAPHY',
    projectTitle: '',
    description: '',
    budget: '',
    timeline: '',
    source: 'WEBSITE',
    projectType: 'SERVICE',
    deliverableType: 'DIGITAL_FILES',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.clientName || !formData.clientEmail || !formData.projectTitle || !formData.description) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    let coverImageUrl: string | undefined;

    // Upload cover image first if selected
    if (coverImageFile) {
      setUploadingCover(true);
      const uploadResult = await leadsApi.uploadCoverImage(coverImageFile);
      setUploadingCover(false);
      if (uploadResult.error) {
        setError('Failed to upload cover image. Creating lead without it.');
      } else if (uploadResult.data?.url) {
        coverImageUrl = uploadResult.data.url;
      }
    }

    const result = await leadsApi.create({
      ...formData,
      coverImage: coverImageUrl,
    });
    setLoading(false);

    if (result.error) {
      setError(result.message || 'Failed to create lead');
      return;
    }

    trackLeadCreated(formData.source || 'WEBSITE', formData.serviceType);
    setSuccess(true);
    setTimeout(() => {
      onLeadCreated();
      onClose();
    }, 1000);
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 text-base";
  const labelClass = "block text-sm font-medium text-[#A3A3A3] mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 md:p-4" onClick={onClose}>
      <div 
        className="bg-[#1A1A1A] w-full md:rounded-2xl md:shadow-2xl md:max-w-2xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden border-t md:border border-[#333] animate-slide-up-full md:animate-fade-in rounded-t-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="add-lead-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary text-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Add New Lead</h2>
              <p className="text-brand-primary-light mt-0.5 md:mt-1 text-sm">Manually add a potential client</p>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 touch-target" data-testid="add-lead-close">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 md:max-h-[70vh]">
          {error && (
            <div className="mb-5 p-4 bg-red-900/30 border border-red-700/50 rounded-xl flex items-center gap-3 text-red-400 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 p-4 bg-green-900/30 border border-green-700/50 rounded-xl flex items-center gap-3 text-green-400 animate-fade-in">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Lead created successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Cover Image Upload */}
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3 text-[#FAFAFA]">Cover Image</h3>
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={handleCoverImageSelect}
                className="hidden"
                data-testid="cover-image-input"
              />
              {coverImagePreview ? (
                <div className="relative group rounded-xl overflow-hidden border border-[#333]">
                  <img 
                    src={coverImagePreview} 
                    alt="Cover preview" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-all duration-200"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="px-4 py-2 bg-red-600/80 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-brand-primary/50 hover:bg-brand-primary-dark/10 transition-all duration-200"
                  data-testid="cover-image-upload-btn"
                >
                  <div className="p-3 bg-[#262626] rounded-xl">
                    <ImageIcon className="w-6 h-6 text-[#A3A3A3]" />
                  </div>
                  <span className="text-sm text-[#A3A3A3]">Click to upload a cover image</span>
                  <span className="text-xs text-gray-600">JPG, PNG, WebP up to 10MB</span>
                </button>
              )}
            </div>

            {/* Project Type Selector */}
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3 text-[#FAFAFA]">Project Type</h3>
              <InlineHint storageKey="seen_project_type_tip" variant="violet">
                <span className="text-xs"><strong>First project?</strong> Choose the type that matches your workflow. This helps us show you the right tools.</span>
              </InlineHint>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3" data-testid="project-type-selector">
                {PROJECT_TYPE_CONFIG.map(({ type, icon: Icon, desc, color }) => {
                  const selected = formData.projectType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, projectType: type })}
                      data-testid={`project-type-${type.toLowerCase()}`}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        selected
                          ? `border-${color}-500 bg-${color}-500/10`
                          : 'border-[#333] bg-[#0F0F0F] hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 ${selected ? `text-${color}-400` : 'text-[#A3A3A3]'}`} />
                      <div className={`text-sm font-medium ${selected ? 'text-[#FAFAFA]' : 'text-[#A3A3A3]'}`}>
                        {PROJECT_TYPE_LABELS[type]}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">{desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3 text-[#FAFAFA]">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className={labelClass}>Client Name *</label>
                  <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} className={inputClass} placeholder="John Smith" data-testid="add-lead-client-name" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} className={inputClass} placeholder="john@example.com" data-testid="add-lead-email" />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleChange} className={inputClass} placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className={labelClass}>Company</label>
                  <input type="text" name="clientCompany" value={formData.clientCompany} onChange={handleChange} className={inputClass} placeholder="Company Name" />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3 text-[#FAFAFA]">Project Details</h3>
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className={labelClass}>Service Type *</label>
                    <select name="serviceType" value={formData.serviceType} onChange={handleChange} className={inputClass} data-testid="add-lead-service-type">
                      {SERVICE_TYPES.map((type) => (
                        <option key={type} value={type}>{SERVICE_TYPE_LABELS[type]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Industry</label>
                    <select
                      name="industry"
                      value={formData.industry || ''}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value as IndustryType || undefined })}
                      className={inputClass}
                      data-testid="add-lead-industry"
                    >
                      <option value="">Select industry...</option>
                      {(Object.keys(INDUSTRY_TYPE_LABELS) as IndustryType[]).map((ind) => (
                        <option key={ind} value={ind}>{INDUSTRY_TYPE_LABELS[ind]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className={labelClass}>Lead Source</label>
                    <select name="source" value={formData.source} onChange={handleChange} className={inputClass}>
                      {LEAD_SOURCES.map((source) => (
                        <option key={source} value={source}>{source.charAt(0) + source.slice(1).toLowerCase().replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Budget Range</label>
                    <input type="text" name="budget" value={formData.budget} onChange={handleChange} className={inputClass} placeholder="$5,000 - $10,000" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Project Title *</label>
                  <input type="text" name="projectTitle" value={formData.projectTitle} onChange={handleChange} className={inputClass} placeholder="Wedding Photography - June 2026" data-testid="add-lead-project-title" />
                </div>
                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={inputClass + ' resize-none'} placeholder="Tell us about the project..." data-testid="add-lead-description" />
                </div>
                <div>
                  <label className={labelClass}>Timeline</label>
                  <input type="text" name="timeline" value={formData.timeline} onChange={handleChange} className={inputClass} placeholder="Needed by March 2026" />
                </div>
              </div>
            </div>

            {/* Deliverable Type */}
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3 text-[#FAFAFA]">Deliverable Type</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3" data-testid="deliverable-type-selector">
                {DELIVERABLE_CONFIG.map(({ type, icon: Icon, color }) => {
                  const selected = formData.deliverableType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, deliverableType: type })}
                      data-testid={`deliverable-type-${type.toLowerCase().replace('_', '-')}`}
                      className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                        selected
                          ? `border-${color}-500 bg-${color}-500/10`
                          : 'border-[#333] bg-[#0F0F0F] hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${selected ? `text-${color}-400` : 'text-[#A3A3A3]'}`} />
                      <div className={`text-xs font-medium ${selected ? 'text-[#FAFAFA]' : 'text-[#A3A3A3]'}`}>
                        {DELIVERABLE_TYPE_LABELS[type]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Fields */}
            {formData.projectType === 'COMMISSION' && (
              <div className="p-5 bg-amber-900/10 border border-amber-800/30 rounded-xl space-y-4">
                <h4 className="text-sm font-medium text-amber-400">Commission Details</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Dimensions</label>
                    <input type="text" name="dimensions" onChange={handleChange} className={inputClass} placeholder="24x36 inches" />
                  </div>
                  <div>
                    <label className={labelClass}>Material / Medium</label>
                    <input type="text" name="material" onChange={handleChange} className={inputClass} placeholder="Oil on canvas" />
                  </div>
                </div>
              </div>
            )}

            {(formData.deliverableType === 'PHYSICAL_ART' || formData.deliverableType === 'PRINTS') && formData.projectType !== 'COMMISSION' && (
              <div className="p-5 bg-emerald-900/10 border border-emerald-800/30 rounded-xl space-y-4">
                <h4 className="text-sm font-medium text-emerald-400">Physical Deliverable Details</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Dimensions</label>
                    <input type="text" onChange={handleChange} name="dimensions" className={inputClass} placeholder="12x16 inches" />
                  </div>
                  <div>
                    <label className={labelClass}>Material</label>
                    <input type="text" onChange={handleChange} name="material" className={inputClass} placeholder="Glossy photo paper" />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#333]">
              <button type="button" onClick={onClose} className="px-5 md:px-6 py-2.5 text-[#A3A3A3] hover:bg-[#262626] rounded-xl font-medium transition-all duration-200 touch-target">Cancel</button>
              <button 
                type="submit" 
                disabled={loading} 
                className="px-5 md:px-6 py-2.5 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary disabled:opacity-50 flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-brand-primary/20 touch-target" 
                data-testid="add-lead-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadingCover ? 'Uploading image...' : 'Creating...'}
                  </>
                ) : 'Create Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
