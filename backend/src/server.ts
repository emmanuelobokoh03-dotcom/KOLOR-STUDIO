import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';
import activitiesRoutes from './routes/activities';
import filesRoutes from './routes/files';
import portalRoutes from './routes/portal';
import quotesRoutes from './routes/quotes';
import settingsRoutes from './routes/settings';
import analyticsRoutes from './routes/analytics';
import quoteTemplatesRoutes from './routes/quote-templates';
import bookingsRoutes from './routes/bookings';
import portfolioRoutes from './routes/portfolio';
import workflowTemplatesRoutes from './routes/workflow-templates';
import deliverablesRoutes from './routes/deliverables';
import { ensureBucketExists } from './services/storage';

// Load environment variables
dotenv.config();

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

// =====================
// MIDDLEWARE
// =====================

// CORS - Allow frontend to communicate with backend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'https://booking-system-166.preview.emergentagent.com'
  ],
  credentials: true,
}));

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

// Health check - with /api prefix for Emergent routing
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

// API Routes - all prefixed with /api for K8s ingress routing
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/leads', activitiesRoutes); // Activities: /api/leads/:id/activities
app.use('/api/leads', filesRoutes); // Files: /api/leads/:id/files
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
app.use('/api', deliverablesRoutes); // Deliverables: /api/leads/:leadId/deliverables + /api/deliverables/:id

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
});

export default app;
