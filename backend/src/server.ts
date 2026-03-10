import dotenv from 'dotenv';
// Load environment variables BEFORE any other imports that read process.env
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
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
import cron from 'node-cron';
import { generateDigestForUser, getAllUsersForDigest } from './services/digestService';
import { sendWeeklyDigestEmail } from './services/email';
import { processOnboardingSequences } from './services/onboardingService';

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

// Enable trust proxy - required for Railway/production proxy headers
app.set('trust proxy', true);

// =====================
// MIDDLEWARE
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

// Stripe webhooks need raw body BEFORE JSON parsing
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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
app.use('/api/', apiLimiter); // general limiter last (least restrictive)

// API Routes - all prefixed with /api for K8s ingress routing
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/leads', activitiesRoutes); // Activities: /api/leads/:id/activities
app.use('/api/leads', filesRoutes); // Files: /api/leads/:id/files
app.use('/api/leads', messageRoutes); // Messages: /api/leads/:id/messages
app.use('/api/files', filesRoutes); // Also handle /api/files/:id routes
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

  // Start sequence processor — runs every hour, first run after 15s
  const SEQ_INTERVAL = 60 * 60 * 1000; // 1 hour
  setTimeout(() => {
    processSequences().catch(e => console.error('[Seq] Initial run error:', e));
    setInterval(() => {
      processSequences().catch(e => console.error('[Seq] Cron error:', e));
    }, SEQ_INTERVAL);
  }, 15000);

  // Weekly digest cron — every Monday at 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('[DIGEST CRON] Running weekly digest...');
    try {
      const userIds = await getAllUsersForDigest();
      let sent = 0;
      let skipped = 0;
      for (const userId of userIds) {
        const digest = await generateDigestForUser(userId);
        if (!digest) continue;
        if (!digest.hasActivity && digest.nextActions.length === 0) {
          skipped++;
          continue;
        }
        const ok = await sendWeeklyDigestEmail(digest);
        if (ok) sent++;
      }
      console.log(`[DIGEST CRON] Done: ${sent} sent, ${skipped} skipped (no activity)`);
    } catch (error) {
      console.error('[DIGEST CRON] Error:', error);
    }
  });
  console.log('📧 Weekly digest cron scheduled (Mondays 9 AM)');

  // Client onboarding sequence processor — runs every 6 hours
  const ONBOARDING_INTERVAL = 6 * 60 * 60 * 1000;
  setTimeout(() => {
    processOnboardingSequences().catch(e => console.error('[Onboarding] Initial run error:', e));
    setInterval(() => {
      processOnboardingSequences().catch(e => console.error('[Onboarding] Cron error:', e));
    }, ONBOARDING_INTERVAL);
  }, 20000);
  console.log('📨 Client onboarding processor scheduled (every 6 hours)');
});

export default app;
