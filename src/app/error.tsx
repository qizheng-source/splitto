"use client";

import Link from "next/link";
import { getDisplayErrorMessage } from "@/lib/errorMessages";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-20 text-center dark:bg-black">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Something went wrong</h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {getDisplayErrorMessage(error.message)}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
