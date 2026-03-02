const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

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
  }) => {
    return request<{ message: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return request<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe: async () => {
    return request<{ user: User }>('/auth/me');
  },
};

// Leads API
export const leadsApi = {
  getAll: async (params?: { status?: string; search?: string; sort?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ leads: Lead[]; count: number }>(`/leads${query}`);
  },

  getStats: async () => {
    return request<{ total: number; statusCounts: Record<string, number>; recentLeads: Lead[] }>('/leads/stats');
  },

  getOne: async (id: string) => {
    return request<{ lead: Lead }>(`/leads/${id}`);
  },

  create: async (leadData: CreateLeadData) => {
    return request<{ message: string; lead: Lead }>('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },

  submit: async (leadData: SubmitLeadData) => {
    return request<{ message: string; leadId: string }>('/portal/submit', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },

  update: async (id: string, updates: Partial<Lead>) => {
    return request<{ message: string; lead: Lead }>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  updateStatus: async (id: string, status: LeadStatus) => {
    return request<{ message: string; lead: Lead }>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/leads/${id}`, {
      method: 'DELETE',
    });
  },

  // Activities
  getActivities: async (leadId: string) => {
    return request<{ activities: Activity[] }>(`/leads/${leadId}/activities`);
  },

  addNote: async (leadId: string, content: string) => {
    return request<{ message: string; activity: Activity }>(`/leads/${leadId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Files
  getFiles: async (leadId: string) => {
    return request<{ files: LeadFile[] }>(`/leads/${leadId}/files`);
  },

  uploadFiles: async (leadId: string, files: File[]) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`${API_URL}/leads/${leadId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
    return request<{ message: string }>(`/files/${fileId}`, {
      method: 'DELETE',
    });
  },

  // Calendar
  getCalendarEvents: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ events: CalendarEvent[] }>(`/leads/calendar/events${query}`);
  },

  // Custom Email
  sendEmail: async (leadId: string, data: { subject: string; body: string; cc?: string; bcc?: string }) => {
    return request<{ message: string }>(`/leads/${leadId}/send-email`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getFileDownloadUrl: async (fileId: string) => {
    return request<{ url: string; filename: string }>(`/files/${fileId}/download`);
  },

  sendPortalLink: async (leadId: string) => {
    return request<{ message: string; sentTo: string }>(`/leads/${leadId}/send-portal-link`, {
      method: 'POST',
    });
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
  // Currency settings
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: 'BEFORE' | 'AFTER';
  numberFormat?: string;
  defaultTaxRate?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

export type ServiceType = 
  | 'PHOTOGRAPHY' 
  | 'VIDEOGRAPHY' 
  | 'GRAPHIC_DESIGN' 
  | 'WEB_DESIGN' 
  | 'BRANDING' 
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
  category: 'image' | 'pdf' | 'document' | 'spreadsheet' | 'text' | 'file';
  url: string;
  uploadedBy: string | null;
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
}

export interface SubmitLeadData {
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
  source?: LeadSource;
  studioId?: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DESIGN: 'Web Design',
  BRANDING: 'Branding',
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
  CONTACTED: 'bg-purple-100 text-purple-800',
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
  VIEWED: 'bg-purple-900/50 text-purple-300 border border-purple-700/50',
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
  // Get all quotes for a lead
  getByLead: async (leadId: string) => {
    return request<{ quotes: Quote[] }>(`/leads/${leadId}/quotes`);
  },

  // Get single quote
  getById: async (quoteId: string) => {
    return request<{ quote: Quote }>(`/quotes/${quoteId}`);
  },

  // Get public quote by token
  getPublic: async (quoteToken: string) => {
    return request<{ quote: Quote }>(`/quotes/public/${quoteToken}`);
  },

  // Create quote
  create: async (leadId: string, data: CreateQuoteData) => {
    return request<{ quote: Quote }>(`/leads/${leadId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update quote
  update: async (quoteId: string, data: Partial<CreateQuoteData>) => {
    return request<{ quote: Quote }>(`/quotes/${quoteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete quote
  delete: async (quoteId: string) => {
    return request<{ message: string }>(`/quotes/${quoteId}`, {
      method: 'DELETE',
    });
  },

  // Send quote to client
  send: async (quoteId: string) => {
    return request<{ message: string; quote: Quote }>(`/quotes/${quoteId}/send`, {
      method: 'POST',
    });
  },

  // Duplicate quote
  duplicate: async (quoteId: string) => {
    return request<{ quote: Quote }>(`/quotes/${quoteId}/duplicate`, {
      method: 'POST',
    });
  },

  // Get quote by public token (public)
  getByToken: async (quoteToken: string) => {
    return request<{ quote: Quote }>(`/quotes/public/${quoteToken}`);
  },

  // Accept quote (public)
  accept: async (quoteToken: string) => {
    return request<{ message: string }>(`/quotes/public/${quoteToken}/accept`, {
      method: 'POST',
    });
  },

  // Decline quote (public)
  decline: async (quoteToken: string, reason?: string) => {
    return request<{ message: string }>(`/quotes/public/${quoteToken}/decline`, {
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
    const token = localStorage.getItem('kolor_token');
    // Create a temporary link to download with auth
    const link = document.createElement('a');
    link.href = `${apiUrl}/quotes/${quoteId}/pdf`;
    link.download = '';
    
    // For authenticated routes, we need to fetch with token
    fetch(`${apiUrl}/quotes/${quoteId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
  // Get user settings
  get: async () => {
    return request<{ settings: UserSettings; availableCurrencies: CurrencyOption[] }>('/settings');
  },

  // Update user settings
  update: async (data: Partial<UserSettings>) => {
    return request<{ message: string; settings: UserSettings }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Get available currencies
  getCurrencies: async () => {
    return request<{ currencies: CurrencyOption[] }>('/settings/currencies');
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
    return request<DashboardAnalytics>('/analytics/dashboard');
  },

  // Get monthly trend data
  getMonthlyTrend: async () => {
    return request<{ trend: MonthlyTrendData[] }>('/analytics/monthly-trend');
  },

  // Get lead source performance
  getLeadSources: async () => {
    return request<{ sources: LeadSourceData[] }>('/analytics/lead-sources');
  },

  // Get pipeline breakdown by status
  getPipelineByStatus: async () => {
    return request<{ pipeline: PipelineStatusData[] }>('/analytics/pipeline-by-status');
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
    return request<{ templates: QuoteTemplate[] }>('/quote-templates');
  },

  // Get single template
  getById: async (templateId: string) => {
    return request<{ template: QuoteTemplate }>(`/quote-templates/${templateId}`);
  },

  // Create template
  create: async (data: CreateQuoteTemplateData) => {
    return request<{ message: string; template: QuoteTemplate }>('/quote-templates', {
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
    return request<{ bookings: Booking[]; count: number }>(`/bookings${query}`);
  },

  // Get calendar events (formatted for react-big-calendar)
  getCalendarEvents: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ events: CalendarBookingEvent[] }>(`/bookings/calendar${query}`);
  },

  // Get single booking
  getOne: async (bookingId: string) => {
    return request<{ booking: Booking }>(`/bookings/${bookingId}`);
  },

  // Create booking
  create: async (data: CreateBookingData) => {
    return request<{ message: string; booking: Booking }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update booking
  update: async (bookingId: string, data: Partial<CreateBookingData> & { status?: BookingStatus }) => {
    return request<{ message: string; booking: Booking }>(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete booking
  delete: async (bookingId: string) => {
    return request<{ message: string }>(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  },

  // Complete booking
  complete: async (bookingId: string) => {
    return request<{ message: string; booking: Booking }>(`/bookings/${bookingId}/complete`, {
      method: 'POST',
    });
  },

  // Cancel booking
  cancel: async (bookingId: string, reason?: string) => {
    return request<{ message: string; booking: Booking }>(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

export default { authApi, leadsApi, quotesApi, settingsApi, analyticsApi, quoteTemplatesApi, bookingsApi };
