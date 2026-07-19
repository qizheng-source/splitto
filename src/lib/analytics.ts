import { toCents } from "@/lib/money";
import { distributeProportionally } from "@/lib/splitting";

type ExpenseForAnalytics = {
  date: Date;
  category: string | null;
  convertedAmount: { toString(): string };
  participants: { personId: string; owedAmount: { toString(): string }; person: { name: string } }[];
};

export type CategoryTotal = { category: string; cents: number };
export type PersonTotal = { personId: string; name: string; cents: number };
export type DayTotal = { dateKey: string; label: string; cents: number };

const UNCATEGORIZED = "Uncategorized";

/** Total spend per category, in home-currency cents, sorted descending. */
export function totalsByCategory(expenses: ExpenseForAnalytics[]): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const category = expense.category ?? UNCATEGORIZED;
    const cents = toCents(expense.convertedAmount.toString());
    totals.set(category, (totals.get(category) ?? 0) + cents);
  }
  return Array.from(totals.entries())
    .map(([category, cents]) => ({ category, cents }))
    .sort((a, b) => b.cents - a.cents);
}

/**
 * Total spend per person, in home-currency cents — attributed by each
 * person's *share of the bill* (participant owed amount), not who paid,
 * since "spending" here means what a person actually consumed.
 */
export function totalsByPerson(expenses: ExpenseForAnalytics[]): PersonTotal[] {
  const totals = new Map<string, { name: string; cents: number }>();
  for (const expense of expenses) {
    const convertedTotalCents = toCents(expense.convertedAmount.toString());
    const shares = distributeProportionally(
      convertedTotalCents,
      expense.participants.map((p) => toCents(p.owedAmount.toString()))
    );
    expense.participants.forEach((participant, i) => {
      const existing = totals.get(participant.personId);
      totals.set(participant.personId, {
        name: participant.person.name,
        cents: (existing?.cents ?? 0) + shares[i],
      });
    });
  }
  return Array.from(totals.entries())
    .map(([personId, { name, cents }]) => ({ personId, name, cents }))
    .sort((a, b) => b.cents - a.cents);
}

/** Total spend per day, in home-currency cents, in chronological order. */
export function totalsByDay(expenses: ExpenseForAnalytics[]): DayTotal[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const dateKey = expense.date.toISOString().slice(0, 10);
    const cents = toCents(expense.convertedAmount.toString());
    totals.set(dateKey, (totals.get(dateKey) ?? 0) + cents);
  }
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, cents]) => ({
      dateKey,
      label: new Date(dateKey).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      cents,
    }));
}
