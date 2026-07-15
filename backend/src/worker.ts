import dotenv from 'dotenv';
dotenv.config();

// =====================
// WORKER — Background job processor
// Runs independently of the API server process.
// Shares DATABASE_URL with the API but has its own Prisma connection.
// Deploy as a separate Railway service with start command: node dist/worker.js
// =====================

import express, { Request, Response } from 'express';
import { processSequences } from './services/sequenceEngine';
import { processOnboardingSequences } from './services/onboardingService';
import { processQuoteFollowUpSequences } from './services/quoteFollowUpService';
import { processScheduledEmails } from './services/scheduledEmailService';
import { processMeetingReminders } from './services/meetingReminderService';
import { startScheduler } from './scheduler';

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`[Worker] ❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[Worker] ✅ Starting KOLOR Studio background worker');
console.log(`[Worker] Environment: ${process.env.NODE_ENV || 'development'}`);

// ============================================================
// Health tracking state (iter 270)
// ============================================================

const WORKER_STARTED_AT = Date.now();
const STARTUP_GRACE_MS = 5 * 60 * 1000; // 5 min — allow all processors their first tick

interface ProcessorHealth {
  name: string;
  intervalMs: number;
  lastTickAt: number | null;
  lastResult: string | null;
  lastError: string | null;
  errorCount: number;
}

// If a processor hasn't ticked in 2x its interval, mark degraded
const STALE_MULTIPLIER = 2;

const tickState: Record<string, ProcessorHealth> = {
  sequences:        { name: 'sequences',        intervalMs: 4 * 60 * 60 * 1000,  lastTickAt: null, lastResult: null, lastError: null, errorCount: 0 },
  onboarding:       { name: 'onboarding',       intervalMs: 12 * 60 * 60 * 1000, lastTickAt: null, lastResult: null, lastError: null, errorCount: 0 },
  quoteFollowUp:    { name: 'quoteFollowUp',    intervalMs: 6 * 60 * 60 * 1000,  lastTickAt: null, lastResult: null, lastError: null, errorCount: 0 },
  scheduledEmails:  { name: 'scheduledEmails',  intervalMs: 2 * 60 * 60 * 1000,  lastTickAt: null, lastResult: null, lastError: null, errorCount: 0 },
  meetingReminders: { name: 'meetingReminders', intervalMs: 60 * 60 * 1000,      lastTickAt: null, lastResult: null, lastError: null, errorCount: 0 },
};

function recordTickSuccess(key: string, result?: unknown): void {
  const p = tickState[key];
  if (!p) return;
  p.lastTickAt = Date.now();
  p.lastResult = result ? JSON.stringify(result) : 'ok';
  p.lastError = null;
}

function recordTickError(key: string, err: unknown): void {
  const p = tickState[key];
  if (!p) return;
  p.lastTickAt = Date.now(); // record attempt time even on error
  p.lastError = err instanceof Error ? err.message : String(err);
  p.errorCount += 1;
}

function getWorkerHealth(): { healthy: boolean; degraded: string[]; details: Record<string, unknown> } {
  const now = Date.now();
  const uptimeMs = now - WORKER_STARTED_AT;
  const inGracePeriod = uptimeMs < STARTUP_GRACE_MS;

  const degraded: string[] = [];
  const details: Record<string, unknown> = {};

  for (const [key, p] of Object.entries(tickState)) {
    const staleThresholdMs = p.intervalMs * STALE_MULTIPLIER;
    const timeSinceLastTickMs = p.lastTickAt ? now - p.lastTickAt : null;

    let processorStatus: string;
    if (!p.lastTickAt) {
      processorStatus = inGracePeriod ? 'awaiting-first-tick' : 'never-ticked';
      if (!inGracePeriod) degraded.push(key);
    } else if (timeSinceLastTickMs !== null && timeSinceLastTickMs > staleThresholdMs) {
      processorStatus = 'stalled';
      degraded.push(key);
    } else {
      processorStatus = 'healthy';
    }

    details[key] = {
      status: processorStatus,
      lastTickAt: p.lastTickAt ? new Date(p.lastTickAt).toISOString() : null,
      minutesSinceLastTick: timeSinceLastTickMs !== null ? Math.round(timeSinceLastTickMs / 60000) : null,
      intervalMinutes: Math.round(p.intervalMs / 60000),
      lastResult: p.lastResult,
      lastError: p.lastError,
      errorCount: p.errorCount,
    };
  }

  return { healthy: degraded.length === 0, degraded, details };
}

// ============================================================
// HTTP health endpoint (iter 270)
// ============================================================

const app = express();
const HEALTH_PORT = parseInt(process.env.PORT || '5001', 10);

app.get('/health', (_req: Request, res: Response) => {
  const health = getWorkerHealth();
  const status = health.healthy ? 200 : 503;
  const uptimeMs = Date.now() - WORKER_STARTED_AT;

  res.status(status).json({
    status: health.healthy ? 'ok' : 'degraded',
    service: 'kolor-worker',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round(uptimeMs / 1000),
    startedAt: new Date(WORKER_STARTED_AT).toISOString(),
    timestamp: new Date().toISOString(),
    degraded: health.degraded,
    processors: health.details,
  });
});

// Root — simple liveness check
app.get('/', (_req: Request, res: Response) => {
  res.json({ service: 'kolor-worker', status: 'alive' });
});

app.listen(HEALTH_PORT, () => {
  console.log(`[Worker] 🏥 Health endpoint listening on port ${HEALTH_PORT}`);
  console.log(`[Worker]    GET /health for detailed processor status`);
});

// ── Sequence processor — every 4 hours (was 1 hour in API process) ──
// Reduced frequency: at < 50 users, hourly is overkill and wastes DB connections
const SEQ_INTERVAL = 4 * 60 * 60 * 1000;
setTimeout(() => {
  processSequences()
    .then(s => {
      recordTickSuccess('sequences', s);
      console.log(`[Worker][Seq] Initial run complete:`, s);
    })
    .catch(e => {
      recordTickError('sequences', e);
      console.error('[Worker][Seq] Initial run error:', e);
    });
  setInterval(() => {
    processSequences()
      .then(s => {
        recordTickSuccess('sequences', s);
        console.log(`[Worker][Seq] Run complete:`, s);
      })
      .catch(e => {
        recordTickError('sequences', e);
        console.error('[Worker][Seq] Error:', e);
      });
  }, SEQ_INTERVAL);
}, 10000); // 10s after startup
console.log('[Worker] 📨 Sequence processor scheduled (every 4 hours)');

// ── Onboarding sequences — every 12 hours (was 6 hours) ──
const ONBOARDING_INTERVAL = 12 * 60 * 60 * 1000;
setTimeout(() => {
  processOnboardingSequences()
    .then(() => recordTickSuccess('onboarding'))
    .catch(e => {
      recordTickError('onboarding', e);
      console.error('[Worker][Onboarding] Initial run error:', e);
    });
  setInterval(() => {
    processOnboardingSequences()
      .then(() => recordTickSuccess('onboarding'))
      .catch(e => {
        recordTickError('onboarding', e);
        console.error('[Worker][Onboarding] Error:', e);
      });
  }, ONBOARDING_INTERVAL);
}, 20000);
console.log('[Worker] 📨 Onboarding processor scheduled (every 12 hours)');

// ── Quote follow-up sequences — every 6 hours ──
const FOLLOWUP_INTERVAL = 6 * 60 * 60 * 1000;
setTimeout(() => {
  processQuoteFollowUpSequences()
    .then(() => recordTickSuccess('quoteFollowUp'))
    .catch(e => {
      recordTickError('quoteFollowUp', e);
      console.error('[Worker][QuoteFollowUp] Initial run error:', e);
    });
  setInterval(() => {
    processQuoteFollowUpSequences()
      .then(() => recordTickSuccess('quoteFollowUp'))
      .catch(e => {
        recordTickError('quoteFollowUp', e);
        console.error('[Worker][QuoteFollowUp] Error:', e);
      });
  }, FOLLOWUP_INTERVAL);
}, 30000);
console.log('[Worker] 💰 Quote follow-up processor scheduled (every 6 hours)');

// ── Scheduled emails — every 2 hours ──
const SCHEDULED_EMAIL_INTERVAL = 2 * 60 * 60 * 1000;
setTimeout(() => {
  processScheduledEmails()
    .then(() => recordTickSuccess('scheduledEmails'))
    .catch(e => {
      recordTickError('scheduledEmails', e);
      console.error('[Worker][ScheduledEmails] Initial run error:', e);
    });
  setInterval(() => {
    processScheduledEmails()
      .then(() => recordTickSuccess('scheduledEmails'))
      .catch(e => {
        recordTickError('scheduledEmails', e);
        console.error('[Worker][ScheduledEmails] Error:', e);
      });
  }, SCHEDULED_EMAIL_INTERVAL);
}, 40000);
console.log('[Worker] 📬 Scheduled email processor started (every 2 hours)');

// ── Meeting reminders — every hour ──
const MEETING_REMINDER_INTERVAL = 60 * 60 * 1000;
setTimeout(() => {
  processMeetingReminders()
    .then(() => recordTickSuccess('meetingReminders'))
    .catch(e => {
      recordTickError('meetingReminders', e);
      console.error('[Worker][MeetingReminders] Initial run error:', e);
    });
  setInterval(() => {
    processMeetingReminders()
      .then(() => recordTickSuccess('meetingReminders'))
      .catch(e => {
        recordTickError('meetingReminders', e);
        console.error('[Worker][MeetingReminders] Error:', e);
      });
  }, MEETING_REMINDER_INTERVAL);
}, 50000);
console.log('[Worker] 📅 Meeting reminder processor started (every hour)');

// ── Daily/weekly cron jobs (stale nudges, weekly reports, etc.) ──
if (process.env.NODE_ENV === 'production') {
  startScheduler();
  console.log('[Worker] 📅 Daily/weekly cron scheduler started');
} else {
  console.log('[Worker] [Scheduler] Skipped in development mode');
}

// ── Process lifecycle ──
process.on('uncaughtException', (err) => {
  console.error('[Worker] Uncaught exception:', err);
  // Do NOT exit — keep processing
});

process.on('unhandledRejection', (reason) => {
  console.error('[Worker] Unhandled rejection:', reason);
  // Do NOT exit — keep processing
});

console.log('[Worker] 🟢 All processors registered. Worker is running.');
