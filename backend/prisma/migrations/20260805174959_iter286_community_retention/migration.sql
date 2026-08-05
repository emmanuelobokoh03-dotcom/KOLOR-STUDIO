-- AlterTable
ALTER TABLE "CommunityProfile" ADD COLUMN     "handle" TEXT,
ADD COLUMN     "weeklyDigestEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(240),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "coverPostId" TEXT,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "collectionId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(240),

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId","postId")
);

-- CreateTable
CREATE TABLE "FeaturedPost" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "industry" "CreativeIndustry" NOT NULL,
    "featuredWeek" TIMESTAMP(3) NOT NULL,
    "curatorNote" VARCHAR(320),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedCreator" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "industry" "CreativeIndustry" NOT NULL,
    "featuredWeek" TIMESTAMP(3) NOT NULL,
    "curatorNote" VARCHAR(320),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerSuggestion" (
    "id" TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasonCode" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "PeerSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowNote" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "note" VARCHAR(140) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerRecommendation" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recommendedIds" TEXT[],
    "note" VARCHAR(240),
    "sentMonth" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeerRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestSend" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "weekOfSent" TIMESTAMP(3) NOT NULL,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),

    CONSTRAINT "DigestSend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collection_ownerId_updatedAt_idx" ON "Collection"("ownerId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Collection_isPublic_updatedAt_idx" ON "Collection"("isPublic", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "CollectionItem_postId_idx" ON "CollectionItem"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedPost_postId_key" ON "FeaturedPost"("postId");

-- CreateIndex
CREATE INDEX "FeaturedPost_featuredWeek_idx" ON "FeaturedPost"("featuredWeek" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedPost_industry_featuredWeek_key" ON "FeaturedPost"("industry", "featuredWeek");

-- CreateIndex
CREATE INDEX "FeaturedCreator_featuredWeek_idx" ON "FeaturedCreator"("featuredWeek" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedCreator_industry_featuredWeek_key" ON "FeaturedCreator"("industry", "featuredWeek");

-- CreateIndex
CREATE INDEX "PeerSuggestion_fromProfileId_score_idx" ON "PeerSuggestion"("fromProfileId", "score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PeerSuggestion_fromProfileId_toProfileId_key" ON "PeerSuggestion"("fromProfileId", "toProfileId");

-- CreateIndex
CREATE INDEX "FollowNote_followingId_idx" ON "FollowNote"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowNote_followerId_followingId_key" ON "FollowNote"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "PeerRecommendation_senderId_sentMonth_idx" ON "PeerRecommendation"("senderId", "sentMonth");

-- CreateIndex
CREATE INDEX "PeerRecommendation_recipientId_createdAt_idx" ON "PeerRecommendation"("recipientId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DigestSend_profileId_sentAt_idx" ON "DigestSend"("profileId", "sentAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DigestSend_profileId_weekOfSent_key" ON "DigestSend"("profileId", "weekOfSent");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityProfile_handle_key" ON "CommunityProfile"("handle");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedPost" ADD CONSTRAINT "FeaturedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedCreator" ADD CONSTRAINT "FeaturedCreator_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerSuggestion" ADD CONSTRAINT "PeerSuggestion_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerSuggestion" ADD CONSTRAINT "PeerSuggestion_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowNote" ADD CONSTRAINT "FollowNote_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowNote" ADD CONSTRAINT "FollowNote_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerRecommendation" ADD CONSTRAINT "PeerRecommendation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerRecommendation" ADD CONSTRAINT "PeerRecommendation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestSend" ADD CONSTRAINT "DigestSend_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

