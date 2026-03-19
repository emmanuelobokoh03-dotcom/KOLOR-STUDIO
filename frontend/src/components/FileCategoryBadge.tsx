import { FolderOpen, Scales, CurrencyDollar, Package, PencilSimple, Archive, File } from '@phosphor-icons/react'

type FileCategory = 'REFERENCE' | 'LEGAL' | 'PAYMENT' | 'DELIVERABLE' | 'REVISION' | 'ASSET' | 'OTHER'

const categoryConfig: Record<FileCategory, { label: string; icon: React.ElementType; classes: string }> = {
  REFERENCE:   { label: 'Reference',   icon: FolderOpen,       classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  LEGAL:       { label: 'Legal',       icon: Scales,           classes: 'bg-red-50 text-red-700 border-red-200' },
  PAYMENT:     { label: 'Payment',     icon: CurrencyDollar,   classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DELIVERABLE: { label: 'Deliverable', icon: Package,          classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  REVISION:    { label: 'Revision',    icon: PencilSimple,     classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  ASSET:       { label: 'Asset',       icon: Archive,          classes: 'bg-slate-50 text-slate-600 border-slate-200' },
  OTHER:       { label: 'Other',       icon: File,             classes: 'bg-gray-50 text-gray-500 border-gray-200' },
}

export default function FileCategoryBadge({ category, size = 'sm' }: { category: string; size?: 'sm' | 'md' }) {
  const config = categoryConfig[category as FileCategory] || categoryConfig.OTHER
  const Icon = config.icon
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full border font-semibold leading-none whitespace-nowrap ${config.classes}`}
      data-testid={`file-category-badge-${category}`}
    >
      <Icon className={iconSize} weight="bold" />
      {config.label}
    </span>
  )
}
