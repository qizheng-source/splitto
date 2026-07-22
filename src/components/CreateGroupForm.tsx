"use client";

import { useState } from "react";
import { createGroup } from "@/app/actions";
import { PINNED_CURRENCIES, OTHER_CURRENCIES } from "@/lib/currencies";
import { SubmitButton } from "@/components/SubmitButton";

export function CreateGroupForm() {
  const [participants, setParticipants] = useState(["", ""]);

  function updateParticipant(index: number, value: string) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addParticipant() {
    setParticipants((prev) => [...prev, ""]);
  }

  function removeParticipant(index: number) {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={createGroup} className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="groupName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Group name
        </label>
        <input
          id="groupName"
          name="groupName"
          type="text"
          required
          placeholder="e.g. Bali Trip 2026"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="homeCurrency" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Home currency
        </label>
        <select
          id="homeCurrency"
          name="homeCurrency"
          required
          defaultValue="SGD"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <optgroup label="Common">
            {PINNED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} — {c.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Other">
            {OTHER_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} — {c.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Participants</span>
        <div className="flex flex-col gap-2">
          {participants.map((value, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                name="participantName"
                required
                value={value}
                onChange={(e) => updateParticipant(index, e.target.value)}
                placeholder={`Person ${index + 1}`}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              {participants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="rounded-lg border border-zinc-300 px-3 text-sm text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  aria-label={`Remove participant ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addParticipant}
          className="self-start text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          + Add another person
        </button>
      </div>

      <SubmitButton
        pendingText="Creating…"
        className="mt-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        Create group
      </SubmitButton>
    </form>
  );
}
