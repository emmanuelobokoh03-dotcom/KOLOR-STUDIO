import { track as vercelTrack } from '@vercel/analytics';

// Check if analytics consent was given
const hasAnalyticsConsent = (): boolean => {
  const consent = localStorage.getItem('analytics_consent');
  return consent === 'true';
};

// Wrapper for track that respects cookie consent
export const track = (
  eventName: string,
  properties?: Record<string, string | number | boolean | null>
): void => {
  // Only track if user has given analytics consent
  if (!hasAnalyticsConsent()) {
    return;
  }

  // Clean properties - remove any potential PII
  const cleanProperties = properties ? sanitizeProperties(properties) : undefined;

  try {
    vercelTrack(eventName, cleanProperties);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

// Remove any potential PII from properties
const sanitizeProperties = (
  properties: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> => {
  const sanitized: Record<string, string | number | boolean | null> = {};
  
  // List of keys that might contain PII - we'll skip these
  const piiKeys = ['email', 'name', 'phone', 'address', 'clientName', 'clientEmail'];
  
  for (const [key, value] of Object.entries(properties)) {
    // Skip PII fields
    if (piiKeys.some(piiKey => key.toLowerCase().includes(piiKey.toLowerCase()))) {
      continue;
    }
    
    // Skip if value looks like an email
    if (typeof value === 'string' && value.includes('@')) {
      continue;
    }
    
    sanitized[key] = value;
  }
  
  return sanitized;
};

// Pre-defined event tracking functions for consistency

// Authentication Events
export const trackSignup = (method: 'email' | 'google' = 'email') => {
  track('Signup Completed', { method });
};

export const trackLogin = (method: 'email' | 'google' = 'email') => {
  track('Login Success', { method });
};

export const trackLogout = () => {
  track('Logout');
};

// Lead Events
export const trackLeadCreated = (source?: string, serviceType?: string) => {
  track('Lead Created', {
    source: source || 'unknown',
    serviceType: serviceType || 'unknown',
  });
};

export const trackLeadStatusChanged = (fromStatus: string, toStatus: string) => {
  track('Lead Status Changed', {
    from: fromStatus,
    to: toStatus,
  });
};

export const trackLeadDeleted = () => {
  track('Lead Deleted');
};

// Quote Events
export const trackQuoteCreated = (value: number, currency: string, itemCount: number) => {
  track('Quote Created', {
    value,
    currency,
    itemCount,
  });
};

export const trackQuoteSent = (value: number) => {
  track('Quote Sent', { value });
};

export const trackQuoteAccepted = (value: number) => {
  track('Quote Accepted', { value });
};

export const trackQuoteDeclined = () => {
  track('Quote Declined');
};

export const trackQuoteViewed = () => {
  track('Quote Viewed');
};

export const trackQuoteDuplicated = () => {
  track('Quote Duplicated');
};

export const trackQuotePDFDownloaded = () => {
  track('Quote PDF Downloaded');
};

// Template Events
export const trackTemplateCreated = () => {
  track('Template Created');
};

export const trackTemplateApplied = () => {
  track('Template Applied');
};

// Portal Events
export const trackPortalLinkShared = () => {
  track('Portal Link Shared');
};

export const trackPortalViewed = () => {
  track('Portal Viewed');
};

export const trackPortalLinkEmailSent = () => {
  track('Portal Link Email Sent');
};

// File Events
export const trackFileUploaded = (fileType: string, sizeKB: number) => {
  track('File Uploaded', {
    fileType,
    sizeKB: Math.round(sizeKB),
  });
};

export const trackFileDownloaded = () => {
  track('File Downloaded');
};

export const trackFileDeleted = () => {
  track('File Deleted');
};

// Email Events
export const trackEmailSent = () => {
  track('Email Sent');
};

// Feature Usage Events
export const trackFeatureUsed = (feature: string) => {
  track('Feature Used', { feature });
};

export const trackViewChanged = (view: string) => {
  track('View Changed', { view });
};

// Calendar Events
export const trackCalendarViewed = (viewType: string) => {
  track('Calendar Viewed', { viewType });
};

// Settings Events
export const trackSettingsUpdated = (settingType: string) => {
  track('Settings Updated', { settingType });
};

// Inquiry Form Events
export const trackInquirySubmitted = (serviceType: string) => {
  track('Inquiry Submitted', { serviceType });
};
