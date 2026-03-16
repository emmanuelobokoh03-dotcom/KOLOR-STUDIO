import rateLimit from 'express-rate-limit';

const isDev = () => process.env.NODE_ENV === 'development';

const logHit = (req: any) => {
  console.warn('[RateLimit] Hit:', req.ip, req.method, req.path, new Date().toISOString());
};

// General API — 1000 req/hour (accounts for auto-refresh polling + normal usage)
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: (req) => isDev() || req.path === '/health',
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many requests, please try again later.' }); },
});

// Auth (login/signup) — 30 req/hour
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many authentication attempts, please try again later.' }); },
});

// Email verification — 5 req/hour
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many email verification requests, please try again later.' }); },
});

// File uploads — 50 req/hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many upload requests, please try again later.' }); },
});

// Portal access — 200 req/hour (clients)
export const portalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many requests, please try again later.' }); },
});
