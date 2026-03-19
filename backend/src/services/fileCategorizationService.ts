import { FileCategory } from '@prisma/client';

/**
 * Auto-categorize files based on filename and mime type
 */
export function categorizeFile(filename: string, mimeType: string): FileCategory {
  const lowerName = filename.toLowerCase();

  // LEGAL: Contracts, agreements, releases
  if (
    lowerName.includes('contract') ||
    lowerName.includes('agreement') ||
    lowerName.includes('release') ||
    lowerName.includes('terms') ||
    lowerName.includes('legal') ||
    lowerName.includes('signed')
  ) {
    return 'LEGAL';
  }

  // PAYMENT: Invoices, receipts, payment confirmations
  if (
    lowerName.includes('invoice') ||
    lowerName.includes('receipt') ||
    lowerName.includes('payment') ||
    lowerName.includes('deposit') ||
    lowerName.includes('transaction')
  ) {
    return 'PAYMENT';
  }

  // REFERENCE: Mood boards, inspiration, style guides
  if (
    lowerName.includes('mood') ||
    lowerName.includes('inspiration') ||
    lowerName.includes('reference') ||
    lowerName.includes('style') ||
    lowerName.includes('guide') ||
    lowerName.includes('example') ||
    lowerName.includes('inspo')
  ) {
    return 'REFERENCE';
  }

  // REVISION: Feedback, revision requests
  if (
    lowerName.includes('revision') ||
    lowerName.includes('feedback') ||
    lowerName.includes('changes') ||
    lowerName.includes('edit') ||
    lowerName.includes('v2') ||
    lowerName.includes('v3') ||
    /rev\d+/.test(lowerName)
  ) {
    return 'REVISION';
  }

  // DELIVERABLE: Final work based on keywords or rich media
  if (
    lowerName.includes('final') ||
    lowerName.includes('delivery') ||
    lowerName.includes('proof') ||
    lowerName.includes('preview')
  ) {
    return 'DELIVERABLE';
  }

  // ASSET: Source files, archives
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed' ||
    lowerName.endsWith('.psd') ||
    lowerName.endsWith('.ai') ||
    lowerName.endsWith('.sketch') ||
    lowerName.endsWith('.fig') ||
    lowerName.includes('source') ||
    lowerName.includes('raw')
  ) {
    return 'ASSET';
  }

  return 'OTHER';
}

/** Human-readable category name */
export function getCategoryDisplayName(category: FileCategory): string {
  const names: Record<FileCategory, string> = {
    REFERENCE: 'Reference Material',
    LEGAL: 'Legal Document',
    PAYMENT: 'Payment Document',
    DELIVERABLE: 'Project Deliverable',
    REVISION: 'Revision Request',
    ASSET: 'Source Asset',
    OTHER: 'Other',
  };
  return names[category];
}

/** Category color for UI / emails */
export function getCategoryColor(category: FileCategory): string {
  const colors: Record<FileCategory, string> = {
    REFERENCE: '#3B82F6',
    LEGAL: '#EF4444',
    PAYMENT: '#10B981',
    DELIVERABLE: '#7C3AED',
    REVISION: '#F59E0B',
    ASSET: '#6B7280',
    OTHER: '#9CA3AF',
  };
  return colors[category];
}
