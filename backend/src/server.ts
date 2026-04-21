import dotenv from 'dotenv';
// Load environment variables BEFORE any other imports that read process.env
dotenv.config();

// =====================
// SECRET VALIDATION — fail fast if critical env vars are missing
// =====================
const REQUIRED_SECRETS = ['JWT_SECRET', 'DATABASE_URL', 'FRONTEND_URL'];

(function validateSecrets() {
  const missing = REQUIRED_SECRETS.filter(s => !process.env[s]);
  if (missing.length > 0) {
    console.error(`[STARTUP] ❌ Missing required secrets: ${missing.join(', ')}`);
    console.error('[STARTUP] Set them in .env (dev) or Railway dashboard (prod) and restart.');
    process.exit(1);
  }
  console.log('[STARTUP] ✅ All required secrets present');
})();

import * as Sentry from '@sentry/node';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// =====================
// SENTRY — back-end error tracking (disabled when DSN is absent)
// =====================
const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
  console.log('[Sentry] Initialized (backend)');
}
import morgan from 'morgan';
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';
import activitiesRoutes from './routes/activities';
import filesRoutes from './routes/files';
import messageRoutes from './routes/messages';
import portalRoutes from './routes/portal';
import quotesRoutes from './routes/quotes';
import settingsRoutes from './routes/settings';
import analyticsRoutes from './routes/analytics';
import quoteTemplatesRoutes from './routes/quote-templates';
import bookingsRoutes from './routes/bookings';
import portfolioRoutes from './routes/portfolio';
import workflowTemplatesRoutes from './routes/workflow-templates';
import deliverablesRoutes from './routes/deliverables';
import contractsRoutes from './routes/contracts';
import crmRoutes from './routes/crm';
import testimonialRoutes from './routes/testimonials';
import sequencesRoutes from './routes/sequences';
import webhookRoutes from './routes/webhooks';
import paymentRoutes from './routes/payments';
import { processSequences } from './services/sequenceEngine';
import { apiLimiter, authLimiter, emailLimiter, uploadLimiter, portalLimiter } from './middleware/rateLimiter';
import { ensureBucketExists } from './services/storage';
import digestRoutes from './routes/digest';
import { processOnboardingSequences } from './services/onboardingService';
import { processQuoteFollowUpSequences } from './services/quoteFollowUpService';
import { processScheduledEmails } from './services/scheduledEmailService';
import trackingRoutes from './routes/tracking';
import userRoutes from './routes/user';
import meetingTypesRoutes from './routes/meeting-types';
import availabilityRoutes from './routes/availability';
import publicBookingRoutes, { meetingBookingsRouter } from './routes/public-booking';
import { processMeetingReminders } from './services/meetingReminderService';
import { authMiddleware } from './middleware/auth';
import emailPreviewRoutes from './routes/emailPreview';
import fileCommentRoutes from './routes/fileComments';
import googleCalendarRoutes from './routes/googleCalendar';
import calendarRoutes from './routes/calendar';
import recentActivitiesRoutes from './routes/recentActivities';
import unsubscribeRoutes from './routes/unsubscribe';

// dotenv already loaded at the top of this file

// Initialize Supabase storage bucket
ensureBucketExists().then(success => {
  if (success) {
    console.log('✅ Supabase Storage bucket ready');
  } else {
    console.warn('⚠️ Supabase Storage not configured or bucket creation failed');
  }
});

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy - trust first proxy only (Railway/K8s)
app.set('trust proxy', 1);

// =====================
// SECURITY & PERFORMANCE MIDDLEWARE
// =====================

// Helmet — security headers (CSP, HSTS, X-Frame, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://va.vercel-scripts.com'],
      connectSrc: ["'self'", 'https://va.vercel-scripts.com', process.env.FRONTEND_URL || ''].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: false, // Allow cross-origin images (Supabase storage)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Compression — gzip responses >1KB
app.use(compression({
  level: 6,
  threshold: 1024,
}));

// =====================
// CORS
// =====================

// CORS — environment-specific origin whitelist
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // allow non-browser (Postman, cURL, webhooks)

    const allowed = process.env.NODE_ENV === 'production'
      ? [
          'https://kolorstudio.app',
          'https://www.kolorstudio.app',
          'https://kolor-studio.vercel.app',
          process.env.FRONTEND_URL,
        ]
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          process.env.FRONTEND_URL,
        ];

    // Allow preview/cluster origins in non-production
    const isPreviewOrigin = origin.includes('.preview.emergentagent.com') || origin.includes('.preview.emergentcf.cloud');

    if (allowed.filter(Boolean).includes(origin) || (process.env.NODE_ENV !== 'production' && isPreviewOrigin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhooks need raw body BEFORE JSON parsing (Paystack uses parsed JSON — scoped to /stripe only)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register webhook routes after body parsing so Paystack (JSON) works; Stripe still gets raw via the path-scoped middleware above
app.use('/api/webhooks', webhookRoutes);

// Cookie parsing (for HTTP-only cookie auth)
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Iter 144 — Slow request logger: surfaces any API call slower than 500ms so we can
// spot DB/endpoint regressions in Railway logs without pulling full APM.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api')) return next();
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`[Perf] ⚠️ Slow ${req.method} ${req.path} — ${duration}ms (status ${res.statusCode})`);
    }
  });
  next();
});

// =====================
// ROUTES
// =====================

// Health check — no rate limit
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'KOLOR STUDIO API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Also allow /health without prefix for local testing
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'KOLOR STUDIO API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Rate limiters — applied BEFORE route handlers
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/send-verification', emailLimiter);
app.use('/api/auth/verify-email', emailLimiter);
app.use('/api/auth/forgot-password', emailLimiter);
app.use('/api/files/upload', uploadLimiter);
app.use('/api/portal', portalLimiter);
app.use('/api/book', portalLimiter);
app.use('/api/', apiLimiter); // general limiter last (least restrictive)

// API Routes - all prefixed with /api for K8s ingress routing
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/leads', activitiesRoutes); // Activities: /api/leads/:id/activities
app.use('/api/leads', filesRoutes); // Files: /api/leads/:id/files
app.use('/api/leads', messageRoutes); // Messages: /api/leads/:id/messages
app.use('/api/files', filesRoutes); // Also handle /api/files/:id routes
app.use('/api/files', fileCommentRoutes); // File comments: /api/files/:fileId/comments
app.use('/api/portal', portalRoutes); // Public portal access
app.use('/api/leads', quotesRoutes); // Quotes: /api/leads/:leadId/quotes
app.use('/api/quotes', quotesRoutes); // Quotes: /api/quotes/:quoteId/*
app.use('/api/settings', settingsRoutes); // User settings
app.use('/api/analytics', analyticsRoutes); // Analytics
app.use('/api/quote-templates', quoteTemplatesRoutes); // Quote templates
app.use('/api/bookings', bookingsRoutes); // Bookings
app.use('/api/portfolio', portfolioRoutes); // Portfolio
app.use('/api/workflow-templates', workflowTemplatesRoutes); // Workflow templates
app.use('/api', deliverablesRoutes);
app.use('/api', contractsRoutes); // Deliverables: /api/leads/:leadId/deliverables + /api/deliverables/:id
app.use('/api/crm', crmRoutes); // CRM: /api/crm/*
app.use('/api/testimonials', testimonialRoutes); // Testimonials: /api/testimonials/*
app.use('/api/sequences', sequencesRoutes); // Email sequences: /api/sequences/*
app.use('/api/payments', paymentRoutes); // Payments: /api/payments/*
app.use('/api/digest', digestRoutes); // Digest: /api/digest/*
app.use('/api/track', trackingRoutes); // Email tracking: /api/track/* (public, no auth)
app.use('/api/user', userRoutes); // User account: /api/user/* (GDPR delete)
app.use('/api/meeting-types', meetingTypesRoutes); // Meeting types: /api/meeting-types/*
app.use('/api/availability', availabilityRoutes); // Availability: /api/availability/*
app.use('/api/book', publicBookingRoutes); // Public booking: /api/book/:userId/*
app.use('/api/meeting-bookings', authMiddleware as any, meetingBookingsRouter); // Auth'd meeting bookings
app.use('/api/google-calendar', googleCalendarRoutes); // Google Calendar OAuth + status (auth inside)
app.use('/api/calendar', calendarRoutes); // Calendar events: /api/calendar/*
app.use('/api/activities', recentActivitiesRoutes); // Recent activities: /api/activities/recent
app.use('/api/unsubscribe', unsubscribeRoutes); // Public unsubscribe: /api/unsubscribe/:token (no auth)

// Email preview endpoint (development/staging only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/preview-email', emailPreviewRoutes);
  console.log('📧 Email preview endpoint available at /api/preview-email');
}

// Welcome route - with /api prefix
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'KOLOR STUDIO API',
    version: '1.0.0',
    description: 'The CRM that doesn\'t feel like a CRM - Built for creatives',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      leads: '/api/leads',
      activities: '/api/activities',
      messages: '/api/messages',
      portal: '/api/portal',
    },
  });
});

// Root welcome route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'KOLOR STUDIO API',
    version: '1.0.0',
    description: 'The CRM that doesn\'t feel like a CRM - Built for creatives',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      leads: '/api/leads',
      activities: '/api/activities',
      messages: '/api/messages',
      portal: '/api/portal',
    },
  });
});

// =====================
// ERROR HANDLING
// =====================

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Sentry error handler — must be before the global error handler
if (SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// =====================
// START SERVER
// =====================

app.listen(PORT, () => {
  console.log(`
🚀 KOLOR STUDIO API Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 URL: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Start sequence processor — runs every hour, first run staggered at 5 min post-boot
  const SEQ_INTERVAL = 60 * 60 * 1000; // 1 hour
  setTimeout(() => {
    processSequences().catch(e => console.error('[Seq] Initial run error:', e));
    setInterval(() => {
      processSequences().catch(e => console.error('[Seq] Cron error:', e));
    }, SEQ_INTERVAL);
  }, 5 * 60 * 1000);

  // Client onboarding sequence processor — runs every 6 hours, first run at 7 min post-boot
  const ONBOARDING_INTERVAL = 6 * 60 * 60 * 1000;
  setTimeout(() => {
    processOnboardingSequences().catch(e => console.error('[Onboarding] Initial run error:', e));
    setInterval(() => {
      processOnboardingSequences().catch(e => console.error('[Onboarding] Cron error:', e));
    }, ONBOARDING_INTERVAL);
  }, 7 * 60 * 1000);
  console.log('📨 Client onboarding processor scheduled (every 6 hours)');

  // Quote follow-up sequence processor — runs every 6 hours, first run at 9 min post-boot
  const FOLLOWUP_INTERVAL = 6 * 60 * 60 * 1000;
  setTimeout(() => {
    processQuoteFollowUpSequences().catch(e => console.error('[QuoteFollowUp] Initial run error:', e));
    setInterval(() => {
      processQuoteFollowUpSequences().catch(e => console.error('[QuoteFollowUp] Cron error:', e));
    }, FOLLOWUP_INTERVAL);
  }, 9 * 60 * 1000);
  console.log('💰 Quote follow-up processor scheduled (every 6 hours)');

  // Scheduled email processor (testimonial requests, file review reminders) — every 2 hours, first run at 11 min post-boot
  const SCHEDULED_EMAIL_INTERVAL = 2 * 60 * 60 * 1000;
  setTimeout(() => {
    processScheduledEmails().catch(e => console.error('[ScheduledEmails] Initial run error:', e));
    setInterval(() => {
      processScheduledEmails().catch(e => console.error('[ScheduledEmails] Cron error:', e));
    }, SCHEDULED_EMAIL_INTERVAL);
  }, 11 * 60 * 1000);
  console.log('📬 Scheduled email processor started (every 2 hours)');

  // Meeting reminders — runs every hour, first run at 13 min post-boot
  const MEETING_REMINDER_INTERVAL = 60 * 60 * 1000;
  setTimeout(() => {
    processMeetingReminders().catch(e => console.error('[MeetingReminders] Initial run error:', e));
    setInterval(() => {
      processMeetingReminders().catch(e => console.error('[MeetingReminders] Cron error:', e));
    }, MEETING_REMINDER_INTERVAL);
  }, 13 * 60 * 1000);
  console.log('📅 Meeting reminder processor started (every hour)');

  // node-cron scheduler for daily + weekly automated emails
  if (process.env.NODE_ENV === 'production') {
    const { startScheduler } = require('./scheduler');
    startScheduler();
  } else {
    console.log('[Scheduler] Skipped in development mode. Set NODE_ENV=production to enable.');
  }
});

export default app;
