import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addParticipant } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AddPeoplePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { people: { orderBy: { createdAt: "asc" } } },
  });
  if (!group) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-0.5">
          <Link href={`/group/${group.id}`} className="text-sm text-zinc-500 dark:text-zinc-400">
            ← Back to {group.name}
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
            Add people
          </h1>
        </div>

        <form action={addParticipant} className="flex gap-2">
          <input type="hidden" name="groupId" value={group.id} />
          <input
            type="text"
            name="name"
            required
            autoFocus
            placeholder="Add a person"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <SubmitButton
            pendingText="Adding…"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add
          </SubmitButton>
        </form>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Currently in this group
            </span>
            <Link
              href={`/group/${group.id}/settings`}
              className="text-xs font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
            >
              Manage
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {group.people.map((person) => (
              <li
                key={person.id}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {person.name}
                {person.archivedAt ? " (archived)" : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
