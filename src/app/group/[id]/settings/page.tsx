import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PINNED_CURRENCIES, OTHER_CURRENCIES } from "@/lib/currencies";
import { updateGroupSettings, restoreParticipant } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ArchivePersonForm } from "@/components/ArchivePersonForm";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Neither query depends on the other's result — both only need the route
  // param `id` — so they run concurrently instead of one after another.
  const [group, expenseCount] = await Promise.all([
    prisma.group.findUnique({
      where: { id },
      include: { people: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.expense.count({ where: { groupId: id } }),
  ]);
  if (!group) notFound();

  const everHadAnExpense = expenseCount > 0;

  const activePeople = group.people.filter((p) => !p.archivedAt);
  const archivedPeople = group.people.filter((p) => p.archivedAt);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-0.5">
          <Link href={`/group/${group.id}`} className="text-sm text-zinc-500 dark:text-zinc-400">
            ← Back to {group.name}
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
            Group settings
          </h1>
        </div>

        <form
          action={updateGroupSettings}
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <input type="hidden" name="groupId" value={group.id} />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Group name</label>
            <input
              name="name"
              required
              defaultValue={group.name}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Home currency</label>
            {everHadAnExpense ? (
              <>
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  {group.homeCurrency} (locked)
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600">
                  Home currency can&apos;t change once a group has expenses — every past conversion
                  was calculated against it.
                </p>
              </>
            ) : (
              <select
                name="homeCurrency"
                defaultValue={group.homeCurrency}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <optgroup label="Common">
                  {PINNED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other">
                  {OTHER_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>

          <SubmitButton
            pendingText="Saving…"
            className="mt-1 self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Save changes
          </SubmitButton>
        </form>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Participants
            </span>
            <Link
              href={`/group/${group.id}/people/new`}
              className="text-xs font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
            >
              + Add person
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {activePeople.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {person.name}
                <ArchivePersonForm groupId={group.id} personId={person.id} personName={person.name} />
              </li>
            ))}
          </ul>
        </div>

        {archivedPeople.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Archived
            </span>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Hidden from new expenses, but their past expenses and balances still count normally.
            </p>
            <ul className="flex flex-col gap-2">
              {archivedPeople.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                >
                  {person.name}
                  <form action={restoreParticipant}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="personId" value={person.id} />
                    <SubmitButton
                      pendingText="Restoring…"
                      className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Restore
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
