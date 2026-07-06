"use client";

import { useState } from "react";

export function ShareLinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Share this link with the group
      </span>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 truncate rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={copyLink}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Anyone with this link can view and add expenses. There&apos;s no login — bookmark it to find your group again.
      </p>
    </div>
  );
}
