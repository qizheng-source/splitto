import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { ExpenseActionsMenu } from "@/components/ExpenseActionsMenu";
import { findPotentialDuplicates } from "@/lib/duplicates";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id, expenseId } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) notFound();

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      payers: { include: { person: true } },
      participants: { include: { person: true } },
      items: { include: { assignments: { include: { person: true } } } },
    },
  });
  if (!expense || expense.groupId !== group.id || expense.deletedAt) notFound();

  const potentialDuplicates = await findPotentialDuplicates({
    groupId: group.id,
    expenseId: expense.id,
    amount: expense.amount.toString(),
    currency: expense.currency,
    date: expense.date,
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/group/${group.id}`}
            className="text-sm text-zinc-500 dark:text-zinc-400"
            aria-label="Back to group"
          >
            ← Back
          </Link>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Expense</span>
          <ExpenseActionsMenu groupId={group.id} expenseId={expense.id} />
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {expense.category && (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {expense.category}
            </span>
          )}
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {expense.description}
          </span>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMoney(expense.amount.toString())} {expense.currency}
          </span>
          {expense.currency !== group.homeCurrency && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              ≈ {formatMoney(expense.convertedAmount.toString())} {group.homeCurrency} · 1{" "}
              {expense.currency} = {group.homeCurrency} {Number(expense.exchangeRate).toFixed(4)}
              {expense.exchangeRateIsFallback && (
                <span className="ml-1 text-amber-600 dark:text-amber-500">
                  (estimated — live rate was unavailable)
                </span>
              )}
            </span>
          )}
          {expense.isRecurring && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Repeats {expense.recurrenceInterval?.toLowerCase()}
              {expense.recurrenceEndDate
                ? ` until ${expense.recurrenceEndDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : ""}
            </span>
          )}
          <span className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Paid by {expense.payers.map((p) => p.person.name).join(", ")} on{" "}
            {expense.date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-600">
            Logged{" "}
            {expense.createdAt.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          {expense.receiptUrl && (
            <a
              href={expense.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-sm font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
            >
              View receipt
            </a>
          )}
        </div>

        {potentialDuplicates.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950">
            <span className="font-medium text-amber-800 dark:text-amber-400">
              ⚠ This might be a duplicate
            </span>
            <p className="text-amber-700 dark:text-amber-500">
              Same amount ({formatMoney(expense.amount.toString())} {expense.currency}) was also logged
              on the same day as:
            </p>
            <ul className="flex flex-col gap-1">
              {potentialDuplicates.map((dup) => (
                <li key={dup.id}>
                  <Link
                    href={`/group/${group.id}/expenses/${dup.id}`}
                    className="font-medium text-amber-800 underline underline-offset-2 dark:text-amber-400"
                  >
                    &quot;{dup.description}&quot;
                  </Link>
                  {dup.payerNames.length > 0 && (
                    <span className="text-amber-700 dark:text-amber-500">
                      {" "}
                      — paid by {dup.payerNames.join(", ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {expense.splitType === "ITEM" && expense.items.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Items
            </span>
            <ul className="flex flex-col gap-2">
              {expense.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {item.description}
                    <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.assignments.map((a) => a.person.name).join(", ")}
                    </span>
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {formatMoney(item.amount.toString())} {expense.currency}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {expense.participants.length} participants
          </span>
          <ul className="flex flex-col gap-2">
            {expense.participants.map((participant) => (
              <li
                key={participant.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="text-zinc-800 dark:text-zinc-200">{participant.person.name}</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {formatMoney(participant.owedAmount.toString())} {expense.currency}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
