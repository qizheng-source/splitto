"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type FeedExpense = {
  type: "expense";
  id: string;
  createdAtIso: string;
  description: string;
  amountLabel: string;
  currency: string;
  metaLine: string;
  paidByLabel: string;
  isDuplicate: boolean;
};

export type FeedSettlement = {
  type: "settlement";
  id: string;
  createdAtIso: string;
  fromToLabel: string;
  amountLabel: string;
  currency: string;
  timeLabel: string;
};

export type FeedItem = FeedExpense | FeedSettlement;
export type FeedDateGroup = { dateLabel: string; items: FeedItem[] };

// Per-device (localStorage), not the shared database — there are no accounts,
// so "what have I already seen" is only ever known per browser, same idea as
// the remembered "who paid" default.
function lastVisitKey(groupId: string) {
  return `splitto:lastVisited:${groupId}`;
}

export function GroupActivityFeed({ groupId, groups }: { groupId: string; groups: FeedDateGroup[] }) {
  const [cutoff, setCutoff] = useState<string | null>(null);

  // Read the OLD "last visited" timestamp once (before overwriting it), so
  // items created since then can be flagged — then only after reading it,
  // stamp the current time for next visit.
  useEffect(() => {
    const key = lastVisitKey(groupId);
    const stored = localStorage.getItem(key);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCutoff(stored);
    localStorage.setItem(key, new Date().toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Before the effect runs (server render + first paint) and on a device's
  // very first-ever visit, there's no cutoff — nothing is "new" yet, rather
  // than flagging every single item as new, which would just be noise.
  function isNew(createdAtIso: string) {
    return cutoff !== null && createdAtIso > cutoff;
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.dateLabel} className="flex flex-col gap-2">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">{group.dateLabel}</span>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) =>
              item.type === "expense" ? (
                <li key={`expense-${item.id}`}>
                  <Link
                    href={`/group/${groupId}/expenses/${item.id}`}
                    className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {isNew(item.createdAtIso) && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            New
                          </span>
                        )}
                        {item.description}
                        {item.isDuplicate && (
                          <span
                            title="Might be a duplicate — same amount and day as another expense"
                            className="text-amber-500"
                          >
                            ⚠
                          </span>
                        )}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {item.amountLabel} {item.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{item.metaLine}</span>
                      <span>{item.paidByLabel}</span>
                    </div>
                  </Link>
                </li>
              ) : (
                <li key={`settlement-${item.id}`}>
                  <Link
                    href={`/group/${groupId}/settlements/${item.id}`}
                    className="flex flex-col gap-1 rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {isNew(item.createdAtIso) && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            New
                          </span>
                        )}
                        {item.fromToLabel}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {item.amountLabel} {item.currency}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.timeLabel} · Settlement
                    </div>
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
