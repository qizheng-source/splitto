import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, fromCents, toCents } from "@/lib/money";
import { totalsByCategory, totalsByPerson, totalsByDay } from "@/lib/analytics";
import { EXPENSE_CATEGORIES } from "@/lib/currencies";
import { BarChart } from "@/components/charts/BarChart";
import { TrendChart } from "@/components/charts/TrendChart";
import type { Prisma } from "@/generated/prisma/client";
import { UndoToast } from "@/components/UndoToast";
import { findDuplicateExpenseIds } from "@/lib/duplicates";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    personId?: string;
    category?: string;
    from?: string;
    to?: string;
    search?: string;
    deletedSettlement?: string;
  }>;
}) {
  const { id } = await params;
  const filters = await searchParams;
  const { deletedSettlement } = filters;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { people: { orderBy: { createdAt: "asc" } } },
  });
  if (!group) notFound();

  const deletedSettlementRecord = deletedSettlement
    ? await prisma.settlement.findUnique({
        where: { id: deletedSettlement },
        include: { fromPerson: true, toPerson: true },
      })
    : null;

  const where: Prisma.ExpenseWhereInput = { groupId: group.id, deletedAt: null };
  if (filters.category) where.category = filters.category;
  if (filters.search) where.description = { contains: filters.search, mode: "insensitive" };
  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  if (filters.personId) {
    where.OR = [
      { payers: { some: { personId: filters.personId } } },
      { participants: { some: { personId: filters.personId } } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      payers: { include: { person: true } },
      participants: { include: { person: true } },
    },
  });

  // Settlements aren't spending (no category or description), so they're
  // excluded from the list when a category or text search filter is active,
  // and never affect the charts.
  const settlementsWhere: Prisma.SettlementWhereInput = { groupId: group.id, deletedAt: null };
  if (filters.from || filters.to) {
    settlementsWhere.date = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  if (filters.personId) {
    settlementsWhere.OR = [{ fromPersonId: filters.personId }, { toPersonId: filters.personId }];
  }
  const settlements = filters.category || filters.search
    ? []
    : await prisma.settlement.findMany({
        where: settlementsWhere,
        orderBy: [{ date: "desc" }, { id: "desc" }],
        include: { fromPerson: true, toPerson: true },
      });

  const duplicateExpenseIds = findDuplicateExpenseIds(
    expenses.map((e) => ({ id: e.id, amount: e.amount.toString(), currency: e.currency, date: e.date }))
  );

  const categoryTotals = totalsByCategory(expenses);
  const personTotals = totalsByPerson(expenses);
  const dayTotals = totalsByDay(expenses);
  const totalCents = expenses.reduce((sum, e) => sum + toCents(e.convertedAmount.toString()), 0);

  type Transaction =
    | { type: "expense"; date: Date; expense: (typeof expenses)[number] }
    | { type: "settlement"; date: Date; settlement: (typeof settlements)[number] };

  const transactions: Transaction[] = [
    ...expenses.map((expense): Transaction => ({ type: "expense", date: expense.date, expense })),
    ...settlements.map((settlement): Transaction => ({
      type: "settlement",
      date: settlement.date,
      settlement,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const hasFilters = Boolean(
    filters.personId || filters.category || filters.from || filters.to || filters.search
  );

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Link href={`/group/${group.id}`} className="text-sm text-zinc-500 dark:text-zinc-400">
              ← Back to {group.name}
            </Link>
            <Link
              href={`/group/${group.id}/deleted`}
              className="text-sm text-zinc-500 underline underline-offset-2 dark:text-zinc-400"
            >
              Deleted items
            </Link>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">History &amp; analytics</h1>
        </div>

        <form className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Search</label>
            <input
              type="text"
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Search description…"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Person</label>
              <select
                name="personId"
                defaultValue={filters.personId ?? ""}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Everyone</option>
                {group.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.archivedAt ? " (archived)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</label>
              <select
                name="category"
                defaultValue={filters.category ?? ""}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">All categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">From</label>
              <input
                type="date"
                name="from"
                defaultValue={filters.from ?? ""}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">To</label>
              <input
                type="date"
                name="to"
                defaultValue={filters.to ?? ""}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Apply filters
            </button>
            {hasFilters && (
              <Link
                href={`/group/${group.id}/history`}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Total spent</span>
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {formatMoney(fromCents(totalCents))} {group.homeCurrency}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Expenses</span>
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{expenses.length}</span>
          </div>
        </div>

        <BarChart
          title="Spending by category"
          bars={categoryTotals.map((c) => ({ label: c.category, cents: c.cents }))}
          currency={group.homeCurrency}
        />
        <BarChart
          title="Spending by person"
          bars={personTotals.map((p) => ({ label: p.name, cents: p.cents }))}
          currency={group.homeCurrency}
        />
        <TrendChart
          title="Spending over time"
          points={dayTotals.map((d) => ({ label: d.label, cents: d.cents }))}
          currency={group.homeCurrency}
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Transactions
          </span>
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">Nothing matches these filters.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {transactions.map((tx) =>
                tx.type === "expense" ? (
                  <li key={`expense-${tx.expense.id}`}>
                    <Link
                      href={`/group/${group.id}/expenses/${tx.expense.id}`}
                      className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                          {tx.expense.description}
                          {duplicateExpenseIds.has(tx.expense.id) && (
                            <span
                              title="Might be a duplicate — same amount and day as another expense"
                              className="text-amber-500"
                            >
                              ⚠
                            </span>
                          )}
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {formatMoney(tx.expense.amount.toString())} {tx.expense.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>
                          {tx.expense.date.toLocaleDateString()}
                          {" · logged "}
                          {tx.expense.createdAt.toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {tx.expense.category ? ` · ${tx.expense.category}` : ""}
                        </span>
                        <span>
                          Paid by {tx.expense.payers.map((p) => p.person.name).join(", ")}
                        </span>
                      </div>
                    </Link>
                  </li>
                ) : (
                  <li key={`settlement-${tx.settlement.id}`}>
                    <Link
                      href={`/group/${group.id}/settlements/${tx.settlement.id}`}
                      className="flex flex-col gap-1 rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {tx.settlement.fromPerson.name} → {tx.settlement.toPerson.name}
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {formatMoney(tx.settlement.amount.toString())} {tx.settlement.currency}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {tx.settlement.date.toLocaleDateString()} · logged{" "}
                        {tx.settlement.createdAt.toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · Settlement
                      </div>
                    </Link>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </div>
      {deletedSettlement && deletedSettlementRecord && (
        <UndoToast
          groupId={group.id}
          type="settlement"
          id={deletedSettlement}
          label={`Settlement (${deletedSettlementRecord.fromPerson.name} → ${deletedSettlementRecord.toPerson.name})`}
        />
      )}
    </div>
  );
}
