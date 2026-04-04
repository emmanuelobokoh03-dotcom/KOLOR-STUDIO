# CRITICAL-1: Supabase RLS — TODO: MANUAL ACTION REQUIRED

> **Owner:** Emmanuel
> **Priority:** CRITICAL (Security)
> **Status:** PENDING MANUAL VERIFICATION

## Context

KOLOR Studio uses **Prisma + Express** with a `DATABASE_URL` **service role** connection.
All app data access goes through the backend — NOT through the Supabase client directly.
The frontend only uses the Supabase client for **Storage** (file uploads/downloads).

Enabling RLS on tables **does not break the backend** (service role bypasses RLS).
It only prevents **direct anon-key access from the browser**.

## Step 1: Enable RLS on All Tables

Go to the **Supabase SQL Editor** and run:

```sql
-- AUDIT FIX [6.2, 6.6]: Enable Row Level Security on every sensitive table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_onboarding_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_followup_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
```

## Step 2: Verify Storage Bucket Policies

Navigate to: **Supabase Dashboard → Storage → kolor-studio-files → Policies**

Ensure:
- No policy allows `SELECT` or `INSERT` with `(true)` (public, no auth check)
- Upload policy should require a valid user context (JWT) or be restricted to service role only

> **Note:** If files are accessed publicly by clients via signed URLs (from the portal),
> that is acceptable — Supabase Storage signed URLs are time-limited and don't require
> RLS to be meaningful.

## Step 3: Verify After Enabling

1. Test that the backend still works normally (service role bypasses RLS)
2. Open browser devtools → Network → verify no direct Supabase REST calls from frontend (except Storage)
3. Test file upload/download in the client portal still works

## RLS Status Report

| Table | RLS Status |
|-------|-----------|
| All tables listed above | **PENDING VERIFICATION** — Cannot access Supabase dashboard from build environment |

> Run the SQL above to enable RLS, then update this table with confirmed status.
