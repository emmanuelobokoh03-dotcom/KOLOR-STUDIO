-- =====================================================
-- KOLOR STUDIO: Creative Professionals Refactor
-- Phase 1: Database Schema Migration
-- NON-BREAKING: All changes are additive with defaults
-- =====================================================

-- =====================
-- 1. NEW ENUM TYPES
-- =====================

-- ProjectType: How the work is categorized
CREATE TYPE "ProjectType" AS ENUM (
  'SERVICE',        -- Photography session, videography, consulting
  'COMMISSION',     -- Custom artwork, illustration, sculpture
  'PROJECT',        -- Web design, branding package, content series
  'PRODUCT_SALE'    -- Prints, merchandise, digital products
);

-- IndustryType: What creative field
CREATE TYPE "IndustryType" AS ENUM (
  'PHOTOGRAPHY',
  'VIDEOGRAPHY',
  'GRAPHIC_DESIGN',
  'WEB_DESIGN',
  'ILLUSTRATION',
  'FINE_ART',
  'SCULPTURE',
  'BRANDING',
  'CONTENT_CREATION',
  'OTHER'
);

-- DeliverableType: What gets delivered to the client
CREATE TYPE "DeliverableType" AS ENUM (
  'DIGITAL_FILES',   -- Photos, videos, design files
  'PHYSICAL_ART',    -- Paintings, sculptures, installations
  'PRINTS',          -- Photo prints, art prints, posters
  'SERVICE',         -- Consulting, coaching, live event
  'WEBSITE',         -- Web design deliverable
  'MIXED'            -- Combination of above
);

-- StageType: Workflow stage categories
CREATE TYPE "StageType" AS ENUM (
  'DISCOVERY',       -- Initial consultation, requirements gathering
  'QUOTATION',       -- Quote/proposal creation and negotiation
  'AGREEMENT',       -- Contract signing, deposit collection
  'SCHEDULING',      -- Session/event scheduling
  'CREATION',        -- Active work (shooting, designing, painting)
  'REVIEW',          -- Client review, feedback, revisions
  'DELIVERY',        -- Final delivery of work
  'PAYMENT',         -- Final payment collection
  'FOLLOWUP'         -- Post-project follow-up, testimonials
);

-- DeliverableStatus: Status of a deliverable item
CREATE TYPE "DeliverableStatus" AS ENUM (
  'PENDING',         -- Not started
  'IN_PROGRESS',     -- Currently being worked on
  'READY',           -- Ready for delivery/review
  'DELIVERED',       -- Delivered to client
  'SHIPPED'          -- Physical item shipped
);

-- =====================
-- 2. UPDATE USERS TABLE
-- =====================

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "primaryIndustry" "IndustryType";

-- =====================
-- 3. UPDATE LEADS TABLE (NON-BREAKING — all have defaults)
-- =====================

ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "projectType" "ProjectType" NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN IF NOT EXISTS "industry" "IndustryType",
  ADD COLUMN IF NOT EXISTS "deliverableType" "DeliverableType" NOT NULL DEFAULT 'DIGITAL_FILES',
  ADD COLUMN IF NOT EXISTS "workflowData" JSONB;

-- Index for projectType queries
CREATE INDEX IF NOT EXISTS "leads_projectType_idx" ON "leads" ("projectType");

-- =====================
-- 4. CREATE WORKFLOW_TEMPLATES TABLE
-- =====================

CREATE TABLE IF NOT EXISTS "workflow_templates" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "industry" "IndustryType",
  "projectType" "ProjectType",
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "workflow_templates_userId_idx" ON "workflow_templates" ("userId");
CREATE INDEX IF NOT EXISTS "workflow_templates_industry_idx" ON "workflow_templates" ("industry");
CREATE INDEX IF NOT EXISTS "workflow_templates_projectType_idx" ON "workflow_templates" ("projectType");

-- =====================
-- 5. CREATE WORKFLOW_STAGES TABLE
-- =====================

CREATE TABLE IF NOT EXISTS "workflow_stages" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "type" "StageType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "fieldConfig" JSONB,
  "templateId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_stages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "workflow_stages_templateId_idx" ON "workflow_stages" ("templateId");
CREATE INDEX IF NOT EXISTS "workflow_stages_order_idx" ON "workflow_stages" ("order");

-- =====================
-- 6. CREATE DELIVERABLES TABLE
-- =====================

CREATE TABLE IF NOT EXISTS "deliverables" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" "DeliverableType" NOT NULL,
  "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
  "description" TEXT,

  -- Digital deliverables
  "fileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Physical deliverables
  "dimensions" TEXT,
  "material" TEXT,
  "weight" TEXT,

  -- Shipping
  "shippingAddress" TEXT,
  "shippingMethod" TEXT,
  "trackingNumber" TEXT,
  "shippedAt" TIMESTAMP(3),

  -- Session details
  "sessionDate" TIMESTAMP(3),
  "sessionLocation" TEXT,
  "sessionDuration" INTEGER,
  "sessionNotes" TEXT,

  -- Metadata
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,

  -- Relations
  "leadId" TEXT NOT NULL,

  -- Timestamps
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "deliverables_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "deliverables_leadId_idx" ON "deliverables" ("leadId");
CREATE INDEX IF NOT EXISTS "deliverables_status_idx" ON "deliverables" ("status");
CREATE INDEX IF NOT EXISTS "deliverables_type_idx" ON "deliverables" ("type");

-- =====================
-- MIGRATION COMPLETE
-- =====================
-- All changes are NON-BREAKING:
-- - New enum types created
-- - New columns on users/leads have defaults or are nullable
-- - New tables created with proper foreign keys
-- - Existing data and features continue working unchanged
