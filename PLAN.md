# PLAN.md — App Group Money Tracking

Status: APPROVED (2026-07-05).

## Tech stack (decided)
- Framework: Next.js (React) — handles both frontend and backend in one project
- Database: PostgreSQL, hosted free via Neon (or Supabase as backup option)
- ORM: Prisma — lets code talk to the database without hand-written SQL
- Hosting: Vercel free tier — gives a real public shareable link
- Exchange rates: a free currency exchange rate API (e.g. exchangerate-api.com or similar), fetched live when an expense is logged

## Build order

### Phase 0 — Project setup
- [x] Initialize a Next.js project in the target folder
- [x] Set up Prisma + connect to a free hosted Postgres database (Neon)
- [x] Set up basic project structure (pages/routes, components folder, styles)
- [x] Confirm the app runs locally and can be viewed in a browser

### Phase 1 — Data model
- [x] Design database tables: Group, Person (participant, no login), Expense, ExpenseItem (for item-level splits), Payment/Settlement
- [x] Include fields for: currency per expense, category tag, receipt photo URL, recurring flag/schedule
- [x] Run first Prisma migration to create these tables

### Phase 2 — Group creation & sharing
- [x] "Create a group" flow: name the group, add participant names (no accounts)
- [x] Generate a unique, hard-to-guess shareable link per group
- [x] Visiting the link loads that group's shared view — this is how everyone accesses it (no login)
- [x] Add participants to a group after creation (added post-Phase-3, in response to a gap noticed while testing)

### Phase 3 — Expense entry
- [x] "Add expense" form: amount, currency, description, date, who paid, who's included
- [x] Even split option
- [x] Item-level split option (break bill into line items, assign each to specific people)
- [x] Exact-amount split option
- [x] Category tag on each expense
- [x] Receipt photo upload/attachment (UI built; actual storage upload deferred to Phase 8 per decision)
- [x] Recurring expense option (repeats weekly/monthly automatically)

### Phase 4 — Currency handling
- [x] Currency picker with SGD + common Singaporean travel/work destinations pinned at top, full list available
- [x] Live exchange rate fetched automatically at expense entry time, converting into the group's home currency
- [x] Store both original currency amount and converted amount per expense

### Phase 5 — Balances & settling up
- [x] Calculate each person's running balance (what they've paid vs. what they owe)
- [x] Debt simplification algorithm — minimize number of payments needed to settle the group
- [x] "Settle up" view showing simplified who-owes-whom, with a "Mark as paid" action recording a Settlement
- [x] Edit/delete an existing expense (added post-Phase-5, gap noticed while testing)

### Phase 6 — History & analytics
- [x] Searchable/filterable expense history list (by person, date range, category)
- [x] Charts: spending by category, spending by person, spending over time
- [x] Group totals dashboard/summary view

### Phase 7 — Visual polish
- [x] Apply minimal & clean visual style consistently across all pages
- [x] Mobile-responsive layout check (since no dedicated mobile app, browser must work well on phones)

### Phase 8 — Privacy & deployment
- [ ] Confirm no analytics/ad trackers, no data resale — plain-language privacy note in the app footer
- [ ] Deploy to Vercel, connect production database
- [ ] Test full flow end-to-end: create group → share link → add expenses → view balances → settle up

## Accounts/keys needed (all free tier for this project's scale)
- GitHub — hosts the code
- Vercel — hosting/deployment (connects to GitHub)
- Neon — free Postgres database (gives a connection string)
- Exchange rate API — free-tier key (e.g. exchangerate-api.com)
- Vercel Blob or Cloudinary — free tier, for receipt photo storage

## Out of scope for v1 (can revisit later)
- Optional user accounts / cross-device group sync
- Native mobile app
- Percentage-based splitting (whole-number shares split was added post-launch — see SPEC.md §2)

---
## Notes
- This plan is meant to be handed to Claude Code (or built here) step by step, checking off items as they're completed.
- Visual style, currency list, and other preferences are already locked in from SPEC.md — no need to re-ask during implementation unless something new comes up.
