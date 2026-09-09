# Google OAuth Verification Guide — KOLOR Studio

**Purpose**: Get past the "This app isn't verified" warning screen that appears on Google's consent screen when unverified apps request `email` / `profile` (or sensitive/restricted) scopes.

**Timeline**: 4–6 weeks total from submission to approval. Kick off in parallel with remaining Season Phase 1 work.

**Prerequisites already in place** (verified in iter Auth v3-v3a):
- ✅ Backend OAuth routes live: `/api/auth/google` (initiate) + `/api/auth/google/callback` (exchange)
- ✅ AuthCallback surface framework-calibrated with proper loading + error states
- ✅ Privacy Policy page exists at `/privacy` (routed in `App.tsx:120`)
- ✅ Terms of Service page exists at `/terms` (routed in `App.tsx:121`)
- ✅ Privacy content covers all 6 verification-required topics (data collection, third parties, cookies, deletion, retention, contact)

---

## Phase 1 — Google Cloud Console preparation (before you can even submit)

### Step 1: Confirm Google Cloud project ownership
1. Navigate to https://console.cloud.google.com/
2. Select the project used for the KOLOR OAuth client (top-left project selector)
3. If unsure which project owns the OAuth client:
   - `APIs & Services → Credentials` — find the OAuth 2.0 Client ID used by the backend (matches `GOOGLE_CLIENT_ID` env)
   - Note the project name at the top

### Step 2: Verify domain ownership in Google Search Console
Google requires proof you own `kolorstudio.app` (and any subdomain used).
1. Go to https://search.google.com/search-console
2. Add property → Domain property → enter `kolorstudio.app`
3. Verify via DNS TXT record (recommended) — add the TXT record to your DNS provider
4. Wait 5–15 min for DNS propagation → click "Verify"
5. **Also verify** `api.kolorstudio.app` if the OAuth redirect URI uses it

### Step 3: Add the Google account you're submitting from as a project owner/editor
- `IAM & Admin → IAM` — confirm the Google account you'll submit from has `Owner` or `Editor` role on the project

---

## Phase 2 — OAuth consent screen configuration

### Step 4: OAuth consent screen basics
`APIs & Services → OAuth consent screen`

**User Type**: `External` (unless a Google Workspace org — then Internal skips verification)

**App information**:
- App name: `KOLOR Studio` (must match branding on site — do NOT include "beta" or dev copies)
- User support email: dedicated inbox e.g. `support@kolorstudio.app` (must be monitored)
- App logo: 120x120 PNG minimum, hosted on kolorstudio.app domain, matches site branding
- App domain:
  - Application home page: `https://kolorstudio.app` (or exact production URL)
  - Application privacy policy link: `https://kolorstudio.app/privacy`
  - Application terms of service link: `https://kolorstudio.app/terms`
- Authorized domains: `kolorstudio.app` (add any subdomain here)
- Developer contact information: same or team inbox

### Step 5: Scopes selection
Add ONLY the scopes actually used by the app:
- `.../auth/userinfo.email` — non-sensitive
- `.../auth/userinfo.profile` — non-sensitive
- `openid` — non-sensitive

**If you use `https://www.googleapis.com/auth/calendar` or `.../calendar.events`**:
- These are **RESTRICTED SCOPES** — require CASA (Cloud Application Security Assessment) at Tier 2/3, which costs $$$ and takes months
- Recommendation: If Google Calendar sync is optional/nice-to-have, consider deferring until beta traction justifies the cost

For each scope you request, provide a **justification** (Google reads these carefully):

Template for `userinfo.email`:
> KOLOR Studio uses the user's Google email address as the account identifier for sign-in and to send transactional communications (booking confirmations, password recovery). No marketing email uses this address without explicit opt-in.

Template for `userinfo.profile`:
> KOLOR Studio uses the user's name and profile picture to personalize their creator dashboard and public portfolio surface. This data is displayed only to the account owner and clients they explicitly invite.

Template for `openid`:
> Standard OpenID Connect token used for authentication. Required for the OAuth 2.0 authorization code flow.

### Step 6: Test users (for now, before verification)
While unverified, add all developer/tester Google accounts under "Test users". They can bypass the warning screen. **Limit: 100 test users.**

---

## Phase 3 — Verification submission

### Step 7: Submit for verification
From the OAuth consent screen page, click **"Publish app"** → then **"Submit for verification"**.

You'll be asked to provide:

**Video demonstration** (required, most critical piece):
- 30–90 second screencast showing:
  1. User clicks "Continue with Google" on `https://kolorstudio.app/login`
  2. Google consent screen appears — user grants scopes
  3. Redirected to `/auth/callback` → then dashboard
  4. Show how each granted scope is actually used in-app (email displayed in profile, name in header, etc.)
- Upload to YouTube (unlisted is fine) or Google Drive with view access to anyone with the link
- Do NOT edit heavily — Google wants raw workflow

**Homepage requirements**:
- Must clearly identify KOLOR Studio branding
- Must show privacy policy link in footer (accessible from home page)
- Must show terms of service link in footer
- Do NOT require login to view the homepage

**Privacy policy content checklist** (audit yours at `/privacy`):
- [x] Data collection practices — what user data is collected via Google login (email, name, profile pic)
- [x] Purpose of data collection — account creation, personalization
- [x] Third-party data sharing — if you share with anyone (Stripe for payments, Resend for email, Supabase for storage), disclose it
- [x] Cookies + tracking disclosure — auth cookies, analytics
- [x] User data deletion process — how a user can request deletion (email address + response SLA)
- [x] Data retention policy — how long data is kept post-deletion
- [x] Contact information for privacy inquiries — a real email address
- [ ] Effective date — **VERIFY THIS IS PRESENT and current**
- [ ] **Explicitly mention Google OAuth scopes used** — "We access your Google email and profile name to create your account. We do NOT access Gmail, Drive, Calendar, or any other Google product data unless you explicitly connect that feature."

**Terms of service content checklist** (audit yours at `/terms`):
- [x] User obligations — account holder responsibilities
- [x] Service description — what KOLOR Studio does
- [x] Cancellation policy — how users can close account
- [x] Liability limitations — standard SaaS boilerplate
- [x] Governing law — jurisdiction
- [x] Contact information

---

## Phase 4 — During review (weeks 1–6)

### Step 8: Respond to Google reviewer emails
- Google typically emails within 3–5 business days for the first response
- Response emails come from `noreply@google.com` or `oauth-review@google.com`
- Reviewer will either approve, request changes, or ask clarifying questions
- **Turnaround target**: reply within 24–48h to keep momentum
- Common requests:
  - "Please clarify why you need scope X"
  - "Your privacy policy doesn't mention Y"
  - "Video doesn't clearly show how scope Z is used"

### Step 9: Common rejection reasons + fixes
| Reason | Fix |
|---|---|
| Privacy policy missing scope disclosure | Add "We use Google `userinfo.email` scope to..." paragraph |
| Homepage doesn't link to privacy/terms | Add footer links visible without login |
| Video too fast / edited / doesn't show scope usage | Re-record raw workflow showing each scope in action |
| App name mismatch (branding says X, submission says Y) | Align exactly — no dev suffixes |
| Domain not verified in Search Console | Complete Phase 1 Step 2 |

---

## Phase 5 — Post-approval

### Step 10: Confirm verified badge
- Once approved, the "unverified" warning screen disappears immediately
- Users see clean Google consent screen with just app name + scopes
- Verified badge (checkmark) appears on the consent screen
- Screenshot the verified consent screen for beta marketing + trust signals

### Step 11: Ongoing compliance
- Any change to scopes requires re-verification
- Any change to privacy policy content should be dated + versioned
- Do not change the app name post-verification without notifying Google

---

## Quick-start commands (once ready to submit)

1. **Verify domain**: https://search.google.com/search-console → add `kolorstudio.app`
2. **Consent screen**: https://console.cloud.google.com/apis/credentials/consent
3. **Record video**: use Loom/OBS at 1080p, 30–90s, unlisted YouTube upload
4. **Submit**: click "Submit for verification" on consent screen page
5. **Monitor inbox**: reply within 48h to all reviewer emails

---

## KOLOR-specific pre-flight checklist (do these before Step 7)

- [ ] Recorded video showing Google sign-in end-to-end on production `kolorstudio.app`
- [ ] Verified `kolorstudio.app` domain in Google Search Console
- [ ] Confirmed `/privacy` page has effective date + Google scope disclosure paragraph
- [ ] Confirmed `/terms` page has cancellation policy + real contact email
- [ ] Confirmed footer on `kolorstudio.app` home page links to both `/privacy` and `/terms`
- [ ] App logo hosted at kolorstudio.app domain (not a placeholder)
- [ ] Support email `support@kolorstudio.app` (or similar) is monitored
- [ ] OAuth consent screen: authorized domain includes `kolorstudio.app`
- [ ] OAuth consent screen: only `email`, `profile`, `openid` scopes requested (no restricted scopes)

Once all checklist items are green, submit and start the 4–6 week clock.

---

**Prepared during**: iter Auth v3-v3a (Season Phase 1, ninth v3 arc closer)  
**Delivered to**: Emmanuel  
**Persisted at**: `/app/memory/google_oauth_verification_guide.md`
