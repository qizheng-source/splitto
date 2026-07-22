import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ShareLinkBox } from "@/components/ShareLinkBox";
import { generateDueRecurringExpenses } from "@/lib/recurring";
import { formatMoney } from "@/lib/money";
import { UndoToast } from "@/components/UndoToast";
import { findDuplicateExpenseIds } from "@/lib/duplicates";
import { GroupActivityFeed, type FeedDateGroup, type FeedItem } from "@/components/GroupActivityFeed";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ deletedExpense?: string }>;
}) {
  const { id } = await params;
  const { deletedExpense } = await searchParams;

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

  const activePeople = group.people.filter((p) => !p.archivedAt);

  await generateDueRecurringExpenses(group.id);

  // These three don't depend on each other — only on group.id, which is
  // already known — so they run concurrently instead of one after another.
  const [deletedExpenseRecord, expenses, settlements] = await Promise.all([
    deletedExpense
      ? prisma.expense.findUnique({
          where: { id: deletedExpense },
          select: { description: true },
        })
      : Promise.resolve(null),
    prisma.expense.findMany({
      where: { groupId: group.id, deletedAt: null },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        payers: { include: { person: true } },
        participants: { include: { person: true } },
      },
    }),
    prisma.settlement.findMany({
      where: { groupId: group.id, deletedAt: null },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: { fromPerson: true, toPerson: true },
    }),
  ]);

  const duplicateExpenseIds = findDuplicateExpenseIds(
    expenses.map((e) => ({ id: e.id, amount: e.amount.toString(), currency: e.currency, date: e.date }))
  );

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

  const feedGroupsByDate = new Map<string, FeedItem[]>();
  for (const tx of transactions) {
    const dateKey = tx.date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const item: FeedItem =
      tx.type === "expense"
        ? {
            type: "expense",
            id: tx.expense.id,
            createdAtIso: tx.expense.createdAt.toISOString(),
            description: tx.expense.description,
            amountLabel: formatMoney(tx.expense.amount.toString()),
            currency: tx.expense.currency,
            metaLine: [
              tx.expense.createdAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
              tx.expense.category,
              tx.expense.isRecurring ? `repeats ${tx.expense.recurrenceInterval?.toLowerCase()}` : null,
              tx.expense.currency !== group.homeCurrency
                ? `${formatMoney(tx.expense.convertedAmount.toString())} ${group.homeCurrency}`
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            paidByLabel: `Paid by ${tx.expense.payers.map((p) => p.person.name).join(", ")}`,
            isDuplicate: duplicateExpenseIds.has(tx.expense.id),
          }
        : {
            type: "settlement",
            id: tx.settlement.id,
            createdAtIso: tx.settlement.createdAt.toISOString(),
            fromToLabel: `${tx.settlement.fromPerson.name} → ${tx.settlement.toPerson.name}`,
            amountLabel: formatMoney(tx.settlement.amount.toString()),
            currency: tx.settlement.currency,
            timeLabel: tx.settlement.createdAt.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            }),
          };

    const bucket = feedGroupsByDate.get(dateKey);
    if (bucket) {
      bucket.push(item);
    } else {
      feedGroupsByDate.set(dateKey, [item]);
    }
  }

  const feedGroups: FeedDateGroup[] = Array.from(feedGroupsByDate.entries()).map(
    ([dateLabel, items]) => ({ dateLabel, items })
  );

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/group/${group.id}`;

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-8 dark:bg-black sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{group.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Home currency: {group.homeCurrency}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/group/${group.id}/expenses/new`}
            className="rounded-lg bg-accent px-5 py-3.5 text-center text-sm font-semibold text-accent-ink hover:bg-accent-hover"
          >
            + Add expense
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/group/${group.id}/people/new`}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              + Add person
            </Link>
            <Link
              href={`/group/${group.id}/settle`}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Settle up
            </Link>
            <Link
              href={`/group/${group.id}/history`}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              History
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">No activity yet — add your first expense.</p>
          ) : (
            <GroupActivityFeed groupId={group.id} groups={feedGroups} />
          )}
        </div>

        <details
          open={activePeople.length <= 1}
          className="group flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Participants · Share link
          </summary>
          <div className="mt-3 flex flex-col gap-4">
            <ShareLinkBox url={shareUrl} />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Participants
                </span>
                <Link
                  href={`/group/${group.id}/settings`}
                  className="text-xs font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
                >
                  Group settings
                </Link>
              </div>
              <ul className="flex flex-col gap-2">
                {activePeople.map((person) => (
                  <li
                    key={person.id}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    {person.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>
      {deletedExpense && deletedExpenseRecord && (
        <UndoToast
          groupId={group.id}
          type="expense"
          id={deletedExpense}
          label={`"${deletedExpenseRecord.description}"`}
        />
      )}
    </div>
  );
}
