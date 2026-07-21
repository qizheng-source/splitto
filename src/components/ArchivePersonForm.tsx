"use client";

import { archiveParticipant } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function ArchivePersonForm({
  groupId,
  personId,
  personName,
}: {
  groupId: string;
  personId: string;
  personName: string;
}) {
  return (
    <form
      action={archiveParticipant}
      onSubmit={(e) => {
        if (
          !confirm(
            `Archive ${personName}? They'll be hidden from new expenses, but all their history stays intact.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="personId" value={personId} />
      <SubmitButton
        pendingText="Archiving…"
        className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Archive
      </SubmitButton>
    </form>
  );
}
