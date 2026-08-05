// Handle validation for Community public profiles (iter 286)
// Rules: 3-30 chars, [a-z0-9-]+, no leading/trailing dashes, no consecutive dashes
// Reserved: system routes + brand terms to prevent identity confusion

const RESERVED_HANDLES = new Set([
  'admin', 'kolor', 'help', 'api', 'discover', 'community',
  'creator', 'settings', 'feed', 'studio', 'work', 'about',
  'featured', 'collections', 'digest', 'peers', 'profile',
  'signup', 'login', 'auth', 'legal', 'privacy', 'terms',
  'support', 'contact', 'blog', 'press', 'brand',
]);

const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface HandleValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateHandle(handle: string): HandleValidationResult {
  if (!handle) {
    return { valid: false, reason: 'Handle cannot be empty' };
  }
  const trimmed = handle.trim().toLowerCase();
  if (trimmed.length < 3) {
    return { valid: false, reason: 'Handle must be at least 3 characters' };
  }
  if (trimmed.length > 30) {
    return { valid: false, reason: 'Handle must be at most 30 characters' };
  }
  if (!HANDLE_PATTERN.test(trimmed)) {
    return { valid: false, reason: 'Handle can only contain lowercase letters, numbers, and single dashes' };
  }
  if (RESERVED_HANDLES.has(trimmed)) {
    return { valid: false, reason: 'This handle is reserved' };
  }
  return { valid: true };
}

export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

export function getReservedHandles(): string[] {
  return Array.from(RESERVED_HANDLES).sort();
}
