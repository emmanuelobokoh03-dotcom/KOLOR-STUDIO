const API_URL = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Send HTTP-only cookie
    });

    // Handle 401 — session expired
    if (response.status === 401) {
      // Clean up stale localStorage from migration
      localStorage.removeItem('token');
      return { error: 'Unauthorized', message: 'Authentication required' };
    }

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed', message: data.message };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Network error', message: 'Failed to connect to server' };
  }
}

// Auth API
export const authApi = {
  signup: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    studioName?: string;
    industry?: string;
  }) => {
    return request<{ message: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    return request<{ message: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe: async () => {
    return request<{ user: User }>('/api/auth/me');
  },
  onboarding: async (primaryIndustry: string) => {
    return request<{ message: string; user: any; templates: any[] }>('/api/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify({ primaryIndustry }),
    });
  },
  sendVerification: async () => {
    return request<{ message: string }>('/api/auth/send-verification', {
      method: 'POST',
    });
  },
  verifyEmail: async (token: string) => {
    return request<{ message: string }>(`/api/auth/verify-email/${token}`);
  },
};

// Leads API
export const leadsApi = {
  getAll: async (params?: { status?: string; search?: string; sort?: string; projectType?: string; industry?: string }) => {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString() : '';
    return request<{ leads: Lead[]; count: number }>(`/api/leads${query}`);
  },

  getStats: async () => {
    return request<{ total: number; statusCounts: Record<string, number>; recentLeads: Lead[] }>('/api/leads/stats');
  },

  getOne: async (id: string) => {
    return request<{ lead: Lead }>(`/api/leads/${id}`);
  },

  create: async (leadData: CreateLeadData) => {
    return request<{ message: string; lead: Lead }>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },

  submit: async (leadData: SubmitLeadData) => {
    return request<{ message: string; leadId: string }>('/api/portal/submit', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },

  update: async (id: string, updates: Partial<Lead>) => {
    return request<{ message: string; lead: Lead }>(`/api/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  updateStatus: async (id: string, status: LeadStatus) => {
    return request<{ message: string; lead: Lead }>(`/api/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/api/leads/${id}`, {
      method: 'DELETE',
    });
  },

  // Activities
  getActivities: async (leadId: string) => {
    return request<{ activities: Activity[] }>(`/api/leads/${leadId}/activities`);
  },

  addNote: async (leadId: string, content: string) => {
    return request<{ message: string; activity: Activity }>(`/api/leads/${leadId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Files
  getFiles: async (leadId: string) => {
    return request<{ files: LeadFile[] }>(`/api/leads/${leadId}/files`);
  },

  uploadFiles: async (leadId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}/files`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Upload failed', message: data.message };
      }
      return { data };
    } catch (error) {
      console.error('Upload error:', error);
      return { error: 'Network error', message: 'Failed to upload files' };
    }
  },

  deleteFile: async (fileId: string) => {
    return request<{ message: string }>(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
  },

  // Calendar
  getCalendarEvents: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ events: CalendarEvent[] }>(`/api/leads/calendar/events${query}`);
  },

  // Custom Email
  sendEmail: async (leadId: string, data: { subject: string; body: string; cc?: string; bcc?: string }) => {
    return request<{ message: string }>(`/api/leads/${leadId}/send-email`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getFileDownloadUrl: async (fileId: string) => {
    return request<{ url: string; filename: string }>(`/api/files/${fileId}/download`);
  },

  toggleFileShare: async (fileId: string, shared: boolean) => {
    return request<{ file: { id: string; sharedWithClient: boolean; sharedAt: string | null } }>(`/api/files/${fileId}/share`, {
      method: 'PATCH',
      body: JSON.stringify({ shared }),
    });
  },

  updateFileCategory: async (fileId: string, category: string) => {
    return request<{ file: { id: string; category: string } }>(`/api/files/${fileId}/category`, {
      method: 'PATCH',
      body: JSON.stringify({ category }),
    });
  },

  updateFileReview: async (fileId: string, reviewStatus: string) => {
    return request<{ file: { id: string; reviewStatus: string; reviewedAt: string | null } }>(`/api/files/${fileId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus }),
    });
  },

  getFileComments: async (fileId: string) => {
    return request<{ comments: Array<{ id: string; authorName: string; authorType: string; content: string; createdAt: string }> }>(`/api/files/${fileId}/comments`);
  },

  addFileComment: async (fileId: string, content: string) => {
    return request<{ comment: { id: string; authorName: string; authorType: string; content: string; createdAt: string } }>(`/api/files/${fileId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  deleteFileComment: async (fileId: string, commentId: string) => {
    return request<{ message: string }>(`/api/files/${fileId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  markAsDelivered: async (leadId: string) => {
    return request<{ message: string; filesShared: number; status: string; paymentLinkSent: boolean }>(`/api/leads/${leadId}/mark-delivered`, {
      method: 'POST',
    });
  },

  // Messages
  getMessages: async (leadId: string) => {
    return request<{ messages: Array<{ id: string; content: string; from: 'CLIENT' | 'CREATIVE'; read: boolean; createdAt: string }> }>(`/api/leads/${leadId}/messages`);
  },

  sendMessage: async (leadId: string, content: string) => {
    return request<{ message: { id: string; content: string; from: string; read: boolean; createdAt: string } }>(`/api/leads/${leadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  markMessagesRead: async (leadId: string) => {
    return request<{ message: string }>(`/api/leads/${leadId}/messages/read`, {
      method: 'PATCH',
    });
  },

  getUnreadCounts: async () => {
    return request<{ unreadCounts: Record<string, number> }>('/api/leads/unread-counts/all');
  },

  sendPortalLink: async (leadId: string) => {
    return request<{ message: string; sentTo: string }>(`/api/leads/${leadId}/send-portal-link`, {
      method: 'POST',
    });
  },

  updateDiscoveryCall: async (leadId: string, data: {
    discoveryCallScheduled?: boolean;
    discoveryCallCompletedAt?: string;
    discoveryCallNotes?: string | null;
    discoveryCallBookingId?: string;
  }) => {
    return request<{ lead: Lead }>(`/api/leads/${leadId}/discovery-call`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  uploadCoverImage: async (file: File) => {
    const formData = new FormData();
    formData.append('coverImage', file);

    try {
      const response = await fetch(`${API_URL}/api/leads/upload-cover`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Upload failed', message: data.message };
      }
      return { data };
    } catch (error) {
      console.error('Cover image upload error:', error);
      return { error: 'Network error', message: 'Failed to upload cover image' };
    }
  },
};

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studioName?: string;
  role: string;
  phone?: string;
  website?: string;
  logo?: string;
  timezone?: string;
  primaryIndustry?: IndustryType;
  industry?: 'PHOTOGRAPHY' | 'DESIGN' | 'FINE_ART';
  businessName?: string;
  speciality?: string;
  // Currency settings
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: 'BEFORE' | 'AFTER';
  numberFormat?: string;
  defaultTaxRate?: number;
  // Brand settings
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  brandLogoUrl?: string;
  brandFontFamily?: string;
  // Email verification
  emailVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export type ServiceType = 
  | 'PHOTOGRAPHY' 
  | 'VIDEOGRAPHY' 
  | 'GRAPHIC_DESIGN' 
  | 'WEB_DESIGN' 
  | 'BRANDING' 
  | 'ILLUSTRATION'
  | 'FINE_ART'
  | 'CONTENT_CREATION' 
  | 'CONSULTING' 
  | 'OTHER';

export type LeadStatus = 
  | 'NEW' 
  | 'REVIEWING' 
  | 'CONTACTED' 
  | 'QUALIFIED' 
  | 'QUOTED' 
  | 'NEGOTIATING' 
  | 'BOOKED' 
  | 'LOST';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadSource = 
  | 'WEBSITE' 
  | 'INSTAGRAM' 
  | 'FACEBOOK' 
  | 'REFERRAL' 
  | 'GOOGLE' 
  | 'LINKEDIN' 
  | 'TIKTOK' 
  | 'EMAIL' 
  | 'OTHER';

export type ActivityType = 
  | 'NOTE_ADDED'
  | 'STATUS_CHANGED'
  | 'EMAIL_SENT'
  | 'EMAIL_RECEIVED'
  | 'CALL_MADE'
  | 'CALL_RECEIVED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_COMPLETED'
  | 'FILE_UPLOADED'
  | 'QUOTE_SENT'
  | 'PAYMENT_RECEIVED'
  | 'CONTRACT_SIGNED'
  | 'BOOKING_CREATED'
  | 'BOOKING_UPDATED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED';

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export type PortfolioCategory = 
  | 'PHOTOGRAPHY'
  | 'VIDEOGRAPHY'
  | 'GRAPHIC_DESIGN'
  | 'WEB_DESIGN'
  | 'BRANDING'
  | 'CONTENT_CREATION'
  | 'OTHER';

// Project & Workflow Types
export type ProjectType = 'SERVICE' | 'COMMISSION' | 'PROJECT' | 'PRODUCT_SALE';
export type IndustryType = 'PHOTOGRAPHY' | 'VIDEOGRAPHY' | 'GRAPHIC_DESIGN' | 'WEB_DESIGN' | 'ILLUSTRATION' | 'FINE_ART' | 'SCULPTURE' | 'BRANDING' | 'CONTENT_CREATION' | 'OTHER';
export type DeliverableType = 'DIGITAL_FILES' | 'PHYSICAL_ART' | 'PRINTS' | 'SERVICE' | 'WEBSITE' | 'MIXED';
export type DeliverableStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'SHIPPED';

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  SERVICE: 'Service',
  COMMISSION: 'Commission',
  PROJECT: 'Project',
  PRODUCT_SALE: 'Product Sale',
};

export const INDUSTRY_TYPE_LABELS: Record<IndustryType, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  ILLUSTRATION: 'Illustration',
  FINE_ART: 'Fine Art',
  SCULPTURE: 'Sculpture',
  BRANDING: 'Branding',
  CONTENT_CREATION: 'Content Creation',
  OTHER: 'Other',
};

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  DIGITAL_FILES: 'Digital Files',
  PHYSICAL_ART: 'Physical Art',
  PRINTS: 'Prints',
  SERVICE: 'Service',
  WEBSITE: 'Website',
  MIXED: 'Mixed',
};

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  SHIPPED: 'Shipped',
};

export interface Deliverable {
  id: string;
  name: string;
  type: DeliverableType;
  status: DeliverableStatus;
  description?: string;
  fileUrls: string[];
  dimensions?: string;
  material?: string;
  weight?: string;
  shippingAddress?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  shippedAt?: string;
  sessionDate?: string;
  sessionLocation?: string;
  sessionDuration?: number;
  sessionNotes?: string;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  metadata?: any;
  leadId: string;
  createdAt: string;
  updatedAt: string;
}

export const PORTFOLIO_CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  BRANDING: 'Branding',
  CONTENT_CREATION: 'Content Creation',
  OTHER: 'Other',
};

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  imageUrl: string;
  imagePath?: string;
  category: PortfolioCategory;
  tags: string[];
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  leadId: string;
  startTime: string;
  endTime: string;
  duration: number;
  allDay: boolean;
  title: string;
  location?: string;
  notes?: string;
  status: BookingStatus;
  color?: string;
  reminders?: Array<{ type: string; before: number }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  lead?: {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    projectTitle: string;
    serviceType: ServiceType;
    status: LeadStatus;
    estimatedValue?: number;
    actualValue?: number;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CalendarBookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: {
    bookingId: string;
    leadId: string;
    clientName: string;
    serviceType: ServiceType;
    location?: string;
    notes?: string;
    status: BookingStatus;
    value?: number;
    color?: string;
  };
}

export interface CreateBookingData {
  leadId: string;
  startTime: string;
  endTime: string;
  duration?: number;
  allDay?: boolean;
  title?: string;
  location?: string;
  notes?: string;
  color?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface LeadFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  formattedSize: string;
  category: string;
  categoryDisplay?: string;
  url: string;
  uploadedBy: string | null;
  uploadedByType?: string;
  uploadedByName?: string;
  sharedWithClient?: boolean;
  sharedAt?: string;
  downloadCount?: number;
  requiresReview?: boolean;
  reviewStatus?: string | null;
  reviewedAt?: string | null;
  commentCount?: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  serviceType: ServiceType;
  projectTitle: string;
  description: string;
  budget?: string;
  timeline?: string;
  eventDate?: string;
  status: LeadStatus;
  priority: Priority;
  source: LeadSource;
  estimatedValue?: number;
  tags: string[];
  portalToken?: string;
  portalViews?: number;
  lastPortalView?: string | null;
  projectType?: ProjectType;
  industry?: IndustryType | null;
  deliverableType?: DeliverableType;
  workflowData?: any;
  coverImage?: string | null;
  isDemoData?: boolean;
  pipelineStatus?: string;
  quotesCount?: number;
  contractsCount?: number;
  discoveryCallScheduled?: boolean;
  discoveryCallBookingId?: string | null;
  discoveryCallCompletedAt?: string | null;
  discoveryCallNotes?: string | null;
  keyDate?: string;
  medium?: string;
  dimensions?: string;
  edition?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  serviceType: ServiceType;
  projectTitle: string;
  description: string;
  budget?: string;
  timeline?: string;
  eventDate?: string;
  priority?: Priority;
  source?: LeadSource;
  estimatedValue?: number;
  tags?: string[];
  projectType?: ProjectType;
  industry?: IndustryType;
  deliverableType?: DeliverableType;
  coverImage?: string;
}

export interface SubmitLeadData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  serviceType: ServiceType;
  projectType?: string;
  projectTitle: string;
  description: string;
  budget?: string;
  timeline?: string;
  eventDate?: string;
  source?: LeadSource;
  studioId?: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  BRANDING: 'Branding',
  ILLUSTRATION: 'Illustration',
  FINE_ART: 'Fine Art',
  CONTENT_CREATION: 'Content Creation',
  CONSULTING: 'Consulting',
  OTHER: 'Other',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  REVIEWING: 'Reviewing',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  QUOTED: 'Quoted',
  NEGOTIATING: 'Negotiating',
  BOOKED: 'Booked',
  LOST: 'Lost',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  REVIEWING: 'bg-yellow-100 text-yellow-800',
  CONTACTED: 'bg-brand-primary/10 text-brand-primary-dark',
  QUALIFIED: 'bg-indigo-100 text-indigo-800',
  QUOTED: 'bg-orange-100 text-orange-800',
  NEGOTIATING: 'bg-pink-100 text-pink-800',
  BOOKED: 'bg-green-100 text-green-800',
  LOST: 'bg-gray-100 text-gray-800',
};

// Calendar Types
export interface CalendarEvent {
  id: string;
  leadId: string;
  title: string;
  date: string;
  type: 'event' | 'inquiry' | 'booking';
  status: LeadStatus;
  serviceType?: ServiceType;
  value?: number;
  clientName: string;
}

// Quote Types
export type QuoteStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'VIEWED' 
  | 'ACCEPTED' 
  | 'DECLINED' 
  | 'EXPIRED';

export interface QuoteLineItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  leadId: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  tax: number;
  taxAmount: number;
  total: number;
  paymentTerms: string;
  validUntil: string;
  terms?: string;
  status: QuoteStatus;
  quoteToken: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  // Currency override fields (per-quote)
  currency?: string | null;
  currencySymbol?: string | null;
  currencyPosition?: string | null;
  numberFormat?: string | null;
  // Merged currency settings (from API)
  currencySettings?: {
    currency: string;
    currencySymbol: string;
    currencyPosition: string;
    numberFormat: string;
  };
  lead?: {
    clientName: string;
    clientEmail: string;
    projectTitle: string;
    serviceType?: ServiceType;
    description?: string;
    projectType?: string;
    keyDate?: string;
    eventDate?: string;
  };
  createdBy?: {
    firstName: string;
    lastName: string;
    studioName?: string;
    email: string;
    phone?: string;
    currency?: string;
    currencySymbol?: string;
    currencyPosition?: string;
    numberFormat?: string;
  };
}

export interface CreateQuoteData {
  lineItems: Omit<QuoteLineItem, 'total'>[];
  tax?: number;
  paymentTerms?: string;
  validUntil?: string;
  terms?: string;
  // Currency override for this specific quote
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: string;
  numberFormat?: string;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  DRAFT: 'bg-gray-800/50 text-gray-300 border border-gray-700/50',
  SENT: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  VIEWED: 'bg-brand-primary-dark/50 text-brand-primary-light border border-brand-primary-dark/50',
  ACCEPTED: 'bg-green-900/50 text-green-300 border border-green-700/50',
  DECLINED: 'bg-red-900/50 text-red-300 border border-red-700/50',
  EXPIRED: 'bg-orange-900/50 text-orange-300 border border-orange-700/50',
};

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'FULL_UPFRONT', label: 'Full Payment Upfront' },
  { value: 'DEPOSIT_50', label: '50% Deposit + 50% on Completion' },
  { value: 'DEPOSIT_25', label: '25% Deposit + 75% on Completion' },
  { value: 'NET_30', label: 'Net 30' },
  { value: 'NET_60', label: 'Net 60' },
  { value: 'CUSTOM', label: 'Custom' },
];

export const PAYMENT_TERMS_LABELS: Record<string, string> = {
  FULL_UPFRONT: 'Full Payment Upfront',
  DEPOSIT_50: '50% Deposit + 50% on Completion',
  DEPOSIT_25: '25% Deposit + 75% on Completion',
  NET_30: 'Net 30',
  NET_60: 'Net 60',
  CUSTOM: 'Custom',
};

// Quotes API
export const quotesApi = {
  // Get ALL quotes for current user
  getAll: async () => {
    return request<{ quotes: Quote[] }>('/api/quotes/all');
  },

  // Get all quotes for a lead
  getByLead: async (leadId: string) => {
    return request<{ quotes: Quote[] }>(`/api/leads/${leadId}/quotes`);
  },

  // Get single quote
  getById: async (quoteId: string) => {
    return request<{ quote: Quote }>(`/api/quotes/${quoteId}`);
  },

  // Get public quote by token
  getPublic: async (quoteToken: string) => {
    return request<{ quote: Quote }>(`/api/quotes/public/${quoteToken}`);
  },

  // Create quote
  create: async (leadId: string, data: CreateQuoteData) => {
    return request<{ quote: Quote }>(`/api/leads/${leadId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update quote
  update: async (quoteId: string, data: Partial<CreateQuoteData>) => {
    return request<{ quote: Quote }>(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete quote
  delete: async (quoteId: string) => {
    return request<{ message: string }>(`/api/quotes/${quoteId}`, {
      method: 'DELETE',
    });
  },

  // Send quote to client
  send: async (quoteId: string, emailData?: { subject: string; message: string }) => {
    return request<{ message: string; quote: Quote; emailSent?: boolean; emailError?: string }>(`/api/quotes/${quoteId}/send`, {
      method: 'POST',
      body: emailData ? JSON.stringify(emailData) : undefined,
    });
  },

  // Duplicate quote
  duplicate: async (quoteId: string) => {
    return request<{ quote: Quote }>(`/api/quotes/${quoteId}/duplicate`, {
      method: 'POST',
    });
  },

  // Get quote by public token (public)
  getByToken: async (quoteToken: string) => {
    return request<{ quote: Quote }>(`/api/quotes/public/${quoteToken}`);
  },

  // Accept quote (public)
  accept: async (quoteToken: string) => {
    return request<{ message: string }>(`/api/quotes/public/${quoteToken}/accept`, {
      method: 'POST',
    });
  },

  // Decline quote (public)
  decline: async (quoteToken: string, reason?: string) => {
    return request<{ message: string }>(`/api/quotes/public/${quoteToken}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Download quote as PDF (public - by token)
  downloadPdfByToken: (quoteToken: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    window.open(`${apiUrl}/quotes/public/${quoteToken}/pdf`, '_blank');
  },

  // Download quote as PDF (authenticated - by id)
  downloadPdf: (quoteId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const link = document.createElement('a');
    link.href = `${apiUrl}/quotes/${quoteId}/pdf`;
    link.download = '';
    
    fetch(`${apiUrl}/quotes/${quoteId}/pdf`, {
      credentials: 'include',
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => console.error('PDF download failed:', err));
  },
};

// Settings API
export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export interface UserSettings {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studioName?: string;
  phone?: string;
  website?: string;
  timezone?: string;
  currency: string;
  currencySymbol: string;
  currencyPosition: string;
  numberFormat: string;
  defaultTaxRate: number;
}

export const settingsApi = {
  get: async () => {
    return request<{ settings: UserSettings; availableCurrencies: CurrencyOption[] }>('/api/settings');
  },
  update: async (data: Partial<UserSettings>) => {
    return request<{ message: string; settings: UserSettings }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  getCurrencies: async () => {
    return request<{ currencies: CurrencyOption[] }>('/api/settings/currencies');
  },
  getBrand: async () => {
    return request<{ brand: { primaryColor: string; accentColor: string; logoUrl: string | null; fontFamily: string } }>('/api/settings/brand');
  },
  updateBrand: async (data: { primaryColor?: string; accentColor?: string; fontFamily?: string }) => {
    return request<{ message: string; brand: { primaryColor: string; accentColor: string; logoUrl: string | null; fontFamily: string } }>('/api/settings/brand', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  uploadBrandLogo: async (formData: FormData) => {
    const res = await fetch(`${API_URL}/api/settings/brand/logo`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return res.json();
  },
  deleteBrandLogo: async () => {
    return request<{ message: string }>('/api/settings/brand/logo', { method: 'DELETE' });
  },
};

// Analytics API
export interface DashboardAnalytics {
  overview: {
    pipelineValue: number;
    bookedThisMonth: {
      value: number;
      count: number;
      monthName: string;
      changePercent: number;
    };
    bookedThisYear: {
      value: number;
      count: number;
      year: number;
    };
    totalBooked: {
      value: number;
      count: number;
    };
    conversionRate: number;
  };
  metrics: {
    avgDealSize: number;
    avgTimeToClose: number;
    activeLeads: number;
    winRate: number;
    totalLeads: number;
  };
  updatedAt: string;
}

export interface MonthlyTrendData {
  month: string;
  monthKey: string;
  count: number;
  revenue: number;
}

export interface LeadSourceData {
  source: string;
  sourceLabel: string;
  totalLeads: number;
  bookedLeads: number;
  conversionRate: number;
  revenue: number;
}

export interface PipelineStatusData {
  status: string;
  label: string;
  color: string;
  order: number;
  count: number;
  value: number;
}

export const analyticsApi = {
  // Get dashboard analytics
  getDashboard: async () => {
    return request<DashboardAnalytics>('/api/analytics/dashboard');
  },

  // Get monthly trend data
  getMonthlyTrend: async () => {
    return request<{ trend: MonthlyTrendData[] }>('/api/analytics/monthly-trend');
  },

  // Get lead source performance
  getLeadSources: async () => {
    return request<{ sources: LeadSourceData[] }>('/api/analytics/lead-sources');
  },

  // Get pipeline breakdown by status
  getPipelineByStatus: async () => {
    return request<{ pipeline: PipelineStatusData[] }>('/api/analytics/pipeline-by-status');
  },
};

// Quote Template Types
export interface QuoteTemplateLineItem {
  description: string;
  quantity: number;
  price: number;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  lineItems: QuoteTemplateLineItem[];
  paymentTerms: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteTemplateData {
  name: string;
  description?: string;
  lineItems: QuoteTemplateLineItem[];
  paymentTerms?: string;
  terms?: string;
}

// Quote Templates API
export const quoteTemplatesApi = {
  // Get all templates
  getAll: async () => {
    return request<{ templates: QuoteTemplate[] }>('/api/quote-templates');
  },

  // Get single template
  getById: async (templateId: string) => {
    return request<{ template: QuoteTemplate }>(`/quote-templates/${templateId}`);
  },

  // Create template
  create: async (data: CreateQuoteTemplateData) => {
    return request<{ message: string; template: QuoteTemplate }>('/api/quote-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update template
  update: async (templateId: string, data: Partial<CreateQuoteTemplateData>) => {
    return request<{ message: string; template: QuoteTemplate }>(`/quote-templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete template
  delete: async (templateId: string) => {
    return request<{ message: string }>(`/quote-templates/${templateId}`, {
      method: 'DELETE',
    });
  },
};

// Bookings API
export const bookingsApi = {
  // Get all bookings
  getAll: async (params?: { start?: string; end?: string; status?: string; leadId?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ bookings: Booking[]; count: number }>(`/api/bookings${query}`);
  },

  // Get calendar events (formatted for react-big-calendar)
  getCalendarEvents: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ events: CalendarBookingEvent[] }>(`/api/bookings/calendar${query}`);
  },

  // Get single booking
  getOne: async (bookingId: string) => {
    return request<{ booking: Booking }>(`/api/bookings/${bookingId}`);
  },

  // Create booking
  create: async (data: CreateBookingData) => {
    return request<{ message: string; booking: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update booking
  update: async (bookingId: string, data: Partial<CreateBookingData> & { status?: BookingStatus }) => {
    return request<{ message: string; booking: Booking }>(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete booking
  delete: async (bookingId: string) => {
    return request<{ message: string }>(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  },

  // Complete booking
  complete: async (bookingId: string) => {
    return request<{ message: string; booking: Booking }>(`/api/bookings/${bookingId}/complete`, {
      method: 'POST',
    });
  },

  // Cancel booking
  cancel: async (bookingId: string, reason?: string) => {
    return request<{ message: string; booking: Booking }>(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Portfolio API
export const portfolioApi = {
  // Get all portfolio items
  getAll: async (params?: { category?: string; featured?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ portfolio: PortfolioItem[]; count: number }>(`/api/portfolio${query}`);
  },

  // Get public portfolio
  getPublic: async (userId: string, params?: { category?: string; featured?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ user: { id: string; firstName: string; lastName: string; name: string; studioName?: string; businessName?: string; speciality?: string; industry?: string; brandPrimaryColor?: string; brandAccentColor?: string; brandFontFamily?: string; brandLogoUrl?: string }; portfolio: PortfolioItem[]; count: number }>(`/api/portfolio/public/${userId}${query}`);
  },

  // Get single item
  getOne: async (id: string) => {
    return request<{ item: PortfolioItem }>(`/api/portfolio/${id}`);
  },

  // Create portfolio item with image
  create: async (formData: FormData) => {
    const response = await fetch(`${API_URL}/api/portfolio`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: true, message: data.message || 'Failed to create portfolio item', data: null };
    }
    return { error: false, message: data.message, data };
  },

  // Update portfolio item
  update: async (id: string, formData: FormData) => {
    const response = await fetch(`${API_URL}/api/portfolio/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: true, message: data.message || 'Failed to update portfolio item', data: null };
    }
    return { error: false, message: data.message, data };
  },

  // Delete portfolio item
  delete: async (id: string) => {
    return request<{ message: string }>(`/api/portfolio/${id}`, {
      method: 'DELETE',
    });
  },

  // Toggle featured status
  toggleFeatured: async (id: string) => {
    return request<{ message: string; item: PortfolioItem }>(`/api/portfolio/${id}/featured`, {
      method: 'PATCH',
    });
  },

  // Reorder items
  reorder: async (items: Array<{ id: string; order: number }>) => {
    return request<{ message: string }>('/api/portfolio/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  },
};

// Deliverables API
export const deliverablesApi = {
  getForLead: async (leadId: string) => {
    return request<{ deliverables: Deliverable[]; count: number }>(`/api/leads/${leadId}/deliverables`);
  },
  create: async (leadId: string, data: Partial<Deliverable>) => {
    return request<{ message: string; deliverable: Deliverable }>(`/api/leads/${leadId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getOne: async (id: string) => {
    return request<{ deliverable: Deliverable }>(`/api/deliverables/${id}`);
  },
  update: async (id: string, data: Partial<Deliverable>) => {
    return request<{ message: string; deliverable: Deliverable }>(`/api/deliverables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (id: string, status: DeliverableStatus) => {
    return request<{ message: string; deliverable: Deliverable }>(`/api/deliverables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  delete: async (id: string) => {
    return request<{ message: string }>(`/api/deliverables/${id}`, {
      method: 'DELETE',
    });
  },
};

// =====================
// CONTRACTS
// =====================

export type ContractType = 'PHOTOGRAPHY_SHOOT' | 'PORTRAIT_COMMISSION' | 'LOGO_DESIGN' | 'WEB_DESIGN' | 'GENERAL_SERVICE' | 'CUSTOM';
export type ContractStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'AGREED';

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  PHOTOGRAPHY_SHOOT: 'Photography Shoot',
  PORTRAIT_COMMISSION: 'Art Commission',
  LOGO_DESIGN: 'Design Project',
  WEB_DESIGN: 'Web Design',
  GENERAL_SERVICE: 'General Service',
  CUSTOM: 'Custom',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  AGREED: 'Signed',
};

export interface Contract {
  id: string;
  leadId: string;
  templateType: ContractType;
  title: string;
  content: string;
  clientAgreed: boolean;
  clientAgreedAt?: string;
  clientIP?: string;
  status: ContractStatus;
  sentAt?: string;
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    clientName: string;
    clientEmail: string;
    projectTitle: string;
    portalToken?: string;
    serviceType?: string;
    projectType?: string;
    eventDate?: string;
    keyDate?: string;
  };
}

export interface ContractTemplate {
  type: string;
  title: string;
  label: string;
}

export const contractsApi = {
  getAll: async () => {
    return request<{ contracts: Contract[] }>('/api/contracts/all');
  },
  getPending: async () => {
    return request<{ contracts: Contract[] }>('/api/contracts/pending');
  },
  getTemplates: async () => {
    return request<{ templates: ContractTemplate[] }>('/api/contracts/templates/list');
  },
  getForLead: async (leadId: string) => {
    return request<{ contracts: Contract[] }>(`/api/leads/${leadId}/contracts`);
  },
  create: async (leadId: string, data: { templateType: string; title?: string; content?: string }) => {
    return request<{ contract: Contract }>(`/api/leads/${leadId}/contracts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getOne: async (id: string) => {
    return request<{ contract: Contract }>(`/api/contracts/${id}`);
  },
  update: async (id: string, data: { title?: string; content?: string }) => {
    return request<{ contract: Contract }>(`/api/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return request<{ message: string }>(`/api/contracts/${id}`, {
      method: 'DELETE',
    });
  },
  send: async (id: string, emailData?: { subject: string; message: string }) => {
    return request<{ contract: Contract }>(`/api/contracts/${id}/send`, {
      method: 'POST',
      body: emailData ? JSON.stringify(emailData) : undefined,
    });
  },
  agree: async (id: string, portalToken: string) => {
    return request<{ success: boolean; celebration: boolean; contract: { id: string; status: string; clientAgreedAt: string } }>(`/api/contracts/${id}/agree`, {
      method: 'POST',
      body: JSON.stringify({ portalToken }),
    });
  },
};

// ===== PAYMENTS API =====
export const paymentsApi = {
  createDepositCheckout: async (incomeId: string) => {
    const originUrl = window.location.origin;
    return request<{ url: string; sessionId: string; depositAmount: number }>(`/api/payments/${incomeId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ originUrl }),
    });
  },
  createFinalCheckout: async (incomeId: string) => {
    const originUrl = window.location.origin;
    return request<{ url: string; sessionId: string; finalAmount: number }>(`/api/payments/${incomeId}/final`, {
      method: 'POST',
      body: JSON.stringify({ originUrl }),
    });
  },
  getStatus: async (incomeId: string) => {
    return request<{
      status: string;
      amount: number;
      depositAmount: number | null;
      depositPaid: boolean;
      depositPaidAt: string | null;
      finalAmount: number | null;
      finalPaid: boolean;
      finalPaidAt: string | null;
      paymentMethod: string | null;
    }>(`/api/payments/${incomeId}/status`);
  },
  checkSession: async (sessionId: string) => {
    return request<{
      status: string;
      payment_status: string;
      amount_total: number;
      currency: string;
    }>(`/api/payments/session/${sessionId}/status`);
  },
  getByQuote: async (quoteId: string) => {
    return request<{
      incomeId: string;
      status: string;
      amount: number;
      depositAmount: number | null;
      depositPaid: boolean;
      depositPaidAt: string | null;
      finalAmount: number | null;
      finalPaid: boolean;
      finalPaidAt: string | null;
      paymentMethod: string | null;
    }>(`/api/payments/by-quote/${quoteId}`);
  },
};


// ========================
// MEETING BOOKING SYSTEM
// ========================

export interface MeetingType {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  color: string;
  location?: string | null;
  isActive: boolean;
  order: number;
  bufferBefore: number;
  bufferAfter: number;
  maxPerDay?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface MeetingBooking {
  id: string;
  meetingTypeId: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientNotes?: string | null;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  meetingType?: { name: string; duration: number; color: string; location?: string | null };
  createdAt: string;
}

export const meetingTypesApi = {
  getAll: async () => {
    return request<{ meetingTypes: MeetingType[] }>('/api/meeting-types');
  },
  create: async (data: { name: string; description?: string; duration: number; color?: string; location?: string; bufferBefore?: number; bufferAfter?: number; maxPerDay?: number | null }) => {
    return request<{ message: string; meetingType: MeetingType }>('/api/meeting-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<MeetingType>) => {
    return request<{ message: string; meetingType: MeetingType }>(`/api/meeting-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return request<{ message: string }>(`/api/meeting-types/${id}`, {
      method: 'DELETE',
    });
  },
};

export const availabilityApi = {
  get: async () => {
    return request<{ availability: AvailabilitySlot[] }>('/api/availability');
  },
  save: async (slots: { dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean }[]) => {
    return request<{ message: string; availability: AvailabilitySlot[] }>('/api/availability', {
      method: 'PUT',
      body: JSON.stringify({ slots }),
    });
  },
};

export const publicBookingApi = {
  getPageData: async (userId: string) => {
    return request<{
      user: { id: string; firstName: string; lastName: string; studioName?: string | null; brandPrimaryColor: string; brandAccentColor: string; brandLogoUrl?: string | null; timezone: string };
      meetingTypes: { id: string; name: string; description?: string | null; duration: number; color: string; location?: string | null }[];
    }>(`/api/book/${userId}`);
  },
  getSlots: async (userId: string, meetingTypeId: string, date: string) => {
    return request<{ slots: string[]; date: string; calendarSynced?: boolean; meetingType: { name: string; duration: number } }>(`/api/book/${userId}/${meetingTypeId}/slots?date=${date}`);
  },
  createBooking: async (userId: string, meetingTypeId: string, data: { clientName: string; clientEmail: string; clientPhone?: string; clientNotes?: string; startTime: string }) => {
    return request<{ message: string; booking: { id: string; meetingType: string; startTime: string; endTime: string; status: string } }>(`/api/book/${userId}/${meetingTypeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const meetingBookingsApi = {
  getAll: async (params?: { status?: string; upcoming?: boolean }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return request<{ bookings: MeetingBooking[] }>(`/api/meeting-bookings${query}`);
  },
  cancel: async (id: string, reason?: string) => {
    return request<{ message: string; booking: MeetingBooking }>(`/api/meeting-bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },
};


// Calendar Page Types
export interface CalendarDerivedEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  allDay: boolean;
  type: 'key_date' | 'event_date' | 'shooting' | 'delivery' | 'editing_deadline' | 'booking' | 'quote_expiry' | 'contract' | 'manual' | 'google';
  color: string;
  leadId?: string | null;
  clientName?: string;
  notes?: string | null;
  location?: string | null;
  description?: string | null;
  meta?: Record<string, any>;
}

export const calendarApi = {
  getEvents: async (start: string, end: string) => {
    return request<{ events: CalendarDerivedEvent[] }>(`/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  },
  getGoogleEvents: async (start: string, end: string) => {
    return request<{ connected: boolean; events: CalendarDerivedEvent[]; error?: string }>(`/api/calendar/google-events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  },
  createEvent: async (data: { title: string; date: string; startTime?: string; endTime?: string; allDay?: boolean; notes?: string; eventType?: string; leadId?: string }) => {
    return request<{ event: CalendarDerivedEvent; googleSynced: boolean }>('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteEvent: async (id: string) => {
    return request<{ success: boolean }>(`/api/calendar/events/${id}`, { method: 'DELETE' });
  },
};

export default { authApi, leadsApi, quotesApi, settingsApi, analyticsApi, quoteTemplatesApi, bookingsApi, portfolioApi, deliverablesApi, contractsApi, paymentsApi, meetingTypesApi, availabilityApi, publicBookingApi, meetingBookingsApi, calendarApi };
