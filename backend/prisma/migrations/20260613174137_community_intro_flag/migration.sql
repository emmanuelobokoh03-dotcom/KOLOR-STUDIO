ALTER TABLE "CommunityProfile"
  ADD COLUMN IF NOT EXISTS "hasSeenCommunityIntro" BOOLEAN NOT NULL DEFAULT false;
