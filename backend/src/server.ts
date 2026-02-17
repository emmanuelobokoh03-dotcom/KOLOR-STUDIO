import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// =====================
// MIDDLEWARE
// =====================

// CORS - Allow frontend to communicate with backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'KOLOR STUDIO API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes (to be implemented)
// app.use('/api/auth', authRoutes);
// app.use('/api/leads', leadsRoutes);
// app.use('/api/activities', activitiesRoutes);
// app.use('/api/messages', messagesRoutes);
// app.use('/api/portal', portalRoutes);

// Welcome route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'KOLOR STUDIO API',
    version: '1.0.0',
    description: 'The CRM that doesn\'t feel like a CRM - Built for creatives',
    endpoints: {
      health: '/health',
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
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
