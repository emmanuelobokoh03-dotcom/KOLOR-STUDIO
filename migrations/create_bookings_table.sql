-- =============================================
-- KOLOR STUDIO - Bookings Table Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- First, create the BookingStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the existing bookings table if it exists (WARNING: This will delete all booking data!)
DROP TABLE IF EXISTS "bookings" CASCADE;

-- Create the bookings table with ALL columns from Prisma schema
CREATE TABLE "bookings" (
    -- Primary Key
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    
    -- Timing fields
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    
    -- Details fields
    "title" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    
    -- Status fields
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "color" TEXT,
    
    -- Reminders (JSON)
    "reminders" JSONB,
    
    -- Foreign Keys
    "leadId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    
    -- Constraints
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bookings_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX "bookings_leadId_idx" ON "bookings"("leadId");
CREATE INDEX "bookings_startTime_idx" ON "bookings"("startTime");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- Create a trigger to auto-update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at_trigger ON "bookings";
CREATE TRIGGER bookings_updated_at_trigger
    BEFORE UPDATE ON "bookings"
    FOR EACH ROW
    EXECUTE FUNCTION update_bookings_updated_at();

-- =============================================
-- Verification: Check the table structure
-- =============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
