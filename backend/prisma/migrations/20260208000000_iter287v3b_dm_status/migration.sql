-- CreateEnum
CREATE TYPE "DMThreadStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "DMThread" ADD COLUMN     "status" "DMThreadStatus" NOT NULL DEFAULT 'ACCEPTED';

-- CreateIndex
CREATE INDEX "DMThread_status_updatedAt_idx" ON "DMThread"("status", "updatedAt" DESC);

