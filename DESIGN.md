---
name: Splitto
description: An account-less, shared expense tracker for groups
colors:
  page-bg: "#fafafa"
  page-bg-dark: "#000000"
  surface: "#ffffff"
  surface-dark: "#18181b"
  border: "#e4e4e7"
  border-dark: "#27272a"
  border-dashed: "#d4d4d8"
  border-dashed-dark: "#3f3f46"
  ink-primary: "#18181b"
  ink-primary-dark: "#f4f4f5"
  ink-secondary: "#71717a"
  ink-secondary-dark: "#a1a1aa"
  ink-muted: "#a1a1aa"
  ink-muted-dark: "#52525b"
  accent: "#b8492e"
  accent-dark: "#e8734f"
  accent-hover: "#963a23"
  accent-hover-dark: "#f0906f"
  accent-ink: "#ffffff"
  accent-ink-dark: "#241009"
  positive: "#059669"
  negative: "#dc2626"
  warning: "#d97706"
  chart-1: "#2a78d6"
  chart-2: "#1baf7a"
  chart-3: "#eda100"
  chart-4: "#008300"
  chart-5: "#4a3aa7"
  chart-6: "#e34948"
  chart-7: "#e87ba4"
  chart-8: "#eb6834"
typography:
  heading:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "1.3"
    letterSpacing: "normal"
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.4"
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1.4"
rounded:
  default: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.default}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.default}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.default}"
    padding: "16px"
---

# Design System: Splitto

## 1. Overview

**Creative North Star: "The Shared Notebook"**

Splitto looks like a plain paper ledger passed between friends, not a finance dashboard trying to earn your trust with polish. There is no gradient, no shadow anywhere in the interface — every screen is built from Tailwind's default neutral (zinc) scale, one deliberate terracotta accent, and a small, restrained set of semantic colors used only where they carry real meaning (green when money is owed to you, red when you owe it, amber when something is an estimate or worth a second look). The system explicitly rejects Splitwise's busier, ad-supported feel: no toolbars, no upsell banners, no visual competition for attention against the actual task of logging an expense or settling up.

Density is low and whitespace is generous. Cards are flat rectangles with a hairline border, nothing more — depth is never implied with a shadow, only with a change in background tone (page background vs. card surface). The one structural flourish the system allows itself is a dashed border, reserved specifically for settlement records, so a glance down the activity feed tells expenses and payments apart without reading a single word.

**Key Characteristics:**
- Zinc neutral scale as the base palette, warmed by one terracotta accent spent only on the primary action and "who paid" — never as decoration elsewhere
- Flat by construction — no box-shadow anywhere in the codebase
- Solid border = expense, dashed border = settlement; the one recurring structural signal
- Generous whitespace, small type scale, no dense data-table aesthetic despite being a money app
- Light and dark are both explicit, user-chosen per-device states (a footer toggle), not just a system-preference fallback

## 2. Colors

The palette is almost entirely neutral, warmed by exactly one real accent; the other non-neutral colors are semantic signals, not brand expression.

### Primary
- **Notebook Terracotta** (`#b8492e` light / `#e8734f` dark, `accent`): worn-leather-journal warmth — the one deliberate color in the system, spent on exactly two things: the primary action button (Add expense, Save changes, and similar) and the "Paid by X" line in the activity feed. Never used decoratively, never used twice as much as that.
- **Zinc Ink** (`#18181b` light / `#f4f4f5` dark, `ink-primary`): heading and body text. Inverts between modes rather than staying fixed — the darkest neutral in light mode, the lightest in dark mode.

### Secondary
- **Settled Green** (`#059669`, `positive`): a balance owed *to* someone, or a fully settled state. Used sparingly — text color only, never a filled background beyond the small "New" activity badge.
- **Owed Red** (`#dc2626`, `negative`): a balance someone owes. Same restrained usage as Settled Green — text, not surface.

### Tertiary
- **Estimate Amber** (`#d97706`, `warning`): flags something worth a second look — an exchange rate that fell back to an estimate, a possible duplicate expense. Never used for a destructive or blocking action, only an FYI.

### Neutral
- **Page Paper** (`#fafafa` light / `#000000` dark, `page-bg`): the page background, one step back from every card.
- **Notebook Surface** (`#ffffff` light / `#18181b` dark, `surface`): the card/container background — the "page" of the notebook.
- **Hairline Border** (`#e4e4e7` light / `#27272a` dark, `border`): the only depth cue in the entire system. No shadows exist anywhere; this line is the sole separator between a card and the page behind it.
- **Dashed Border** (`#d4d4d8` light / `#3f3f46` dark, `border-dashed`): identical hue to the hairline border, but rendered dashed — reserved exclusively for settlement records, never expenses.
- **Secondary Ink** (`#71717a` light / `#a1a1aa` dark, `ink-secondary`): metadata — timestamps, "paid by", category labels.
- **Muted Ink** (`#a1a1aa` light / `#52525b` dark, `ink-muted`): placeholder text and empty-state copy.

### Named Rules
**The One Line Rule.** Depth is conveyed with exactly one hairline border between a card and the page behind it — never a shadow, never a second border, never a gradient edge.
**The Dash Means Money Moved Rule.** A dashed border is the single reserved signal for a settlement (a payment between people). Every other card — expenses, items, participants — uses a solid border. This distinction is never used for anything else.
**The One Accent Rule.** Terracotta appears in exactly two roles — the primary button and "Paid by X" — and nowhere else. A third use is drift, not reinforcement.

## 3. Typography

**Body Font:** Geist Sans (with `ui-sans-serif, system-ui` fallback)
**Label/Mono Font:** Geist Mono (with `ui-monospace` fallback) — loaded project-wide but not yet given an active role; reserved for a future numeric/tabular use (e.g. aligned currency columns) rather than in use today.

**Character:** A single geometric-humanist sans carries the whole interface at a small, quiet scale — there is no display face and no second voice competing for attention.

### Hierarchy
- **Heading** (600, 1.5rem/24px, 1.3 line-height): group name at the top of the group page; the only large text in the app.
- **Title** (600, 1.125rem/18px, 1.4 line-height): page titles ("Add an expense", "History & analytics", "Group settings").
- **Body** (400, 0.875rem/14px, 1.5 line-height): the default size for nearly everything — form labels, list items, buttons, card content.
- **Label** (500, 0.75rem/12px, 1.4 line-height): metadata, timestamps, uppercase-tracked section eyebrows ("PARTICIPANTS", "TRANSACTIONS").

### Named Rules
**The One Size Mostly Rule.** The interface runs almost entirely on two sizes — 0.875rem for content, 0.75rem for metadata. A third, larger size is reserved for page/group titles only, never for emphasis within a card.

## 4. Elevation

Splitto has no shadow vocabulary. Depth is conveyed entirely through a single hairline border plus a one-step change in background tone (page background vs. card surface) — never `box-shadow`, never a blur, never a lifted-card effect on hover.

### Named Rules
**The Flat-By-Default Rule.** No component in this system ever casts a shadow. If a new component seems to need one to feel "grounded," the fix is a border or a background-tone shift, not a shadow.

## 5. Components

### Buttons
- **Shape:** 8px corner radius (`rounded-lg`) on every button, no exceptions.
- **Primary:** solid terracotta fill (`#b8492e` light / `#e8734f` dark) with ink-appropriate text (white on light, near-black on dark). Padding scales with importance: 12px/20px for a primary page action (Add expense, Save changes), 8px/16px for an inline secondary action.
- **Secondary / Outline:** transparent fill, `1px` neutral border, secondary-ink text; hover fills lightly with the neutral-100 tone.
- **Ghost / Link:** underlined text only, no border or fill — used for tertiary actions like "+ Add another payer".
- **Hover / Focus:** primary darkens one step in light mode, lightens one step in dark mode — a plain color shift, no shadow, no scale transform.
- **Disabled / Pending:** 50–60% opacity plus an inline spinner (a small `animate-spin` ring in the button's own text color) and pending copy ("Saving…") while a server action is in flight — never a silent, unresponsive tap.

### Cards / Containers
- **Corner Style:** 8px radius, matching buttons.
- **Background:** `surface` (white / zinc-900), one tone lighter (light mode) or lighter (dark mode) than the page behind it.
- **Border:** solid 1px hairline border for expenses, participants, and most containers; dashed 1px border reserved for settlement records (see Named Rules above).
- **Shadow Strategy:** none — see Elevation.
- **Internal Padding:** 16px (`p-4`) is the default; list-item rows inside a card use less (`px-4 py-2` / `px-4 py-3`).

### Inputs / Fields
- **Style:** 8px radius, 1px neutral border, white/zinc-900 background, matching cards exactly.
- **Focus:** border color shifts to a mid-neutral (`focus:border-zinc-500`) — no glow, no ring, no shadow.
- **Disabled:** 50–60% opacity, matching buttons.
- **Placeholder-as-value:** a distinctive pattern for auto-computed amounts (e.g. an even split's per-person share) — shown as a dashed-border, muted-text input using the native `placeholder` attribute rather than a real value, so a first keystroke replaces rather than appends.

### Badges
- **"New" badge:** small pill, `emerald-100` background / `emerald-700` text in light mode (`emerald-900/40` / `emerald-400` in dark mode), uppercase, tracked — the only filled-background use of a semantic color in the system.
- **Warning glyph:** a bare `⚠` character in `amber-500`/`amber-600`, used inline next to a description — never a filled badge, just a small attention mark with a tooltip.

### Navigation
- No persistent nav bar or sidebar anywhere in the app. Each page opens with a plain text back-link ("← Back to {group name}") top-left, and a single-column, mobile-first layout throughout. A one-line footer ("Splitto is free, open, and private…") plus a small Light/Dark toggle is the only persistent chrome.

### Theme Toggle
- **Style:** a two-segment pill (Light / Dark), matching the neutral border/radius vocabulary used everywhere else — no new shape or color introduced for it.
- **Behavior:** an explicit per-device choice stored in `localStorage`, not just a passive reflection of system preference. Defaults to system preference on a device's first visit, then remembers whatever the person picks — same "per-device, not per-account" pattern as the remembered last payer and last-visited timestamp.

## 6. Do's and Don'ts

### Do:
- **Do** spend terracotta only on the primary button and "Paid by X" — nowhere else.
- **Do** keep the semantic colors spent only on meaning: green for owed-to-you, red for owed-by-you, amber for an estimate or a second look — never as decoration.
- **Do** use the dashed border exclusively for settlements; every other card stays solid.
- **Do** convey depth with a single hairline border and a background-tone step, never a shadow.
- **Do** show a spinner and disable a submit button the instant its action starts, so a tap never feels ignored.

### Don't:
- **Don't** add Splitwise's busier, ad-supported feel — no toolbars, no upsell banners, no visual competition for attention against the task at hand.
- **Don't** introduce a shadow anywhere; this system has none by design.
- **Don't** add a second accent color, or spend terracotta anywhere beyond its two documented roles.
- **Don't** use the dashed-border treatment for anything other than a settlement record.
