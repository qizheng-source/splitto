import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ShareLinkBox } from "@/components/ShareLinkBox";
import { generateDueRecurringExpenses } from "@/lib/recurring";
import { addParticipant } from "@/app/actions";
import { formatMoney } from "@/lib/money";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { people: { orderBy: { createdAt: "asc" } } },
  });

  if (!group) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-zinc-50 px-6 py-20 text-center dark:bg-black">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Group not found</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Double-check the link you were given — this group doesn&apos;t exist.
        </p>
      </div>
    );
  }

  await generateDueRecurringExpenses(group.id);

  const expenses = await prisma.expense.findMany({
    where: { groupId: group.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      payers: { include: { person: true } },
      participants: { include: { person: true } },
    },
  });

  const expensesByDate = new Map<string, typeof expenses>();
  for (const expense of expenses) {
    const dateKey = expense.date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const bucket = expensesByDate.get(dateKey);
    if (bucket) {
      bucket.push(expense);
    } else {
      expensesByDate.set(dateKey, [expense]);
    }
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/group/${group.id}`;

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-20 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{group.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Home currency: {group.homeCurrency}
          </p>
        </div>

        <ShareLinkBox url={shareUrl} />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Participants
          </span>
          <ul className="flex flex-col gap-2">
            {group.people.map((person) => (
              <li
                key={person.id}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {person.name}
              </li>
            ))}
          </ul>
          <form action={addParticipant} className="flex gap-2">
            <input type="hidden" name="groupId" value={group.id} />
            <input
              type="text"
              name="name"
              required
              placeholder="Add a person"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Add
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/group/${group.id}/expenses/new`}
            className="flex-1 rounded-lg bg-zinc-900 px-5 py-3 text-center text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + Add expense
          </Link>
          <Link
            href={`/group/${group.id}/settle`}
            className="flex-1 rounded-lg border border-zinc-300 px-5 py-3 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Settle up
          </Link>
          <Link
            href={`/group/${group.id}/history`}
            className="flex-1 rounded-lg border border-zinc-300 px-5 py-3 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            History
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Expenses
          </span>
          {expenses.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">No expenses logged yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {Array.from(expensesByDate.entries()).map(([dateLabel, dayExpenses]) => (
                <div key={dateLabel} className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">{dateLabel}</span>
                  <ul className="flex flex-col gap-2">
                    {dayExpenses.map((expense) => (
                      <li key={expense.id}>
                        <Link
                          href={`/group/${group.id}/expenses/${expense.id}`}
                          className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {expense.description}
                            </span>
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {formatMoney(expense.amount.toString())} {expense.currency}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                            <span>
                              {expense.createdAt.toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              })}{" "}
                              · {expense.category}
                              {expense.isRecurring
                                ? ` · repeats ${expense.recurrenceInterval?.toLowerCase()}`
                                : ""}
                              {expense.currency !== group.homeCurrency
                                ? ` · ${formatMoney(expense.convertedAmount.toString())} ${group.homeCurrency}`
                                : ""}
                            </span>
                            <span>
                              Paid by {expense.payers.map((p) => p.person.name).join(", ")}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
