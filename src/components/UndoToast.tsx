"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { restoreExpense, restoreSettlement } from "@/app/actions";

/**
 * A brief "X deleted. Undo" banner shown right after a delete, driven by a
 * query param on the redirect target (e.g. ?deletedExpense=123) rather than
 * client state, since the delete itself is a full page navigation. The
 * underlying soft-deleted record is never actually gone — it's always also
 * reachable from the "Deleted items" page, even after this toast disappears.
 */
export function UndoToast({
  groupId,
  type,
  id,
  label,
}: {
  groupId: string;
  type: "expense" | "settlement";
  id: string;
  label: string;
}) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Strip the query param immediately so reloading or navigating back
    // doesn't keep re-showing a toast for an already-handled deletion.
    router.replace(pathname, { scroll: false });
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  const action = type === "expense" ? restoreExpense : restoreSettlement;
  const idFieldName = type === "expense" ? "expenseId" : "settlementId";

  return (
    <div className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      <span className="text-zinc-800 dark:text-zinc-200">{label} deleted.</span>
      <div className="flex items-center gap-3">
        <form action={action}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name={idFieldName} value={id} />
          <button
            type="submit"
            onClick={() => setVisible(false)}
            className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
          >
            Undo
          </button>
        </form>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
