-- AlterTable
ALTER TABLE "quotes" ADD COLUMN "depositDueDate" TIMESTAMP(3),
                     ADD COLUMN "finalPaymentDueDate" TIMESTAMP(3),
                     ADD COLUMN "depositPercent" INTEGER;
