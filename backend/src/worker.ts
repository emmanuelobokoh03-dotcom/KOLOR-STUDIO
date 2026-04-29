import dotenv from 'dotenv';
dotenv.config();

// =====================
// WORKER — Background job processor
// Runs independently of the API server process.
// Shares DATABASE_URL with the API but has its own Prisma connection.
// Deploy as a separate Railway service with start command: node dist/worker.js
// =====================

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

// ── Sequence processor — every 4 hours (was 1 hour in API process) ──
// Reduced frequency: at < 50 users, hourly is overkill and wastes DB connections
const SEQ_INTERVAL = 4 * 60 * 60 * 1000;
setTimeout(() => {
  processSequences()
    .then(s => console.log(`[Worker][Seq] Initial run complete:`, s))
    .catch(e => console.error('[Worker][Seq] Initial run error:', e));
  setInterval(() => {
    processSequences()
      .then(s => console.log(`[Worker][Seq] Run complete:`, s))
      .catch(e => console.error('[Worker][Seq] Error:', e));
  }, SEQ_INTERVAL);
}, 10000); // 10s after startup
console.log('[Worker] 📨 Sequence processor scheduled (every 4 hours)');

// ── Onboarding sequences — every 12 hours (was 6 hours) ──
const ONBOARDING_INTERVAL = 12 * 60 * 60 * 1000;
setTimeout(() => {
  processOnboardingSequences()
    .catch(e => console.error('[Worker][Onboarding] Initial run error:', e));
  setInterval(() => {
    processOnboardingSequences()
      .catch(e => console.error('[Worker][Onboarding] Error:', e));
  }, ONBOARDING_INTERVAL);
}, 20000);
console.log('[Worker] 📨 Onboarding processor scheduled (every 12 hours)');

// ── Quote follow-up sequences — every 6 hours ──
const FOLLOWUP_INTERVAL = 6 * 60 * 60 * 1000;
setTimeout(() => {
  processQuoteFollowUpSequences()
    .catch(e => console.error('[Worker][QuoteFollowUp] Initial run error:', e));
  setInterval(() => {
    processQuoteFollowUpSequences()
      .catch(e => console.error('[Worker][QuoteFollowUp] Error:', e));
  }, FOLLOWUP_INTERVAL);
}, 30000);
console.log('[Worker] 💰 Quote follow-up processor scheduled (every 6 hours)');

// ── Scheduled emails — every 2 hours ──
const SCHEDULED_EMAIL_INTERVAL = 2 * 60 * 60 * 1000;
setTimeout(() => {
  processScheduledEmails()
    .catch(e => console.error('[Worker][ScheduledEmails] Initial run error:', e));
  setInterval(() => {
    processScheduledEmails()
      .catch(e => console.error('[Worker][ScheduledEmails] Error:', e));
  }, SCHEDULED_EMAIL_INTERVAL);
}, 40000);
console.log('[Worker] 📬 Scheduled email processor started (every 2 hours)');

// ── Meeting reminders — every hour ──
const MEETING_REMINDER_INTERVAL = 60 * 60 * 1000;
setTimeout(() => {
  processMeetingReminders()
    .catch(e => console.error('[Worker][MeetingReminders] Initial run error:', e));
  setInterval(() => {
    processMeetingReminders()
      .catch(e => console.error('[Worker][MeetingReminders] Error:', e));
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

// ── Keep the process alive ──
// Worker has no HTTP server so Node would exit without this.
// The setInterval loops above keep it alive, but this is explicit insurance.
process.on('uncaughtException', (err) => {
  console.error('[Worker] Uncaught exception:', err);
  // Do NOT exit — keep processing
});

process.on('unhandledRejection', (reason) => {
  console.error('[Worker] Unhandled rejection:', reason);
  // Do NOT exit — keep processing
});

console.log('[Worker] 🟢 All processors registered. Worker is running.');
