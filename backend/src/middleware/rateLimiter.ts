import rateLimit from 'express-rate-limit';

const isDev = () => process.env.NODE_ENV === 'development';

const logHit = (req: any) => {
  console.warn('[RateLimit] Hit:', req.ip, req.method, req.path, new Date().toISOString());
};

// General API — 100 req/hour
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many requests, please try again later.' }); },
});

// Auth (login/signup) — 10 req/hour
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many authentication attempts, please try again later.' }); },
});

// Email verification — 3 req/hour
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many email verification requests, please try again later.' }); },
});

// File uploads — 20 req/hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many upload requests, please try again later.' }); },
});

// Portal access — 50 req/hour (clients)
export const portalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: isDev,
  handler: (req, res) => { logHit(req); res.status(429).json({ error: 'Too many requests, please try again later.' }); },
});
