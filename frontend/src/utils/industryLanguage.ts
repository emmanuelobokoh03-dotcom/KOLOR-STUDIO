export type IndustryType = 'PHOTOGRAPHY' | 'DESIGN' | 'FINE_ART';

export interface IndustryLanguage {
  // Core entity names
  lead: string;
  leads: string;
  newLead: string;
  leadPlaceholderName: string;

  // Quote/proposal names
  quote: string;
  quotes: string;
  newQuote: string;
  quoteVerb: string;

  // Contract names
  contract: string;
  contracts: string;

  // Client names
  client: string;
  clients: string;

  // Booking/project confirmation
  booking: string;
  bookingConfirmed: string;

  // Key date label
  keyDate: string;

  // Discovery call label
  discoveryCall: string;

  // Status stage labels
  stages: {
    inquiry: string;
    discovery: string;
    quoted: string;
    contracted: string;
    completed: string;
  };

  // Fine-grained pipeline stage names (for Kanban column headers)
  pipelineStages: string[];

  // Pipeline stage labels keyed by LeadStatus (for Kanban column headers)
  pipelineStageLabels: Record<string, string>;

  // Dashboard nudge text
  nudgePrefix: string;
  nudgeQuote: string;

  // Empty state headlines
  emptyLeads: string;
  emptyQuotes: string;
  emptyContracts: string;
  emptyCalendar: string;

  // Onboarding checklist steps
  onboardingSteps: {
    addFirstLead: string;
    sendFirstQuote: string;
    getFirstContract: string;
  };

  // Project types for dropdown
  projectTypes: string[];

  // Client portal copy
  portal: {
    greeting: string;
    approveButton: string;
    confirmed: string;
    journeyLabel: string;
  };

  // Email subjects
  email: {
    quoteSent: string;
    contractSent: string;
    bookingConfirmed: string;
    discoveryCallReminder: string;
    followUpNudge: string;
  };

  // Quick actions sub-labels
  quickActions: {
    sendQuoteSub: string;
    addLeadSub: string;
  };
}

export const industryLanguage: Record<IndustryType, IndustryLanguage> = {
  PHOTOGRAPHY: {
    lead: 'Inquiry',
    leads: 'Inquiries',
    newLead: '+ New Inquiry',
    leadPlaceholderName: 'Client name',

    quote: 'Quote',
    quotes: 'Quotes',
    newQuote: '+ New Quote',
    quoteVerb: 'Send a quote',

    contract: 'Booking Agreement',
    contracts: 'Booking Agreements',

    client: 'Client',
    clients: 'Clients',

    booking: 'Booking',
    bookingConfirmed: 'Booking confirmed',

    keyDate: 'Shoot date',

    discoveryCall: 'Discovery call',

    stages: {
      inquiry: 'Inquiry',
      discovery: 'Discovery',
      quoted: 'Quoted',
      contracted: 'Contracted',
      completed: 'Booked',
    },

    pipelineStages: [
      'Inquiry',
      'Discovery Call',
      'Quote Sent',
      'Contract Signed',
      'Deposit Received',
      'Shoot Scheduled',
      'Editing',
      'Gallery Delivered',
      'Complete',
    ],

    pipelineStageLabels: {
      NEW: 'Inquiry',
      CONTACTED: 'Discovery Call',
      QUOTED: 'Quoted',
      NEGOTIATING: 'Negotiating',
      BOOKED: 'Booked',
      REVIEWING: 'Reviewing',
      QUALIFIED: 'Qualified',
      LOST: 'Lost',
    },

    nudgePrefix: 'is waiting on their quote',
    nudgeQuote: 'quote',

    emptyLeads: 'Your first inquiry is one click away',
    emptyQuotes: 'Send your first quote in 2 minutes',
    emptyContracts: 'Get your first booking agreement signed',
    emptyCalendar: 'See all your shoots at a glance',

    onboardingSteps: {
      addFirstLead: 'Add your first inquiry',
      sendFirstQuote: 'Send your first quote',
      getFirstContract: 'Get your first booking agreement signed',
    },

    projectTypes: [
      'Wedding',
      'Portrait',
      'Commercial',
      'Fashion',
      'Editorial',
      'Event',
      'Real Estate',
      'Product',
      'Headshots',
    ],

    portal: {
      greeting: "here's your quote",
      approveButton: 'Approve quote',
      confirmed: "You're booked!",
      journeyLabel: 'Your booking journey',
    },

    email: {
      quoteSent: 'Your quote from [Name] is ready',
      contractSent: 'Please sign your booking agreement',
      bookingConfirmed: 'Your booking is confirmed',
      discoveryCallReminder: 'Your discovery call is tomorrow',
      followUpNudge: 'Still interested in booking?',
    },

    quickActions: {
      sendQuoteSub: 'To an inquiry with no quote yet',
      addLeadSub: 'Start tracking a new inquiry',
    },
  },

  DESIGN: {
    lead: 'Brief',
    leads: 'Briefs',
    newLead: '+ New Brief',
    leadPlaceholderName: 'Client or project name',

    quote: 'Proposal',
    quotes: 'Proposals',
    newQuote: '+ New Proposal',
    quoteVerb: 'Send a proposal',

    contract: 'Statement of Work',
    contracts: 'Statements of Work',

    client: 'Client',
    clients: 'Clients',

    booking: 'Project',
    bookingConfirmed: 'Project confirmed',

    keyDate: 'Deadline',

    discoveryCall: 'Scoping call',

    stages: {
      inquiry: 'Brief received',
      discovery: 'Scoping',
      quoted: 'Proposed',
      contracted: 'Active',
      completed: 'Delivered',
    },

    pipelineStages: [
      'Brief Received',
      'Brief Call',
      'Proposal Sent',
      'Agreement Signed',
      'Deposit Received',
      'In Progress',
      'Client Review',
      'Revisions',
      'Final Delivery',
      'Complete',
    ],

    pipelineStageLabels: {
      NEW: 'Brief',
      CONTACTED: 'Scoping Call',
      QUOTED: 'Proposal Sent',
      NEGOTIATING: 'Revisions',
      BOOKED: 'Signed',
      REVIEWING: 'Reviewing',
      QUALIFIED: 'Qualified',
      LOST: 'Lost',
    },

    nudgePrefix: 'is waiting on their proposal',
    nudgeQuote: 'proposal',

    emptyLeads: 'Add your first project brief',
    emptyQuotes: 'Send your first proposal',
    emptyContracts: 'Get your first statement of work signed',
    emptyCalendar: 'See all your project deadlines',

    onboardingSteps: {
      addFirstLead: 'Add your first brief',
      sendFirstQuote: 'Send your first proposal',
      getFirstContract: 'Get your first statement of work signed',
    },

    projectTypes: [
      'Brand Identity',
      'UI/UX Design',
      'Graphic Design',
      'Web Design',
      'Motion Design',
      'Interior Design',
      'Illustration',
      'Packaging',
      'Print Design',
    ],

    portal: {
      greeting: "here's your proposal",
      approveButton: 'Approve proposal',
      confirmed: 'Project confirmed!',
      journeyLabel: 'Your project journey',
    },

    email: {
      quoteSent: 'Your proposal from [Name]',
      contractSent: 'Please sign your statement of work',
      bookingConfirmed: 'Your project is confirmed',
      discoveryCallReminder: 'Your scoping call is tomorrow',
      followUpNudge: 'Any questions on the proposal?',
    },

    quickActions: {
      sendQuoteSub: 'To a brief with no proposal yet',
      addLeadSub: 'Start tracking a new brief',
    },
  },

  FINE_ART: {
    lead: 'Commission',
    leads: 'Commissions',
    newLead: '+ New Commission',
    leadPlaceholderName: 'Collector or gallery name',

    quote: 'Offer',
    quotes: 'Offers',
    newQuote: '+ New Offer',
    quoteVerb: 'Send an offer',

    contract: 'Commission Agreement',
    contracts: 'Commission Agreements',

    client: 'Collector',
    clients: 'Collectors',

    booking: 'Commission',
    bookingConfirmed: 'Commission in progress',

    keyDate: 'Delivery date',

    discoveryCall: 'Collector conversation',

    stages: {
      inquiry: 'Interest',
      discovery: 'Conversation',
      quoted: 'Offer sent',
      contracted: 'In progress',
      completed: 'Delivered',
    },

    pipelineStages: [
      'Inquiry',
      'Portfolio Review',
      'Commission Scope',
      'Offer Sent',
      'Agreement Signed',
      'Deposit Received',
      'Work In Progress',
      'Collector Review',
      'Final Payment',
      'Delivered',
    ],

    pipelineStageLabels: {
      NEW: 'Inquiry',
      CONTACTED: 'Portfolio Review',
      QUOTED: 'Offer Sent',
      NEGOTIATING: 'Negotiating',
      BOOKED: 'Agreement Signed',
      REVIEWING: 'Reviewing',
      QUALIFIED: 'Qualified',
      LOST: 'Lost',
    },

    nudgePrefix: 'is waiting on their offer',
    nudgeQuote: 'offer',

    emptyLeads: 'Add your first commission inquiry',
    emptyQuotes: 'Send your first offer',
    emptyContracts: 'Get your first commission agreement signed',
    emptyCalendar: 'See your exhibition and delivery dates',

    onboardingSteps: {
      addFirstLead: 'Add your first commission inquiry',
      sendFirstQuote: 'Send your first offer',
      getFirstContract: 'Get your first commission agreement signed',
    },

    projectTypes: [
      'Painting',
      'Sculpture',
      'Print',
      'Mixed Media',
      'Installation',
      'Photography',
      'Digital Art',
      'Textile',
      'Ceramics',
    ],

    portal: {
      greeting: "here's your offer",
      approveButton: 'Accept offer',
      confirmed: 'Commission accepted!',
      journeyLabel: 'Your commission journey',
    },

    email: {
      quoteSent: 'Your offer from [Name]',
      contractSent: 'Please sign your commission agreement',
      bookingConfirmed: 'Your commission is in progress',
      discoveryCallReminder: 'Your collector call is tomorrow',
      followUpNudge: 'Following up on your commission interest',
    },

    quickActions: {
      sendQuoteSub: 'To a collector with no offer yet',
      addLeadSub: 'Start tracking a new commission',
    },
  },
};

export function getIndustryLanguage(industry: IndustryType | string | undefined | null): IndustryLanguage {
  if (industry === 'FINE_ART') return industryLanguage.FINE_ART;
  if (industry === 'DESIGN' ||
      industry === 'GRAPHIC_DESIGN' ||
      industry === 'WEB_DESIGN' ||
      industry === 'ILLUSTRATION' ||
      industry === 'BRANDING') return industryLanguage.DESIGN;
  return industryLanguage.PHOTOGRAPHY;
}
