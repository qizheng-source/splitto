# SPEC.md — App Group Money Tracking

Status: APPROVED (2026-07-05) — moving to PLAN.md next.

## 1. Expense Entry
- Add an expense with: amount, currency, description, date, payer(s), participants
- DECIDED: An expense can have multiple payers, each contributing a specific amount toward the total.
- Item-level splitting: break a single bill into line items, assign each item to specific people (Splitwise-style), rather than only splitting the whole bill evenly
- Support both quick entry (even split) and detailed entry (item-by-item)
- DECIDED: Support photo/receipt attachments on an expense.
- DECIDED: Support recurring expenses (e.g. monthly rent, subscriptions) that repeat automatically.

## 2. Splitting Logic
- Even split across selected participants
- Item-level split (assign specific items to specific people)
- DECIDED: Also support exact-amount split (manually type how much each person owes)
- DECIDED: Automatic debt simplification — minimizes the number of payments needed to settle up a group, rather than showing every individual per-expense IOU.
- DECIDED: Even split shows each included person's computed dollar share live, not just a checkbox.
- DECIDED: With a single payer, the "amount paid" field auto-fills and locks to the total (no retyping). With multiple payers, each amount is entered manually.
- DECIDED: Exact-amount split — anyone whose amount hasn't been typed in yet automatically absorbs an even share of whatever's left of the total, recalculating live as amounts are typed for others.

## 3. Group & Sharing
- Create a group with zero mandatory account creation (Tricount-style)
- One person creates a group, shares a link, others join via link — no signup required to join
- DECIDED: Fully account-less for v1. Design kept open so optional accounts (e.g. "see all my groups in one place") could be added later without a data model rewrite.
- DECIDED: Groups are found again via the bookmarked/saved link — no login, no device-tracking list.
- DECIDED: People can be added to a group at any time (not just at creation) via an "Add participant" button on the group page — anyone with the link can add a new person's name.

## 4. Currency
- Multi-currency support per group/expense (Tricount-style, useful for travel)
- DECIDED: Priority currencies are SGD plus common destinations for Singaporean travelers/workers (e.g. MYR, THB, IDR, JPY, KRW, AUD, VND, CNY, HKD, TWD, GBP, EUR, USD). Full global list still available, but these are pinned/quick-pick defaults.
- DECIDED: Live exchange rates auto-fetched at the time an expense is logged, used to convert into the group's home currency for totals.
- DECIDED: The currency picker on "Add expense" defaults to whichever currency was used most recently in that group (not always the home currency) — e.g. after the first MYR expense on a trip, it keeps defaulting to MYR.
- DECIDED: Currency dropdowns show a country flag next to each code for faster visual scanning.

## 5. Privacy & Data Storage
- No data selling, no ads (Spliit-style)
- Open, transparent approach to how data is handled
- Free, no paywalls or feature-gating
- DECIDED: Hosted, shared backend (small server + database). A group is accessed via a unique, hard-to-guess shareable link rather than a login — this is required so all members see the same live data across their own devices.

## 6. Analytics & History
- Charts/analytics showing spending patterns over time (Splitwise-style)
- Detailed, searchable expense history (filter/search past expenses)
- DECIDED: Include spending by category, by person, and over time (trend chart).
- DECIDED: Category is a fixed preset list (e.g. Food & Drink, Rent, Transport, Utilities, Entertainment, Travel, Shopping, Other) with the option to add a custom category.

## 7. UI
- Clean, simple interface (Tricount-style)
- DECIDED: Web app, responsive so it works well on phone browsers too (no app store install needed).
- DECIDED: Minimal & clean visual style — lots of whitespace, simple neutral colors, Tricount/Spliit-like feel.

---
## Clarifying questions log
1. Platform → Web app, responsive for mobile browsers.
2. Data storage → Hosted shared server + database, accessed via shareable group link.
3. Accounts → Fully account-less for v1, optional accounts possible later.
4. Priority currencies → SGD + common Singaporean travel/work destinations (MYR, THB, IDR, JPY, KRW, AUD, VND, CNY, HKD, TWD, GBP, EUR, USD), plus full global list available.
5. Exchange rates → Live rates auto-fetched at expense entry time.
6. Split types → Even, item-level, and exact-amount splits supported for v1.
7. Settling up → Debts are automatically simplified to minimize the number of payments.
8. Receipts → Photo attachments supported on expenses.
9. Recurring expenses → Supported (e.g. monthly rent, subscriptions).
10. Finding groups again → Bookmarked/saved link only, no login or device list.
11. Analytics breakdowns → By category, by person, and over time.
12. Visual style → Minimal & clean.
