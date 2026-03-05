import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload,
  X,
  Star,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Plus,
  AlertCircle,
  Check,
  GripVertical
} from 'lucide-react'
import { 
  portfolioApi, 
  PortfolioItem, 
  PortfolioCategory, 
  PORTFOLIO_CATEGORY_LABELS 
} from '../services/api'

interface PortfolioSettingsProps {
  onClose?: () => void;
}

export default function PortfolioSettings({ onClose }: PortfolioSettingsProps) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Upload/Edit modal state
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PortfolioCategory>('PHOTOGRAPHY')
  const [tags, setTags] = useState('')
  const [featured, setFeatured] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Fetch portfolio items
  const fetchItems = useCallback(async () => {
    setLoading(true)
    const result = await portfolioApi.getAll()
    if (result.data?.portfolio) {
      setItems(result.data.portfolio)
    } else {
      setError(result.message || 'Failed to load portfolio')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Reset form
  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('PHOTOGRAPHY')
    setTags('')
    setFeatured(false)
    setImageFile(null)
    setImagePreview(null)
    setModalError('')
    setEditingItem(null)
  }

  // Open modal for new item
  const handleAddNew = () => {
    resetForm()
    setShowModal(true)
  }

  // Open modal for editing
  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description || '')
    setCategory(item.category)
    setTags(item.tags.join(', '))
    setFeatured(item.featured)
    setImagePreview(item.imageUrl)
    setImageFile(null)
    setModalError('')
    setShowModal(true)
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setModalError('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setModalError('Image must be less than 10MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setModalError('')
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-brand-primary', 'bg-brand-primary/10')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-brand-primary', 'bg-brand-primary/10')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-brand-primary', 'bg-brand-primary/10')
    }
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setModalError('Title is required')
      return
    }
    if (!editingItem && !imageFile) {
      setModalError('Image is required')
      return
    }

    setSaving(true)
    setModalError('')

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description.trim())
    formData.append('category', category)
    formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)))
    formData.append('featured', String(featured))
    if (imageFile) {
      formData.append('image', imageFile)
    }

    const result = editingItem
      ? await portfolioApi.update(editingItem.id, formData)
      : await portfolioApi.create(formData)

    setSaving(false)

    if (result.error) {
      setModalError(result.message || 'Failed to save')
      return
    }

    setShowModal(false)
    resetForm()
    fetchItems()
  }

  // Handle delete
  const handleDelete = async (item: PortfolioItem) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return

    const result = await portfolioApi.delete(item.id)
    if (!result.error) {
      fetchItems()
    }
  }

  // Handle toggle featured
  const handleToggleFeatured = async (item: PortfolioItem) => {
    const result = await portfolioApi.toggleFeatured(item.id)
    if (!result.error) {
      fetchItems()
    }
  }

  return (
    <div className="space-y-6" data-testid="portfolio-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Portfolio</h2>
          <p className="text-sm text-gray-400 mt-1">
            Showcase your best work to impress potential clients
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary text-white rounded-lg transition text-sm font-medium"
          data-testid="add-portfolio-btn"
        >
          <Plus className="w-4 h-4" />
          Add Work
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary-light" />
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-slate-700">
          <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Portfolio Items Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Upload your best work to showcase your skills and impress potential clients.
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary text-white rounded-lg transition font-medium"
          >
            <Upload className="w-5 h-5" />
            Upload Your First Work
          </button>
        </div>
      ) : (
        /* Portfolio Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-brand-primary/50 transition"
            >
              {/* Image */}
              <div className="relative aspect-video bg-slate-900">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {/* Featured Badge */}
                {item.featured && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-yellow-500/90 text-yellow-900 rounded text-xs font-medium">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </div>
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                    title="Edit"
                  >
                    <Pencil className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(item)}
                    className={`p-2 rounded-lg transition ${
                      item.featured 
                        ? 'bg-yellow-500/30 hover:bg-yellow-500/50' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                    title={item.featured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    <Star className={`w-5 h-5 ${item.featured ? 'text-yellow-400 fill-current' : 'text-white'}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-300" />
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white truncate">{item.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary-light rounded text-xs">
                    {PORTFOLIO_CATEGORY_LABELS[item.category]}
                  </span>
                  {item.tags.length > 0 && (
                    <span className="text-xs text-gray-500 truncate">
                      +{item.tags.length} tags
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-800 rounded-lg transition text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Error */}
              {modalError && (
                <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {modalError}
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Image {!editingItem && <span className="text-red-400">*</span>}
                </label>
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-primary transition"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImageFile(null)
                          setImagePreview(editingItem?.imageUrl || null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-400 rounded-full"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <p className="text-xs text-gray-400 mt-2">Click to replace image</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF, WebP up to 10MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Summer Wedding Collection"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  data-testid="portfolio-title-input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this work..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PortfolioCategory)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  data-testid="portfolio-category-select"
                >
                  {Object.entries(PORTFOLIO_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., wedding, outdoor, portraits"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="featured" className="text-sm text-gray-300 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Mark as featured
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-800 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition text-sm font-medium disabled:opacity-50"
                data-testid="save-portfolio-btn"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingItem ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
