"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-20 text-center">
          <h1 className="text-xl font-semibold text-zinc-900">Something went wrong</h1>
          <p className="max-w-sm text-sm text-zinc-500">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
