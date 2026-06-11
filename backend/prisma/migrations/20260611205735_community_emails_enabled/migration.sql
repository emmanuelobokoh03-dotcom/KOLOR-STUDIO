ALTER TABLE "CommunityProfile"
  ADD COLUMN IF NOT EXISTS "communityEmailsEnabled" BOOLEAN NOT NULL DEFAULT true;
