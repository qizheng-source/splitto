import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { restoreExpense, restoreSettlement } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function DeletedItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) notFound();

  // Neither query depends on the other's result — both only need group.id —
  // so they run concurrently instead of one after another.
  const [deletedExpenses, deletedSettlements] = await Promise.all([
    prisma.expense.findMany({
      where: { groupId: group.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      include: { payers: { include: { person: true } } },
    }),
    prisma.settlement.findMany({
      where: { groupId: group.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      include: { fromPerson: true, toPerson: true },
    }),
  ]);

  type DeletedItem =
    | { type: "expense"; deletedAt: Date; expense: (typeof deletedExpenses)[number] }
    | { type: "settlement"; deletedAt: Date; settlement: (typeof deletedSettlements)[number] };

  const items: DeletedItem[] = [
    ...deletedExpenses.map((expense): DeletedItem => ({
      type: "expense",
      deletedAt: expense.deletedAt!,
      expense,
    })),
    ...deletedSettlements.map((settlement): DeletedItem => ({
      type: "settlement",
      deletedAt: settlement.deletedAt!,
      settlement,
    })),
  ].sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-0.5">
          <Link href={`/group/${group.id}/history`} className="text-sm text-zinc-500 dark:text-zinc-400">
            ← Back to History
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
            Deleted items
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nothing here is ever purged automatically — restore anything, anytime.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">Nothing has been deleted yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) =>
              item.type === "expense" ? (
                <li
                  key={`expense-${item.expense.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.expense.description}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatMoney(item.expense.amount.toString())} {item.expense.currency} · deleted{" "}
                      {item.deletedAt.toLocaleDateString()}
                    </span>
                  </div>
                  <form action={restoreExpense}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="expenseId" value={item.expense.id} />
                    <SubmitButton
                      pendingText="Restoring…"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Restore
                    </SubmitButton>
                  </form>
                </li>
              ) : (
                <li
                  key={`settlement-${item.settlement.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.settlement.fromPerson.name} → {item.settlement.toPerson.name}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatMoney(item.settlement.amount.toString())} {item.settlement.currency} ·
                      deleted {item.deletedAt.toLocaleDateString()}
                    </span>
                  </div>
                  <form action={restoreSettlement}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="settlementId" value={item.settlement.id} />
                    <SubmitButton
                      pendingText="Restoring…"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Restore
                    </SubmitButton>
                  </form>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
