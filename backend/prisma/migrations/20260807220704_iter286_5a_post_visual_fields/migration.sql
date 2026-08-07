-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "additionalImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hiddenFromGrid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mainImage" TEXT;

-- CreateIndex
CREATE INDEX "Post_hiddenFromGrid_createdAt_idx" ON "Post"("hiddenFromGrid", "createdAt" DESC);

