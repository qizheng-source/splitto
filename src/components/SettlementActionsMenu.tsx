"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deleteSettlement } from "@/app/actions";

export function SettlementActionsMenu({
  groupId,
  settlementId,
}: {
  groupId: string;
  settlementId: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Settlement actions"
        className="rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 flex w-28 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <Link
            href={`/group/${groupId}/settlements/${settlementId}/edit`}
            className="px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => setOpen(false)}
          >
            Edit
          </Link>
          <form
            action={deleteSettlement}
            onSubmit={(e) => {
              if (!confirm("Delete this settlement? This can't be undone.")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="groupId" value={groupId} />
            <input type="hidden" name="settlementId" value={settlementId} />
            <button
              type="submit"
              className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Delete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
