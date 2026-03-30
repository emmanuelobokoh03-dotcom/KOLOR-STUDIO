/**
 * Backend industry language utility — mirrors frontend/src/utils/industryLanguage.ts
 * Provides industry-specific terminology for email templates.
 */

export type IndustryType = 'PHOTOGRAPHY' | 'DESIGN' | 'FINE_ART';

export interface IndustryLang {
  lead: string;
  leads: string;
  quote: string;
  quotes: string;
  contract: string;
  contracts: string;
  booking: string;
  bookingConfirmed: string;
  keyDate: string;
  discoveryCall: string;
  inquiry: string;
}

const LANG: Record<IndustryType, IndustryLang> = {
  PHOTOGRAPHY: {
    lead: 'Lead', leads: 'Leads',
    quote: 'Quote', quotes: 'Quotes',
    contract: 'Booking Agreement', contracts: 'Booking Agreements',
    booking: 'Booking', bookingConfirmed: "You're Booked!",
    keyDate: 'Shoot Date', discoveryCall: 'Discovery Call',
    inquiry: 'Inquiry',
  },
  DESIGN: {
    lead: 'Project Inquiry', leads: 'Project Inquiries',
    quote: 'Proposal', quotes: 'Proposals',
    contract: 'Project Agreement', contracts: 'Project Agreements',
    booking: 'Project', bookingConfirmed: 'Project Confirmed!',
    keyDate: 'Deadline', discoveryCall: 'Project Call',
    inquiry: 'Project Inquiry',
  },
  FINE_ART: {
    lead: 'Commission Request', leads: 'Commission Requests',
    quote: 'Offer', quotes: 'Offers',
    contract: 'Commission Agreement', contracts: 'Commission Agreements',
    booking: 'Commission', bookingConfirmed: 'Commission Accepted!',
    keyDate: 'Delivery Date', discoveryCall: 'Consultation Call',
    inquiry: 'Commission Request',
  },
};

export function getIndustryLanguage(industry?: string | null): IndustryLang {
  return LANG[(industry as IndustryType)] || LANG.PHOTOGRAPHY;
}
