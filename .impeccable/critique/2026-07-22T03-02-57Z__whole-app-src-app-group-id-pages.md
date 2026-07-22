---
target: whole app (core Splitto pages)
total_score: 22
p0_count: 2
p1_count: 3
timestamp: 2026-07-22T03-02-57Z
slug: whole-app-src-app-group-id-pages
---
**Method: dual-agent (A: af294f98ba4e76348 · B: ad9811aac3a41f5cc)** — both agents ran independently, without seeing each other's output. Neither had browser automation available, so this is a rigorous static/source-level critique, not a visual/rendered inspection.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Consistent spinner+pending-text on every submit; chart hover gives zero touch feedback |
| 2 | Match Between System and Real World | 3 | Copy is plain and situational; delete-dialog copy contradicts real behavior |
| 3 | User Control and Freedom | 2 | Undo/restore infrastructure is real and good, but the delete confirm dialog tells users the opposite |
| 4 | Consistency and Standards | 2 | Shadows and dashed-borders appear in places that directly contradict DESIGN.md's own written rules |
| 5 | Error Prevention | 1 | Exact-split mismatch is shown as text but doesn't block submit — server then throws |
| 6 | Recognition Rather Than Recall | 3 | Placeholder-as-computed-value pattern, remembered last payer/currency |
| 7 | Flexibility and Efficiency of Use | 2 | No memory of "usual split type" per group; single long linear form |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained palette matches the brief; Add Expense form is dense by the time everything's showing |
| 9 | Error Recovery | 1 | Raw internal error strings ("Missing settlement id.") render verbatim on a full-page crash |
| 10 | Help and Documentation | 2 | Fits a no-manual product, but the four split types get no upfront explanation |
| **Total** | | **22/40** | **Acceptable — significant improvements needed before users are happy** |

## Anti-Patterns Verdict

**LLM assessment**: No AI-slop tells. Where a Linear/Stripe-fluent user would pause: shadows and dashed-borders appearing in exactly the places DESIGN.md says they never should.

**Deterministic scan**: detect.mjs found 4 real issues (no false positives). Notably, the app's body text isn't actually rendering in Geist Sans at all — `layout.tsx` loads Geist as CSS variables, but `<body>`'s className never applies them, and `globals.css` has a literal, unconditional `font-family: Arial, Helvetica, sans-serif` on body. Confirmed live via curl. Second finding: the "New" badge uses a `text-[10px]` size off the documented type scale (only 12px/14px/24px are supposed to exist).

**Visual overlays**: Not available — no browser automation tool in this session.

## Overall Impression

The underlying engineering (soft-delete, undo, per-device memory, flag-don't-block) is genuinely disciplined and matches what PRODUCT.md promises. But several of the app's own safety features are being actively undermined by copy or missing wiring — the delete-confirm dialog lies about irreversibility, and the actual body font silently isn't the one the design system documents.

## What's Working

1. Placeholder-as-computed-value in Exact split — real dashed/muted placeholder text, not a fake pre-filled value.
2. Per-device memory used exactly where the no-accounts model demands it — last payer, last currency, last-visit "New" badges — each fails gracefully.
3. Flag-don't-block is genuinely consistent for the two cases it's meant for (fallback exchange rate, possible duplicate).

## Priority Issues

**[P0] Delete confirmation dialog claims deletion is permanent — it isn't.**
Why it matters: fires at the exact moment (money records) fear is costliest, for an action that's fully soft-deleted and restorable.
Fix: Change the copy to something true — `Delete "${description}"? You can restore it later from Deleted items.`
Suggested command: /impeccable clarify

**[P0] A recoverable-looking form error actually crashes the page and discards everything typed.**
Why it matters: Exact-split total-mismatch warning is display-only — submit isn't disabled for it. Server throws, lands on the generic crash page, all input lost.
Fix: Disable submit under the same condition already used for payer mismatch.
Suggested command: /impeccable harden

**[P1] The app isn't actually rendering in its documented font.**
Why it matters: body has a literal, unconditional font-family: Arial — Geist Sans is never applied to it.
Fix: Apply the font-sans utility (or CSS var) to body in globals.css.
Suggested command: /impeccable typeset

**[P1] Raw, developer-facing error strings render verbatim to end users on a crash.**
Why it matters: error.tsx prints error.message unfiltered; several thrown strings are written for a developer, not a friend mid-trip.
Fix: Map expected errors to plain-language copy; generic fallback for anything unexpected.
Suggested command: /impeccable harden

**[P1] The share link is hidden by default right after group creation.**
Why it matters: sits inside a closed <details>, with no cue anything actionable is inside, right when a new group creator most needs it.
Fix: Auto-expand on a group's first visit, or promote the share box above the fold when there's only one participant.
Suggested command: /impeccable onboard

**[P2] Chart tooltips are unusable on mobile — the app's primary platform.**
Why it matters: only interactivity is onMouseEnter; no way to see an individual day's amount on a touch device.
Fix: Add a tap handler, or show compact value labels by default.
Suggested command: /impeccable adapt

**[P3] Icon-only remove buttons are missing aria-labels that exist elsewhere in the same app.**
Fix: Add aria-labels matching the pattern already used in CreateGroupForm.tsx.
Suggested command: /impeccable audit

## Persona Red Flags

**Jordan (first-timer)**: Opens Add Expense and sees all nine sections at once before any submit button.

**Casey (mobile)**: Can see the trend chart's line shape but can never learn "how much did we spend on July 14th."

**"Mei" (project-specific — trip group of 5, phone-only, no account)**: Taps Delete by accident, panics at the "can't be undone" dialog, cancels, and avoids the delete control for the rest of the trip.

## Minor Observations

- "Mark as paid" has no confirm/undo, inconsistent with how carefully undo is handled elsewhere.
- Archived-people cards and the receipt dropzone both use the dashed border — reserved by DESIGN.md exclusively for settlements.
- No way to remove an already-attached receipt, only replace it.

## Questions to Consider

1. If the entire safety net exists so nobody's "afraid to make a change," why does the one moment a user confronts that decision tell them the opposite?
2. Is "zero friction beats feature completeness" still true for the Add Expense screen specifically, given it now has more surface area than Splitwise's own equivalent?
