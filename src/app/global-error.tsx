"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { getDisplayErrorMessage } from "@/lib/errorMessages";

// This file replaces the entire root layout (including <html>/<body>) when
// something above it throws, so it can't inherit layout.tsx's font setup —
// it has to load Geist itself, or the app's worst-case crash screen would be
// the one page that doesn't look like Splitto at all.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-20 text-center dark:bg-black">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Something went wrong</h1>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            {getDisplayErrorMessage(error.message)}
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
