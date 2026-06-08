-- Community schema — iter-227a (applied via db push)
-- Eight new tables, two new enums. Zero changes to existing tables.

CREATE TYPE "Availability" AS ENUM ('OPEN', 'BOOKED', 'UNAVAILABLE');
CREATE TYPE "NotificationType" AS ENUM ('POST_LIKED', 'POST_COMMENTED', 'DM_RECEIVED', 'NEW_FOLLOWER');

CREATE TABLE "CommunityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" VARCHAR(150),
    "city" TEXT,
    "availability" "Availability" NOT NULL DEFAULT 'OPEN',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isSynthetic" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommunityProfile_userId_key" ON "CommunityProfile"("userId");

CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "images" TEXT[],
    "industry" "CreativeIndustry" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Post_industry_createdAt_idx" ON "Post"("industry", "createdAt" DESC);
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt" DESC);

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" VARCHAR(300) NOT NULL,
    "parentCommentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

CREATE TABLE "PostLike" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("userId", "postId")
);
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");

CREATE TABLE "DMThread" (
    "id" TEXT NOT NULL,
    "participantA" TEXT NOT NULL,
    "participantB" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DMThread_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DMThread_participantA_participantB_key" ON "DMThread"("participantA", "participantB");
CREATE INDEX "DMThread_participantA_updatedAt_idx" ON "DMThread"("participantA", "updatedAt" DESC);
CREATE INDEX "DMThread_participantB_updatedAt_idx" ON "DMThread"("participantB", "updatedAt" DESC);

CREATE TABLE "DMMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "DMMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DMMessage_threadId_sentAt_idx" ON "DMMessage"("threadId", "sentAt");

CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId", "followingId")
);
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "fromUserId" TEXT,
    "threadId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_recipientId_isRead_createdAt_idx" ON "Notification"("recipientId", "isRead", "createdAt" DESC);

-- Foreign keys
ALTER TABLE "CommunityProfile" ADD CONSTRAINT "CommunityProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DMThread" ADD CONSTRAINT "DMThread_participantA_fkey"
  FOREIGN KEY ("participantA") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DMThread" ADD CONSTRAINT "DMThread_participantB_fkey"
  FOREIGN KEY ("participantB") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DMMessage" ADD CONSTRAINT "DMMessage_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "DMThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DMMessage" ADD CONSTRAINT "DMMessage_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey"
  FOREIGN KEY ("followerId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey"
  FOREIGN KEY ("followingId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
