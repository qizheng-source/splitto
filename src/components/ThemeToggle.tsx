"use client";

import { useEffect, useState } from "react";

// Per-device (localStorage), not the shared database — matches the app's
// existing pattern for things like last-payer and last-visit, since there
// are no accounts to hang a preference off of.
function themeKey() {
  return "splitto:theme";
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("light", !dark);
  localStorage.setItem(themeKey(), dark ? "dark" : "light");
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  // The boot script in layout.tsx already applied the right class before
  // this component mounts — read it back rather than guessing, so the
  // toggle's own displayed state can't disagree with what's on screen.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  if (isDark === null) return null;

  return (
    <div className="inline-flex gap-0.5 rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => {
          applyTheme(false);
          setIsDark(false);
        }}
        aria-pressed={!isDark}
        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
          !isDark
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => {
          applyTheme(true);
          setIsDark(true);
        }}
        aria-pressed={isDark}
        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
          isDark
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        Dark
      </button>
    </div>
  );
}
