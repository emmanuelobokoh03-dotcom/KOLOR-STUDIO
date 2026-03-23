/**
 * Analytics utility for KOLOR Studio
 *
 * Uses Vercel Analytics (free, built-in, privacy-focused).
 * Enable in Vercel Dashboard -> Project -> Analytics.
 *
 * Web Vitals (LCP, FID, CLS) are automatically tracked by Vercel.
 * No additional setup required.
 */
import { track as vercelTrack } from '@vercel/analytics';

// =====================
// Core tracking
// =====================

/**
 * Track a custom event via Vercel Analytics.
 * In development, events are logged to the console instead.
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | null>
) {
  if (import.meta.env.DEV) {
    console.log('[Analytics] Event:', eventName, properties);
    return;
  }

  try {
    vercelTrack(eventName, properties ?? {});
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

// Alias used by legacy call-sites
export const track = trackEvent;

// =====================
// Pre-defined event helpers (backward-compatible named exports)
// =====================

// Authentication
export const trackSignup = (method: 'email' | 'google' = 'email') =>
  trackEvent('Signup Completed', { method });

export const trackLogin = (method: 'email' | 'google' = 'email') =>
  trackEvent('Login Success', { method });

export const trackLogout = () => trackEvent('Logout');

// Leads
export const trackLeadCreated = (source?: string, serviceType?: string) =>
  trackEvent('Lead Created', {
    source: source || 'unknown',
    serviceType: serviceType || 'unknown',
  });

export const trackLeadStatusChanged = (from: string, to: string) =>
  trackEvent('Lead Status Changed', { from, to });

export const trackLeadDeleted = () => trackEvent('Lead Deleted');

// Quotes
export const trackQuoteCreated = (value: number, currency: string, itemCount: number) =>
  trackEvent('Quote Created', { value, currency, itemCount });

export const trackQuoteSent = (value: number) => trackEvent('Quote Sent', { value });
export const trackQuoteAccepted = (value: number) => trackEvent('Quote Accepted', { value });
export const trackQuoteDeclined = () => trackEvent('Quote Declined');
export const trackQuoteViewed = () => trackEvent('Quote Viewed');
export const trackQuoteDuplicated = () => trackEvent('Quote Duplicated');
export const trackQuotePDFDownloaded = () => trackEvent('Quote PDF Downloaded');

// Templates
export const trackTemplateCreated = () => trackEvent('Template Created');
export const trackTemplateApplied = () => trackEvent('Template Applied');

// Portal
export const trackPortalLinkShared = () => trackEvent('Portal Link Shared');
export const trackPortalViewed = () => trackEvent('Portal Viewed');
export const trackPortalLinkEmailSent = () => trackEvent('Portal Link Email Sent');

// Files
export const trackFileUploaded = (fileType: string, sizeKB: number) =>
  trackEvent('File Uploaded', { fileType, sizeKB: Math.round(sizeKB) });

export const trackFileDownloaded = () => trackEvent('File Downloaded');
export const trackFileDeleted = () => trackEvent('File Deleted');

// Email
export const trackEmailSent = () => trackEvent('Email Sent');

// Feature Usage
export const trackFeatureUsed = (feature: string) => trackEvent('Feature Used', { feature });
export const trackViewChanged = (view: string) => trackEvent('View Changed', { view });

// Calendar
export const trackCalendarViewed = (viewType: string) =>
  trackEvent('Calendar Viewed', { viewType });

// Settings
export const trackSettingsUpdated = (settingType: string) =>
  trackEvent('Settings Updated', { settingType });

// Inquiry
export const trackInquirySubmitted = (serviceType: string) =>
  trackEvent('Inquiry Submitted', { serviceType });

// =====================
// Convenience object (new-style API)
// =====================
export const analytics = {
  signupCompleted: () => trackEvent('signup_completed'),
  loginCompleted: () => trackEvent('login_completed'),
  leadCreated: (serviceType: string) => trackEvent('lead_created', { serviceType }),
  leadConverted: (leadId: string) => trackEvent('lead_converted', { leadId }),
  quoteCreated: (amount: number) => trackEvent('quote_created', { amount }),
  quoteAccepted: (amount: number) => trackEvent('quote_accepted', { amount }),
  contractSigned: (contractId: string) => trackEvent('contract_signed', { contractId }),
  calendarConnected: () => trackEvent('calendar_connected'),
  meetingBooked: (meetingType: string) => trackEvent('meeting_booked', { meetingType }),
};
