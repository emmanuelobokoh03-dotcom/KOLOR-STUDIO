-- Iter 153: Persist forgot-password rate limit to DB
-- Replaces in-memory Map that reset on Railway cold starts
ALTER TABLE "users" ADD COLUMN "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "passwordResetWindowStart" TIMESTAMP(3);
