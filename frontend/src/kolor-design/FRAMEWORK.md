<!-- // industry-equality: ignore-file — design meta-documentation (framework spec), not user-facing production copy -->

# KOLOR STUDIO
## Design Framework v1.0 — Research + Synthesis

*A design system for creative professionals, expressed through the eyes of one.*

---

## PART 0 — HOW TO READ THIS DOCUMENT

This is not a moodboard. This is a design specification that resolves specific tensions with specific choices. Every decision is defensible. Every choice has a reason.

Three commitments:

1. **This framework serves all three industries equally** — Photography, Design, Fine Art. Not by being generic, but by being editorial. Editorial DNA is what unites Aperture, Eye Magazine, and Apartamento — the three industries share a lineage in print culture, and this framework leans into that lineage.

2. **This framework will not read as AI-generated.** The specific decisions below are ones a defensive process rejects. They require conviction to ship, not just competence.

3. **This framework can be built.** Nothing here requires custom typefaces you can't license. Nothing requires bespoke illustration. It's expressible in Tailwind + CSS variables + real fonts + real color values.

---

## PART 1 — POSITIONING ANALYSIS

### Where KOLOR sits vs references

Every design reference resolves a tension. Here's where they sit and where KOLOR belongs:

**Linear (the software-craft pole)** — near-black canvas, single lavender accent, custom sans, aggressive negative tracking. Reads as "technical documentation for people who take software seriously." Perfect for their audience (engineering leaders); wrong for KOLOR's (creatives don't want to feel like they're inside a Jira alternative).

**Cargo.site (the artist-portfolio pole)** — freeform, image-forward, layouts that feel curated not templated. Reads as "the platform disappears so your work speaks." Beautiful but doesn't scale to CRM (invoices, contracts, timelines — the ambient chrome KOLOR needs).

**Are.na (the intellectual pole)** — spare, semantically rich, artist-adjacent, deliberately unpolished in places. Reads as "we take ideas seriously." Closest to KOLOR's spirit but too monastic — no color, no warmth, no signal that money and business happen here.

**SSENSE (the editorial-commerce pole)** — clean grid + bold typography + editorial content alongside retail. Reads as "high fashion knows itself." Great tension-holder: they sell things AND publish essays. This is closer to KOLOR than any pure-SaaS reference.

**Aesop / Nothing / Rimowa (the object-brand pole)** — restraint as luxury signal, sophisticated but not baroque, specific typography with voice. Not software, but the closest analogues for the KOLOR *feeling*: "a considered thing made by considered people."

**KOLOR's position:** at the intersection of Aesop-restraint, SSENSE-editorial, and Cargo-artist-respect. Software that carries editorial DNA. A CRM that reads like a monograph.

### The tension resolution (Q1 = C)

The three tensions Emmanuel named:

1. **"Confident tool + Confident user"** — resolved via Blender/Photoshop/Figma pattern: the tool doesn't hide its depth, and using it makes the user feel taken seriously. The interface says *you're serious, so you're in a serious tool.*

2. **"Urban/artsy/contemporary + Rich in context"** — resolved via editorial DNA: minimal surface with layered information. Are.na resolves this. So does WePresent. So does MacGuffin magazine. The surface is spare; the depth is present when you look.

3. **"Anti-AI"** — resolved via a specific vocabulary of decisions no defensive process would take: off-white not white, warm-black not black, a specific unusual accent color, deliberate typographic contrast (huge display + tiny caption, nothing in between), metadata typography that shows care, editorial copy tone.

---

## PART 2 — DESIGN PHILOSOPHY (THE FIVE LAWS)

Every subsequent decision derives from these five laws. When in doubt, return here.

### Law 1: Restraint is confidence.
More is not louder. Louder is not more. A single element treated with real care beats a page of well-meaning noise. Where Linear says "software-craft," KOLOR says "editorial-craft."

### Law 2: The interface is stationery, not signage.
Stationery is what you write ON. Signage is what shouts AT you. KOLOR is a place where creative professionals draft quotes, sign contracts, and receive payments — moments of their professional life. The interface should have the dignity of good letterhead, not the volume of billboard.

### Law 3: Typography carries the voice; color qualifies it.
Type does the heavy lifting of identity. Color exists to signal state (danger, success, primary action) and to add one specific chromatic pleasure. Color is a garnish, not a foundation. Where SaaS defaults to color-first-typography-second, KOLOR reverses this.

### Law 4: Metadata is not noise. Metadata is context.
The dates, IDs, statuses, amounts, tags, timestamps — these are not "chrome to hide." They are *the material.* Given typographic care (specific mono, deliberate tracking, respectful placement), metadata becomes the texture that says "this is a serious tool that respects the work."

**The deduplication rule:** Metadata never repeats what's already visible in the current viewport. If "Fine Art Commission" is already the page title in giant type, the money moment's metadata line does NOT say "USD · Fine Art Commission · Original painting" — it says "Original painting · 60 × 80 cm." The metadata's job is to add new context, not to be defensively complete. Redundancy is the enemy of authority.

### Law 5: The framework must survive Photography, Design, and Fine Art with equal grace.
Every component must feel appropriate to a portrait photographer in Berlin, a graphic designer in Lagos, and a painter in São Paulo. When designing, mentally place all three on the screen. If one feels wrong, the design is wrong.

---

## PART 3 — COLOR SYSTEM

### 3.1 The canvas: off-white with warm tint

**#F7F4EE — "Ivory"** *(replaces current #FDFCFF)*

Not pure white. Warm ivory, close to the color of good paper or Aesop's product boxes. The immediate signal of intention: no AI defaults to this. It reads as "someone chose this."

Why not #FFFFFF: pure white on modern screens is aggressive, sterile, and — critically — AI's default. Warm ivory reads as considered. The photography industry (galleries, print shops) uses off-white for the same reason.

### 3.2 The ink: warm near-black

**#1A1613 — "Ink"** *(replaces current text-primary)*

Not #000000. A warm near-black — imagine dense ink on paper, not screen-black. On the ivory canvas, this reads as printed. On a dark surface, it recedes correctly.

**#5F5751 — "Ink Muted"** — for secondary text, metadata primary.
**#928B84 — "Ink Subtle"** — for tertiary text, timestamps.
**#C4BFB8 — "Ink Whisper"** — for disabled state, ghost text, dividers on ivory.

### 3.3 The dark surface: for portals, hero moments, focus

**#1A1613 — "Deep Ink"** *(canvas inverts to ink; ink inverts to ivory)*

Portals and signature moments run on Deep Ink with Ivory type — the letterpress-inverse of the daily canvas. Same warm register, opposite polarity.

### 3.4 The signature accent (revised)

Current KOLOR uses `#6C2EDB` (generic SaaS purple) + `#E8891A` (orange).

**Proposal — evolve the palette to two specific, editorial signals:**

**#B84A2C — "Terra"** *(evolves the orange)*
A pigmented terracotta / burnt sienna. Warmer than the current #E8891A, more specific. Reads as: fired earth, Lagos afternoon light, aged studio pigment. This is KOLOR's primary chromatic accent — used for money-in states (deposit received, quote accepted, payment confirmed), for the KOLOR mark itself, and for primary CTAs.

Why terra over purple: purple in SaaS reads as "we couldn't pick anything." Terra reads as "we thought about this." It's not a common brand color, especially not with warmth like this. It also carries across all three industries — photographers know terracotta from Rothko, designers from Muji packaging, fine artists from actual pigment.

**#3B4A3F — "Slate"** *(new — replaces informational blue)*
A deep sage-slate. Neither blue nor green. Used for informational states, secondary CTAs, active nav, "in-progress" project states. Reads as: overcast studio light, gallery wall shadow, considered gray with just enough green to breathe.

**Keep for restrained use — legacy purple:**
Current `#6C2EDB` retained as **"Violet Ghost"** — used ONLY in one specific place: the KOLOR wordmark. This preserves brand equity (existing beta members recognize the color) but demotes it from "brand foundation" to "signature accent within the wordmark itself." A whisper of continuity.

### 3.5 Semantic colors

**#4C6B4E — "Success"** — deeper than typical SaaS green; grown from Slate.
**#8B2E2C — "Danger"** — deeper than typical red; cousin of Terra.
**#7A5C2E — "Warning"** — mustard-oak, not marigold.
**#3B4A3F — "Info"** — reuses Slate.

None of these are the SaaS default palette (Tailwind red-500, green-500, etc). They're all pulled from editorial magazine color language — specifically, the muted palettes used in Kinfolk, WePresent, and Apartamento. Every semantic color reads as "considered" not "picked from a swatch library."

### 3.6 Color token summary

```
Canvas       Ivory        #F7F4EE
Canvas Dark  Deep Ink     #1A1613

Ink          Ink          #1A1613
Ink Muted    Ink Muted    #5F5751  
Ink Subtle   Ink Subtle   #928B84
Ink Whisper  Ink Whisper  #C4BFB8

Accent       Terra        #B84A2C   ← the KOLOR signature
Accent 2     Slate        #3B4A3F

Success                   #4C6B4E
Danger                    #8B2E2C
Warning                   #7A5C2E

Mark         Violet Ghost #6C2EDB   ← wordmark only
```

**Total signature colors visible in daily use: 3 (Ivory, Ink, Terra).** Everything else is context.

---

## PART 4 — TYPOGRAPHY SYSTEM

Typography is where KOLOR's identity actually lives. This is the most important section.

### 4.1 The type stack (evolved)

Current: Inter (app) + Fraunces (landing).

**Proposal:**

**Söhne** *(Klim Type Foundry)* — the primary sans.
Replaces Inter for all app UI, body copy, buttons, form fields. Söhne is what Klim calls "a grotesque with a private feeling" — it has more character than Inter without sacrificing legibility. Used by Frank Ocean's Blonded, WeTransfer's WePresent, Sonos, Aesop. The exact register KOLOR needs.

Fallback stack if unlicensed: **Neue Haas Grotesk Display / Text** (Linotype, mature classic) or **Söhne alternative "Inter Display"** (free — but this is a soft compromise).

**Fraunces** — KEEP. Promote it.
Fraunces is already the strongest brand-equity element in current KOLOR. It's a variable serif with genuine character (optical size axis, softness axis, weight axis). Currently used only on the landing page — expand its role. Now Fraunces carries:
- Landing page display type
- Editorial moments in the app (quote titles, contract titles, project titles in portals)
- Money numerals when displayed at hero size (`$10,000.00` for a quote total)
- The KOLOR wordmark itself (already in this position)

**Söhne Mono** *(Klim)* — new tertiary element.
Used deliberately for: metadata (dates, IDs, currency codes, quote numbers, tracking numbers, session tokens), timeline timestamps, status tokens, technical values. Never for body copy. Always with positive letter-spacing (+0.03em) — the "I have a reason" signal.

Fallback: **JetBrains Mono** (free, excellent, similar register) or **IBM Plex Mono**.

**No fourth face.** Three families is the discipline. Söhne (voice) + Fraunces (signature) + Söhne Mono (taxonomy). Adding a fourth degrades the system.

### 4.2 The type scale (editorial contrast)

The anti-AI move here is **deliberate contrast** — huge display sizes and tiny meta sizes, with intentional gaps. AI defaults to smooth Fibonacci scales (14-16-18-20-24). KOLOR uses editorial scale (13-16-20-40-96) — the gaps are the signal.

```
Display    Fraunces         96px  weight 400  tracking -2.5%  leading 1.02
Headline   Fraunces         56px  weight 400  tracking -2.0%  leading 1.05
Title      Söhne            32px  weight 500  tracking -1.5%  leading 1.15
Subtitle   Söhne            20px  weight 500  tracking -0.5%  leading 1.3
Body       Söhne            16px  weight 400  tracking  0     leading 1.55
Body Sm    Söhne            14px  weight 400  tracking  0     leading 1.5
Caption    Söhne            13px  weight 500  tracking +1.5%  leading 1.35
Meta       Söhne Mono       12px  weight 400  tracking +3.0%  leading 1.4
Micro      Söhne Mono       10px  weight 500  tracking +8.0%  leading 1.3  UPPERCASE
```

**The signature typographic contrasts** (used deliberately):

- **Fraunces 96px** for money totals in quotes → sits directly next to **Söhne Mono 12px** for the quote number
- **Fraunces 56px** for project titles → sits directly next to **Söhne Mono 10px UPPERCASE** for the client name eyebrow
- **Söhne 32px** for section headers → sits directly next to **Söhne 13px** for the section description

**Never used**: 18px, 24px, 28px, 36px, 48px. The scale skips these deliberately. Editorial contrast comes from the gaps. When you feel tempted to add an intermediate size, use the smaller one with more space around it.

### 4.3 The Fraunces / Söhne pairing philosophy

The two faces are used in specific counterpoint:

- **Söhne = the daily voice.** Everything you interact with. Buttons, forms, dashboards, list items, table cells. Söhne is neutral-but-personable.
- **Fraunces = the ceremonial voice.** Reserved for moments of ceremony: landing headlines, quote totals, project titles in portals, contract signatures, testimonial pull-quotes, and empty states.
- **The rule of switching:** Fraunces marks a moment. If you're using Fraunces, ask "is this a moment?" If yes, use Fraunces. If no, use Söhne.

Empty states in particular should use Fraunces italic:

> *No leads yet.*  
> *When they arrive, they'll appear here.*

Not "No leads yet. Click here to add one." An editorial empty state, not a UX prompt.

### 4.4 The metadata tell (Söhne Mono with positive tracking)

This is the KOLOR anti-AI signature. Every date, ID, timestamp, tag, and status code is rendered in Söhne Mono with positive tracking (+3.0% for meta, +8.0% for micro caps).

Examples:

```
Q-2026-008          ← Söhne Mono, 12px, +3%, ink-muted
JUL 25, 2026        ← Söhne Mono UPPERCASE, 10px, +8%, ink-subtle
PENDING             ← Söhne Mono UPPERCASE, 10px, +8%, terra
NGN · GHS · ZAR     ← Söhne Mono, 12px, +3%, ink-muted
```

This treatment appears on every screen. It's the signature. It says "someone thought about the metadata." AI does not do this — AI centers metadata as afterthought.

### 4.5 Editorial date formatting (always)

Never `07/25/26`. Never `2026-07-25`. Always `Jul 25, 2026` or `July 25, 2026` in Söhne. For metadata contexts (list items, table cells), use compact form: `Jul 25`. For ceremonial contexts (contract signature timestamp): `Friday, July 25, 2026 at 07:21 AM UTC`.

### 4.6 Numerals

Money in body contexts: Söhne, tabular figures on (`font-variant-numeric: tabular-nums`).

Money in ceremonial contexts (quote totals, deposit amounts on portal, invoice hero): **Fraunces**, weight 400, at display size. The visual contrast between Söhne body and Fraunces numerals is the KOLOR pleasure move.

Example on quote email:

```
INVESTMENT                    ← Söhne Mono, uppercase, 10px, +8%
$10,000.00                    ← Fraunces 400, 88px, tracking -2%
Quote Q-2026-008              ← Söhne Mono, 12px, +3%
```

---

## PART 5 — GRID + LAYOUT

### 5.1 The base grid

**12-column with asymmetric variance.**

Max content width: **1240px**. This is deliberately narrower than the SaaS default (usually 1440+). Editorial publications constrain width for reading comfort. KOLOR does the same.

Gutter: **32px** on desktop, **20px** on tablet, **16px** on mobile.

Margin: **48px** on desktop, **24px** on mobile.

### 5.2 The baseline grid

**8px baseline unit.** All vertical rhythm derives from 8px multiples: 8, 16, 24, 32, 48, 64, 96, 128.

**Never 20, 28, 36.** Same discipline as the type scale — the gaps are the signal.

Sections separate by **96px** vertical (mobile: 64px). Cards internal padding: **24px** (mobile: 16px). Form field spacing: **24px** between fields. Never 20, never 32.

### 5.3 The asymmetric move

Every screen has ONE deliberate asymmetry. This is the KOLOR editorial signature.

Examples:
- **Dashboard**: sidebar 280px + main content, but the CONTENT area has an intentional 60/40 split (not 50/50). The "primary" column feels weight-heavier than the secondary.
- **Quote builder**: form 65% + preview 35% (not 50/50). The form is where the work happens; give it dominance.
- **Client portal**: header full-bleed with project title on a 5-column offset, not centered. The eye lands where you want it, not in the middle.

Symmetry is safe. Deliberate asymmetry reads as designed.

### 5.4 White space is structure, not absence

Adopt Brodovitch's rule: **white space carries weight equal to type.** Empty sections between content are not "we ran out of things to say." They're breathing intervals that let the content matter.

Specifically:
- **Card top padding: 32px, not 24px** — gives content room to breathe
- **Section headers: 64px above, 32px below** — the header earns its place through space
- **Empty states: 128px vertical padding** — an empty state is a moment, not a placeholder

### 5.5 The "editorial break"

At exactly one place on every non-trivial page, break the grid deliberately: bleed content past the max-width, run type into the margin, or extend an image beyond its column. This is the moment that says "a designer made this."

Ideas for KOLOR:
- Portal header: project title in Fraunces bleeds past the container into the margin
- Dashboard: the client photo (if provided) breaks the card boundary
- Quote email: the amount ($10,000.00) is set at 96px which naturally bleeds the container

One break per screen. Never two. The break only works if the rest of the grid is disciplined.

---

## PART 6 — COMPONENT PHILOSOPHY

Rather than a component library, KOLOR has **component archetypes.** Each archetype has a philosophy; the specific implementations derive from it.

### 6.1 The button

**Philosophy:** buttons are not decorations. They are the moments the user commits.

- **Primary button:** Terra (#B84A2C) background, Ivory text, no shadow, no gradient, no rounded-full. Border-radius: 4px (crisp, editorial). Weight 500. Padding 12px 20px. On hover, Terra darkens 8%. On press, Terra darkens 15%.
- **Secondary button:** No fill. Ink border 1px. Ink text. Same padding, same radius. On hover, ink fills; text flips to ivory.
- **Ghost button (tertiary):** No fill, no border. Ink-muted text with underline on hover.

**No gradient buttons. No shadow buttons. No bouncy hover states.** The button is a mark of commitment; it should feel like signing your name.

### 6.2 The card

**Philosophy:** cards are containers for content that belongs together. Not decorations.

- Background: Ivory (or one shade darker: #F1EDE5)
- Border: hairline (#E5E0D8), 1px
- Border-radius: 8px
- No shadow — hairline border replaces shadow. Shadows are SaaS default; hairlines are editorial.
- Internal padding: 24px on all sides
- If the card contains a heading, heading is Söhne 20px, then 16px space, then body 14px

### 6.3 Form fields

**Philosophy:** form fields are where the user thinks. The tool should recede.

- Background: transparent (letting canvas show through)
- Border: **bottom only**, 1px hairline. No box. This is the anti-AI move — Ai defaults to fully-outlined inputs.
- On focus: bottom border darkens to Ink, no ring, no shadow, no color change
- Label ABOVE the field in Söhne 13px caption style
- Error state: bottom border becomes Danger; error message beneath in Söhne 13px Danger color

This creates form fields that look like handwriting on paper. Aesop's site uses this pattern. So does SSENSE at checkout.

### 6.4 Timeline / status indicator

**Philosophy:** timelines are stories. Every step should read as a chapter.

- Vertical line at 24px from left, Ink Whisper color
- Nodes: 12px circles. Filled Terra for complete, hollow Ink Whisper for pending
- Node title: Söhne 14px weight 500
- Node metadata: Söhne Mono 10px UPPERCASE + tracking +8%
- Between nodes: 32px vertical rhythm

### 6.5 Money display

**Philosophy:** money is the point of the platform. Treat it with respect.

The KOLOR signature move: money at ceremonial size uses Fraunces; money at operational size uses Söhne tabular.

- **Quote total on email/portal:** `Fraunces 400 88px` with the `$` sign at 60% of the amount size (visual balance). Currency code beside in Söhne Mono 12px UPPERCASE.
- **Line items in quote:** `Söhne 16px tabular`
- **Balance in Dashboard:** `Söhne 20px tabular weight 500`
- **Historical amounts in tables:** `Söhne 14px tabular`

**Currency notation:** never `USD $10,000` or `$10000`. Always `$10,000.00` with proper commas and cents. Always suffix the currency: `$10,000.00 USD` in Söhne Mono at 60% of amount size. This shows attention to the international audience KOLOR serves (GDPR-native, multi-currency).

### 6.6 Status tokens

**Philosophy:** status is metadata; treat it as such.

Small pills in Söhne Mono, UPPERCASE, +8% tracking, 10px. Color-coded but muted:
- **DRAFT** — Ink Subtle background, Ink text
- **PENDING** — Warning background at 20% opacity, Warning text
- **CONFIRMED** — Success background at 20% opacity, Success text
- **OVERDUE** — Danger background at 20% opacity, Danger text
- **PAID** — Terra background at 20% opacity, Terra text

Never bright pills. Muted, tinted, editorial. The status is present without shouting.

### 6.7 Empty states

**Philosophy:** empty states are the framework's most expressive moments. Use them.

Format:
1. **Vertical padding: 128px** — give it room
2. **Center-aligned Fraunces italic** at 32px: *"No leads yet."*
3. **Below in Söhne 14px Ink Muted**: A single line explaining what will appear when the state fills. Not "Click here to add." Descriptive, not prescriptive.
4. **Below optionally, a ghost button (tertiary)** to take action if relevant.

Example:

> *No conversations yet.*  
> When a client messages you, it'll appear here.  
> [Ghost button: Share your inquiry form]

### 6.8 Loading states

**Philosophy:** loading should feel like waiting for a print job, not a spinning wheel.

Replace spinning circles with:
- **Text-based loading:** `Söhne Mono 12px +3%`: `Loading…` or `Preparing quote…` with animated ellipsis (each dot appearing every 400ms)
- **For images:** subtle Ivory→Ink Whisper gradient sweep, 1.2s cycle
- **For long operations:** progress feedback in words, not percentage bars: `Sending to client…` then `Sent`

No spinning circles anywhere in the daily UI. Spinners are the AI default. Text-based waiting is editorial.

---

## PART 7 — MOTION PRINCIPLES

### 7.1 The three tempos

All motion in KOLOR runs on three tempos. Nothing else:

- **80ms** — instantaneous feedback (button press, tab change, tooltip appear)
- **200ms** — transitions with meaning (modal open, drawer slide, state change)
- **400ms** — ceremonial (page transition, hero appearance, empty→filled state)

### 7.2 The easing curve

**One easing curve:** `cubic-bezier(0.2, 0, 0, 1)` — a decisive ease-out. Fast at the start, quiet at the end. Feels like an object being placed down carefully.

**No bounce. No spring. No elastic.** These are the AI default. KOLOR's motion is calm and decisive.

### 7.3 Motion for meaning

Motion only exists where it clarifies:
- **State change** (deposit pending → paid): the pill fades color across 200ms
- **Hover** (button, link): color transition across 80ms, no scale, no shadow
- **Reveal** (modal, drawer): fade + slight upward slide (8px) across 200ms
- **Page transition**: 400ms crossfade with slight rightward shift (12px)

**Never animate:**
- Cards on scroll (SaaS default; feels performative)
- Icons on hover (they should sit still)
- Buttons on hover (they should darken, not scale)
- Anything "just because"

### 7.4 The KOLOR gesture

One signature motion moment used sparingly: **the hairline reveal.**

When a card is hovered or a section becomes active, a hairline appears from left to right along the bottom border of the container, over 400ms. Ivory → Ink hairline. Not decorative — it marks "this is now your focus."

Used on: card hover in dashboards, active navigation item, focused form field, active status in timeline.

---

## PART 8 — VOICE + COPY TONE

Design is language too. This section governs how KOLOR speaks.

### 8.1 The three tones

**Editorial** — used in landing page, marketing, empty states, portal ceremonial moments.
Direct, considered, no jargon. Fragments okay. Sentence rhythm varied.

*"Your studio, in one place. Your clients, well cared for."*

**Operational** — used in dashboard, forms, transactional emails.
Clear, brief, action-oriented but not commanding.

*"Quote sent to Sarah. She'll receive the link within a minute."*

**Confidential** — used in contracts, legal moments, receipts.
Precise, formal but readable. Never bureaucratic.

*"On July 24, 2026 at 07:21 AM UTC, Eylem signed the Art Commission Agreement for the project 'Fine Art Commission.' A copy is available in your Dashboard."*

### 8.2 Rules

**Never use:**
- "Awesome," "amazing," "great," or any excitement adjective
- Exclamation points except in ONE place (see below)
- "Please" as a beg word ("Please try again" → "Try again")
- "Whoops," "oops," "uh oh"
- "Just," "simply," "easy" (deletes them silently)
- Emojis in any UI, ever

**Use sparingly:**
- ONE exclamation point per email — reserved for the moment of celebration ("Signed." → "Quote accepted!"). Never in error states.
- "You" and "your" — okay but don't overuse.
- The em dash — for editorial pauses.

**The KOLOR voice model:**
- MacGuffin Magazine editorial style (understated, curated, wry)
- Aesop product descriptions (precise, poetic, restrained)
- Apple's early-2000s copy discipline (before their voice softened)

### 8.3 Client-facing vs studio-facing

Studio-facing (Emmanuel using it): operational tone dominant. Editorial notes as garnish.

Client-facing (portal, emails to clients): editorial tone dominant. Operational precision underneath.

Reason: clients experience KOLOR as a signal of the studio's professionalism. The interface should feel like *the studio's stationery*, not a SaaS platform the studio bolted on.

### 8.4 Copy specifics for KOLOR

- **App name:** always "KOLOR" or "KOLOR Studio" — never "Kolor" or "kolor." The capitalization is the wordmark.
- **Product noun:** "your studio" (client-facing) or "your workspace" (studio-facing). Never "your account."
- **Client noun:** "client" (universal). Never "customer" (transactional) or "lead" (in client-facing copy — "lead" is CRM jargon).
- **Money verbs:** "sent," "received," "cleared," "outstanding." Never "processed," "captured," "collected" (banking jargon).

---

## PART 9 — THE FIVE SIGNATURE MOVES

These are the specific decisions that make it unmistakably KOLOR. If someone screenshots any KOLOR screen and shows it out of context, these five moves should be present.

### Move 1: The Fraunces + Söhne Mono pairing on money

Any time money appears at ceremonial size, it's Fraunces alongside Söhne Mono metadata. This is the KOLOR pleasure move.

```
$10,000.00           ← Fraunces 88px
Q-2026-008 · USD     ← Söhne Mono 12px +3%
```

### Move 2: The bottom-border-only form field

No boxed inputs. Fields are handwriting on paper, marked only by an underline. Aesop, SSENSE checkout, and Are.na profile pages all use this. It reads as intentional the moment you see it.

### Move 3: Terra as the singular color pleasure

One color moment on each screen. Terra on the primary CTA. Terra on the earned badge. Terra on the currency indicator when payment lands. Never Terra + Slate + Success visible simultaneously on the same view. The eye finds the Terra moment and rests.

### Move 4: Editorial dates + metadata in Söhne Mono UPPERCASE

Every date, ID, and status appears in Söhne Mono UPPERCASE with wide positive tracking. This is the anti-AI signature that appears on every screen.

```
JUL 25, 2026 · CONFIRMED · Q-2026-008
```

Not readable at a glance? That's the point — it's *taxonomy*, meant to be seen as texture, not scanned for information. When users need the information, they slow down and read.

### Move 5: The hairline reveal on focus

The subtle bottom-border animation on active elements. A single 400ms hairline that says "this is where you are." Used consistently across cards, nav items, form fields, and timeline nodes. Never elsewhere.

### Move 6: The word-blur reveal on hero type

Ceremonial-scale headlines animate letter-by-letter: each word begins with outlined type at wide `letter-spacing: 0.5em`, then settles to solid fill at negative tracking (`-.035em`) over ~1000ms with a custom ease-settle curve. Words stagger with 40-60ms delay between them, creating a rhythm that reads as the headline "coming into focus."

Used exclusively on hero-scale Fraunces display type (landing page hero, portal project title). Never on subheadings, body copy, or CTAs. The gesture must feel like the headline is being drawn, not decorated.

Implementation reference: `.lp-word.ol` -> `.lp-word.ol.ready` in LandingPageV2.tsx, triggered by IntersectionObserver on `[data-hero-ready]`. Uses `var(--ease-settle)` (custom curve, `cubic-bezier(0.16, 1, 0.3, 1)` or similar decisive settle).

This is a designer's motion moment — the kind of gesture that says "someone made this deliberately." AI does not do word-by-word letter-spacing collapse. It's the KOLOR editorial signature at scale.

---

## PART 10 — WHAT SURVIVES FROM CURRENT KOLOR

**Kept as-is:**
- KOLOR wordmark (in current Violet Ghost #6C2EDB, retained for brand continuity within the wordmark ONLY)
- Fraunces as ceremonial face (promoted from landing-only to signature)
- Multi-currency logic
- Industry equality principle (Photography, Design, Fine Art)
- Terra concept (evolved from #E8891A orange)

**Retired:**
- Purple #6C2EDB as a general accent color (demoted to wordmark-only)
- Inter (replaced by Söhne)
- Pure white surfaces (replaced by Ivory)
- Pure black text (replaced by Ink)
- Existing gradient backgrounds (all)
- Existing button shadows (all)
- Existing rounded-2xl/3xl radii (replaced by editorial 4px/8px)
- The current emoji-forward tone in emails (👋 waves, etc.)

**Evolved:**
- Orange #E8891A → Terra #B84A2C (warmer, deeper, more specific)
- 16px+ font stack → editorial contrast scale (13/16/20/32/56/96)
- Rounded corners as visual softening → hairline borders as editorial framing

---

## PART 11 — COMPARISON MATRIX

How KOLOR sits vs references, quantified:

| Dimension | Linear | Cargo | Are.na | SSENSE | Aesop | **KOLOR** |
|---|---|---|---|---|---|---|
| Density (1=spare, 10=dense) | 6 | 3 | 4 | 7 | 4 | **5** |
| Warmth (1=cool, 10=warm) | 2 | 5 | 3 | 6 | 8 | **8** |
| Color intensity | 3 | varies | 1 | 4 | 3 | **3** |
| Type expressiveness | 6 | 9 | 5 | 7 | 8 | **9** |
| Motion | 7 | 5 | 3 | 6 | 3 | **4** |
| Editorial DNA | 4 | 7 | 8 | 9 | 8 | **9** |
| Software confidence | 10 | 4 | 6 | 6 | n/a | **9** |
| Anti-AI signal | 8 | 9 | 8 | 8 | 9 | **9** |

KOLOR aims to be **warmer than Linear, more disciplined than Cargo, more commercial than Are.na, more digital-native than Aesop, and specifically editorial in ways SSENSE only gestures at.**

---

## PART 12 — IMPLEMENTATION ROADMAP

### Phase A: Foundation (before any redesign iterations begin)

1. **License Söhne** ($$$) or commit to Neue Haas Grotesk / Inter Display as substitutes.
2. **Define CSS variables** for the new color system, typography scale, spacing scale.
3. **Update `tailwind.config.js`** with the new tokens.
4. **Document components in Storybook or equivalent** so the framework is testable.

### Phase B: Landing page (iter 279)

**Why start here:** highest visibility, lowest risk (no data model changes), sets the aesthetic contract for everything that follows. First impression for new founding members.

Deliverables:
- Ivory canvas, Ink type
- Fraunces 96px hero
- Söhne Mono metadata
- Terra CTA
- Editorial break at the fold
- Anti-AI empty states in the "features" section

### Phase C: Client portal (iter 280)

**Why second:** where the client experiences KOLOR. Every studio-owner will feel like the platform is worth the money the moment their client's portal reads as considered.

Deliverables:
- Deep Ink header with Ivory type (portrait-magazine cover feel)
- Fraunces project title bleeding past container
- Söhne Mono metadata line
- Editorial dates throughout
- Timeline with hairline reveal on active step
- Empty states in Fraunces italic

### Phase D: Dashboard (iter 281-283)

**Why third:** where the studio owner lives daily. Redesign in three sub-iterations:
- 281: Navigation + sidebar + top bar
- 282: Today view + Clients view
- 283: Money view + Portfolio view + Community view

### Phase E: Quote builder + Contract editor (iter 284-285)

The ceremonial forms. Where the studio owner does their most focused work.

### Phase F: Emails (iter 286)

Every email retemplated in the new system. Ivory canvas, editorial dates, Fraunces amounts, Söhne Mono metadata.

### Phase G: Community redesign (iter 287+)

The original ask that started this framework. Now built on the foundation.

---

## PART 13 — WHAT THIS COSTS

**Time (Emmanuel's):** ~12-16 iterations of focused design work across ~4-6 weeks if you ship one per session.

**Money:** Söhne licensing is real ($~1,000/yr for web use). If prohibitive, Neue Haas Grotesk (Linotype, ~$400 one-time) or the free/degraded path (Inter Display + Fraunces + JetBrains Mono).

**Design risk:** the framework is opinionated. It will feel confident to those who "get it" and probably confusing to those who don't. That's the point (Q1 = C). Some beta members may not respond well.

**Risk mitigation:** ship Phase B (landing) first as a self-contained test. If it lands, continue. If it flops, revert.

---

## APPENDIX A: REFERENCE URLS TO STUDY IN DEPTH BEFORE PHASE B

Load each and look at the specific decisions listed:

- **linear.app** — negative letter-spacing on display type
- **aesop.com** — bottom-border-only form fields, Ivory canvas
- **ssense.com** — editorial dates, brand-name-first product cards
- **are.na** — spare density, absence of chrome
- **cargo.site/community** — portfolio grid rhythms
- **read.cv** — typographic profile pages
- **wetransfer.com/wepresent** — editorial voice in a commercial context
- **apartamento-magazine.com** — cream canvas + real serif
- **klim.co.nz/blog** — Söhne in wild (also: read Klim's writing about type)
- **christophniemann.com** — radical simplicity + wit
- **rauno.me** — one designer's confident voice
- **framer.com/showcase** — see what other Framer sites are doing, don't do that

---

## APPENDIX B: WHAT TO REJECT WHEN TEMPTED

At every design decision, if you feel yourself reaching for one of these, stop and choose otherwise:

- Rounded-full pills for tags
- Gradient buttons (linear-gradient anywhere on a CTA)
- Drop shadows on cards
- Colored borders (border-purple-500 etc)
- Emoji anywhere in UI
- "Modern SaaS" aesthetics (rounded 12px+, gradient backgrounds, glassmorphism)
- Spinning circle spinners
- Toast notifications that slide from top with an icon
- Confetti animations for success
- Animated illustrations (Lottie files with characters)
- Any font weight between 400 and 500 (the middle is where AI lives)
- Neutral gray text like #6B7280 (Tailwind's gray-500 — the AI signature)
- Sans-serif for numerals when Fraunces would serve better

**Flag emoji exception:** Flag emoji (🇬🇧 🇳🇬 🇿🇦 🇩🇪 🇧🇷) are permitted where they function as compact country identification in editorial listings — currency-country tables, geographical taxonomies, international-first positioning lists. They must NEVER be decorative, reactive (in success messages), or used to soften copy tone. In practice, this applies to at most one section per surface. Everywhere else, "no emoji" holds.

If a choice feels safe, it's probably wrong.

---

## APPENDIX C: FRAMEWORK NAME + POINT OF VIEW

This framework, if it needed a name for the design community to refer to it, would be called:

**"Editorial Software."**

Or, more expansively: *"software with the dignity of good stationery, the confidence of a monograph, and the respect for its user of an independent magazine."*

This isn't marketing copy for KOLOR. It's an orientation for the framework's internal use. When making any decision, ask: *is this Editorial Software?*

If yes → proceed. If no → reject and try again.

---

## CLOSING NOTE

Emmanuel — this framework is a hypothesis. It's built from research + judgment + your stated vision, and it's opinionated enough that some parts you'll disagree with. That's expected and healthy.

Before we ship a single iteration against it, we should:
1. Sit with it for a day.
2. Identify the parts that feel wrong to you.
3. Revise them (or push back on my reasoning if you think I'm off).
4. THEN start Phase B.

Design frameworks that ship without disagreement almost always turn out generic. Yours shouldn't.

I'm ready to revise, defend, or extend any part of this document. What do you want to push on?
