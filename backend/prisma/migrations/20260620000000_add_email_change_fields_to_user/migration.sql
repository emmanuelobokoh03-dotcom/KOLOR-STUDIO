-- Iter 268: Email change flow fields (additive, zero downtime)
ALTER TABLE "users" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "users" ADD COLUMN "emailChangeToken" TEXT;
ALTER TABLE "users" ADD COLUMN "emailChangeTokenExpiry" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "emailChangeAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "emailChangeWindowStart" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_emailChangeToken_key" ON "users"("emailChangeToken");
