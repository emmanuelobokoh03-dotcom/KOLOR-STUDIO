import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Loader2,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { 
  portfolioApi, 
  PortfolioItem, 
  PortfolioCategory, 
  PORTFOLIO_CATEGORY_LABELS 
} from '../services/api'

export default function PublicPortfolio() {
  const { userId } = useParams<{ userId: string }>()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState<{ id: string; name: string; studioName?: string } | null>(null)
  
  // Filters
  const [activeCategory, setActiveCategory] = useState<PortfolioCategory | 'ALL'>('ALL')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  
  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Fetch portfolio
  const fetchPortfolio = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    const result = await portfolioApi.getPublic(userId)
    
    if (result.error) {
      setError(result.message || 'Portfolio not found')
    } else if (result.data) {
      setUserInfo(result.data.user)
      setItems(result.data.portfolio)
      setFilteredItems(result.data.portfolio)
    }
    
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  // Apply filters
  useEffect(() => {
    let filtered = [...items]
    
    if (activeCategory !== 'ALL') {
      filtered = filtered.filter(item => item.category === activeCategory)
    }
    
    if (showFeaturedOnly) {
      filtered = filtered.filter(item => item.featured)
    }
    
    setFilteredItems(filtered)
  }, [items, activeCategory, showFeaturedOnly])

  // Get unique categories from items
  const categories = Array.from(new Set(items.map(item => item.category)))

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = 'auto'
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % filteredItems.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, filteredItems.length])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary-light" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Portfolio Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const currentItem = filteredItems[lightboxIndex]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            {/* Studio Logo/Name */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {userInfo?.studioName || userInfo?.name || 'Portfolio'}
            </h1>
            {userInfo?.studioName && userInfo?.name && (
              <p className="text-gray-400">by {userInfo.name}</p>
            )}
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Explore our creative work and projects
            </p>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      {items.length > 0 && (
        <div className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* All Category */}
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeCategory === 'ALL'
                    ? 'bg-brand-primary text-white'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                All
              </button>
              
              {/* Dynamic Categories */}
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeCategory === cat
                      ? 'bg-brand-primary text-white'
                      : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  {PORTFOLIO_CATEGORY_LABELS[cat]}
                </button>
              ))}
              
              {/* Divider */}
              <div className="w-px h-6 bg-slate-700 mx-2 hidden sm:block" />
              
              {/* Featured Toggle */}
              <button
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                  showFeaturedOnly
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Star className={`w-4 h-4 ${showFeaturedOnly ? 'fill-current' : ''}`} />
                Featured
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {items.length === 0 ? 'Portfolio is Empty' : 'No Items Match Filters'}
            </h2>
            <p className="text-gray-400">
              {items.length === 0 
                ? 'Check back later for creative work samples' 
                : 'Try adjusting your filter selection'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="group relative bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-brand-primary/50 transition-all hover:shadow-lg hover:shadow-brand-primary/10"
                onClick={() => openLightbox(index)}
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                
                {/* Featured Badge */}
                {item.featured && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-yellow-500/90 text-yellow-900 rounded text-xs font-medium">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                  <p className="text-brand-primary-light text-sm mt-1">
                    {PORTFOLIO_CATEGORY_LABELS[item.category]}
                  </p>
                </div>
                
                {/* Bottom Info (always visible) */}
                <div className="p-4 bg-slate-900">
                  <h3 className="text-white font-medium truncate">{item.title}</h3>
                  <span className="text-xs text-brand-primary-light">
                    {PORTFOLIO_CATEGORY_LABELS[item.category]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              Powered by{' '}
              <Link to="/" className="text-brand-primary-light hover:text-brand-primary-light transition">
                KOLOR STUDIO
              </Link>
            </p>
            <div className="flex items-center gap-4">
              <a
                href={`mailto:contact@example.com`}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary text-white rounded-lg transition text-sm font-medium"
              >
                <Mail className="w-4 h-4" />
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxOpen && currentItem && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Previous Button */}
          {filteredItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          {/* Image */}
          <div 
            className="max-w-5xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentItem.imageUrl}
              alt={currentItem.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            
            {/* Info */}
            <div className="text-center mt-4">
              <h2 className="text-xl font-semibold text-white">{currentItem.title}</h2>
              {currentItem.description && (
                <p className="text-gray-400 mt-2 max-w-2xl mx-auto">{currentItem.description}</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary-light rounded-full text-sm">
                  {PORTFOLIO_CATEGORY_LABELS[currentItem.category]}
                </span>
                {currentItem.featured && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </span>
                )}
              </div>
              {currentItem.tags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  {currentItem.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-800 text-gray-400 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Image Counter */}
            <p className="text-center text-gray-500 text-sm mt-4">
              {lightboxIndex + 1} / {filteredItems.length}
            </p>
          </div>
          
          {/* Next Button */}
          {filteredItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
