-- Make clientEmail nullable on Lead model
ALTER TABLE "Lead" ALTER COLUMN "clientEmail" DROP NOT NULL;
