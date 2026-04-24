-- Iter 151: Rename stripeEventId → eventKey in ProcessedWebhookEvent
-- Semantically correct: this column stores both Stripe event IDs and
-- Paystack references (e.g. "paystack_ch_xxx") — "stripeEventId" was wrong.
ALTER TABLE "processed_webhook_events" RENAME COLUMN "stripeEventId" TO "eventKey";

-- Iter 151: Add missing indexes for scheduler query patterns
-- Quote.viewedAt — used by runQuoteViewedNudges WHERE viewedAt range filter
CREATE INDEX IF NOT EXISTS "quotes_viewedAt_idx" ON "quotes"("viewedAt");

-- Quote.(validUntil, status) — used by runQuoteExpiryWarnings range scan
CREATE INDEX IF NOT EXISTS "quotes_validUntil_status_idx" ON "quotes"("validUntil", "status");

-- Contract.(sentAt, status, clientAgreed) — used by runContractUnsignedWarnings
-- and runContractUnsignedFinalWarning sentAt range scans
CREATE INDEX IF NOT EXISTS "contracts_sentAt_status_clientAgreed_idx" ON "contracts"("sentAt", "status", "clientAgreed");
