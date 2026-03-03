-- =============================================
-- KOLOR STUDIO - Portfolio Table Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- First, create the PortfolioCategory enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "PortfolioCategory" AS ENUM (
        'PHOTOGRAPHY',
        'VIDEOGRAPHY',
        'GRAPHIC_DESIGN',
        'WEB_DESIGN',
        'BRANDING',
        'CONTENT_CREATION',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the existing portfolios table if it exists
DROP TABLE IF EXISTS "portfolios" CASCADE;

-- Create the portfolios table
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePath" TEXT,
    "category" "PortfolioCategory" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "portfolios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX "portfolios_userId_idx" ON "portfolios"("userId");
CREATE INDEX "portfolios_category_idx" ON "portfolios"("category");
CREATE INDEX "portfolios_featured_idx" ON "portfolios"("featured");

-- Create a trigger to auto-update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_portfolios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS portfolios_updated_at_trigger ON "portfolios";
CREATE TRIGGER portfolios_updated_at_trigger
    BEFORE UPDATE ON "portfolios"
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolios_updated_at();

-- =============================================
-- Verification: Check the table structure
-- =============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'portfolios'
ORDER BY ordinal_position;
