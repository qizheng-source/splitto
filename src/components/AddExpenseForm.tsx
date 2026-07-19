"use client";

import { useEffect, useMemo, useState } from "react";
import { createExpense, updateExpense } from "@/app/actions";
import { ALL_CURRENCIES, EXPENSE_CATEGORIES } from "@/lib/currencies";
import { toCents, fromCents } from "@/lib/money";
import { splitEvenly, distributeProportionally } from "@/lib/splitting";
import { SubmitButton } from "@/components/SubmitButton";

type Person = { id: string; name: string };
type SplitType = "EVEN" | "EXACT" | "ITEM" | "SHARES";

type PayerRow = { personId: string; amount: string };
type ExactRow = { personId: string; included: boolean; amount: string; touched: boolean };
type ItemRow = { description: string; amount: string; personIds: string[] };
type ShareRow = { personId: string; included: boolean; shares: number };

export type InitialExpenseValues = {
  description: string;
  date: string;
  category: string;
  customCategory: string;
  currency: string;
  splitType: SplitType;
  amount: string;
  payers: PayerRow[];
  evenParticipantIds: string[];
  exactRows: ExactRow[];
  shareRows: ShareRow[];
  items: ItemRow[];
  isRecurring: boolean;
  recurrenceInterval: "WEEKLY" | "MONTHLY";
  recurrenceEndDate: string;
  receiptUrl: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Which person paid is remembered per-device (localStorage), not in the shared
// database — there are no accounts, so "who am I" is only ever known per browser.
function lastPayerKey(groupId: string) {
  return `splitto:lastPayer:${groupId}`;
}

export function AddExpenseForm({
  groupId,
  homeCurrency,
  people,
  expenseId,
  initialValues,
  defaultCurrency,
}: {
  groupId: string;
  homeCurrency: string;
  people: Person[];
  expenseId?: string;
  initialValues?: InitialExpenseValues;
  defaultCurrency?: string;
}) {
  const isEditing = Boolean(expenseId);

  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [date, setDate] = useState(initialValues?.date ?? todayISO());
  const [category, setCategory] = useState<string>(initialValues?.category ?? "");
  const [customCategory, setCustomCategory] = useState(initialValues?.customCategory ?? "");
  const [currency, setCurrency] = useState(initialValues?.currency ?? defaultCurrency ?? homeCurrency);
  const [splitType, setSplitType] = useState<SplitType>(initialValues?.splitType ?? "EVEN");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");

  const [payers, setPayers] = useState<PayerRow[]>(
    initialValues?.payers ?? [{ personId: people[0]?.id ?? "", amount: "" }]
  );

  const [evenParticipantIds, setEvenParticipantIds] = useState<string[]>(
    initialValues?.evenParticipantIds ?? people.map((p) => p.id)
  );

  const [exactRows, setExactRows] = useState<ExactRow[]>(
    initialValues?.exactRows ??
      people.map((p) => ({ personId: p.id, included: true, amount: "", touched: false }))
  );

  const [shareRows, setShareRows] = useState<ShareRow[]>(
    initialValues?.shareRows ?? people.map((p) => ({ personId: p.id, included: true, shares: 1 }))
  );

  const [items, setItems] = useState<ItemRow[]>(
    initialValues?.items ?? [{ description: "", amount: "", personIds: people.map((p) => p.id) }]
  );

  const [isRecurring, setIsRecurring] = useState(initialValues?.isRecurring ?? false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<"WEEKLY" | "MONTHLY">(
    initialValues?.recurrenceInterval ?? "MONTHLY"
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(initialValues?.recurrenceEndDate ?? "");

  // Apply this device's remembered payer once, after mount. localStorage only
  // exists in the browser, so this can't be computed during the initial render
  // without mismatching the server-rendered HTML — it must happen in an effect.
  useEffect(() => {
    if (isEditing) return;
    const remembered = localStorage.getItem(lastPayerKey(groupId));
    if (remembered && people.some((p) => p.id === remembered)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayers((prev) =>
        prev.length === 1 ? [{ ...prev[0], personId: remembered }] : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [existingReceiptUrl] = useState(initialValues?.receiptUrl ?? "");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(initialValues?.receiptUrl ?? null);

  const totalCents = useMemo(() => {
    if (splitType === "ITEM") {
      return items.reduce((sum, item) => sum + (toCents(item.amount || "0") || 0), 0);
    }
    return toCents(amount || "0") || 0;
  }, [splitType, items, amount]);

  // A single payer must, by definition, have paid the full total — so that field
  // is derived from the total rather than something the user needs to type.
  const singlePayerAmount = payers.length === 1 ? fromCents(totalCents) : null;

  const payersTotalCents = useMemo(
    () =>
      payers.reduce((sum, p) => sum + (toCents(singlePayerAmount ?? p.amount ?? "0") || 0), 0),
    [payers, singlePayerAmount]
  );

  const payersMatch = totalCents > 0 && payersTotalCents === totalCents;

  const evenShares = useMemo(
    () => (evenParticipantIds.length > 0 ? splitEvenly(totalCents, evenParticipantIds) : {}),
    [totalCents, evenParticipantIds]
  );

  // Exact split: anyone whose amount you haven't typed yet automatically absorbs
  // an even share of whatever's left, so you only ever type the amounts you know
  // and let the rest work itself out.
  const exactRemainderCents = useMemo(() => {
    const touchedCents = exactRows
      .filter((r) => r.included && r.touched)
      .reduce((sum, r) => sum + (toCents(r.amount || "0") || 0), 0);
    return totalCents - touchedCents;
  }, [exactRows, totalCents]);

  const exactUntouchedIds = useMemo(
    () => exactRows.filter((r) => r.included && !r.touched).map((r) => r.personId),
    [exactRows]
  );

  const exactAutoShares = useMemo(
    () =>
      exactUntouchedIds.length > 0
        ? splitEvenly(Math.max(exactRemainderCents, 0), exactUntouchedIds)
        : {},
    [exactUntouchedIds, exactRemainderCents]
  );

  function resolvedExactAmount(row: ExactRow): string {
    return row.touched ? row.amount : fromCents(exactAutoShares[row.personId] ?? 0);
  }

  const includedShareRows = useMemo(() => shareRows.filter((r) => r.included), [shareRows]);

  const shareAmounts = useMemo(() => {
    const distributed = distributeProportionally(
      totalCents,
      includedShareRows.map((r) => r.shares)
    );
    const result: Record<string, number> = {};
    includedShareRows.forEach((r, i) => {
      result[r.personId] = distributed[i];
    });
    return result;
  }, [totalCents, includedShareRows]);

  function addPayer() {
    setPayers((prev) => [...prev, { personId: people[0]?.id ?? "", amount: "" }]);
  }
  function removePayer(index: number) {
    setPayers((prev) => prev.filter((_, i) => i !== index));
  }
  function updatePayer(index: number, patch: Partial<PayerRow>) {
    setPayers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    if (patch.personId) {
      localStorage.setItem(lastPayerKey(groupId), patch.personId);
    }
  }

  function toggleEvenParticipant(personId: string) {
    setEvenParticipantIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  }

  function updateExactRow(personId: string, patch: Partial<ExactRow>) {
    setExactRows((prev) => prev.map((r) => (r.personId === personId ? { ...r, ...patch } : r)));
  }

  function updateExactAmount(personId: string, value: string) {
    // Once a field is being edited it stays "yours" even if briefly empty
    // while retyping — it must never snap back to the auto-filled value,
    // or clearing it to type a fresh number becomes impossible.
    updateExactRow(personId, { amount: value, touched: true });
  }

  function updateShareRow(personId: string, patch: Partial<ShareRow>) {
    setShareRows((prev) => prev.map((r) => (r.personId === personId ? { ...r, ...patch } : r)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", amount: "", personIds: people.map((p) => p.id) }]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }
  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function toggleItemPerson(index: number, personId: string) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const personIds = it.personIds.includes(personId)
          ? it.personIds.filter((id) => id !== personId)
          : [...it.personIds, personId];
        return { ...it, personIds };
      })
    );
  }

  const payersJson = JSON.stringify(
    payers
      .map((p) => ({ ...p, amount: singlePayerAmount ?? p.amount }))
      .filter((p) => p.personId && p.amount)
  );
  const participantsJson = JSON.stringify(evenParticipantIds);
  const exactJson = JSON.stringify(
    exactRows
      .filter((r) => r.included)
      .map((r) => ({ personId: r.personId, amount: resolvedExactAmount(r) }))
      .filter((r) => r.amount && r.amount !== "0.00")
  );
  const itemsJson = JSON.stringify(
    items
      .filter((it) => it.description && it.amount)
      .map((it) => ({ description: it.description, amount: it.amount, personIds: it.personIds }))
  );
  const sharesJson = JSON.stringify(
    includedShareRows.map((r) => ({ personId: r.personId, shares: r.shares }))
  );

  return (
    <form
      action={isEditing ? updateExpense : createExpense}
      className="flex w-full max-w-lg flex-col gap-4 sm:gap-6"
    >
      <input type="hidden" name="groupId" value={groupId} />
      {isEditing && <input type="hidden" name="expenseId" value={expenseId} />}
      <input type="hidden" name="payersJson" value={payersJson} />
      <input type="hidden" name="participantsJson" value={participantsJson} />
      <input type="hidden" name="exactJson" value={exactJson} />
      <input type="hidden" name="itemsJson" value={itemsJson} />
      <input type="hidden" name="sharesJson" value={sharesJson} />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
        <input
          name="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner at the night market"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</label>
          <input
            type="date"
            name="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Currency</label>
          <select
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {ALL_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Category <span className="font-normal text-zinc-400 dark:text-zinc-500">(optional)</span>
        </label>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">No category</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {category === "Other" && (
          <input
            name="customCategory"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Custom category name"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Split type</span>
        <div className="grid grid-cols-2 gap-2">
          {(["EVEN", "EXACT", "ITEM", "SHARES"] as SplitType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                splitType === type
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {type === "EVEN"
                ? "Even"
                : type === "EXACT"
                  ? "Exact amounts"
                  : type === "ITEM"
                    ? "Item-by-item"
                    : "Shares"}
            </button>
          ))}
        </div>
      </div>
      <input type="hidden" name="splitType" value={splitType} />

      {(splitType === "EVEN" || splitType === "EXACT" || splitType === "SHARES") && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="amount"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

      {splitType === "EVEN" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Split between</span>
          <div className="flex flex-col gap-1">
            {people.map((p) => {
              const included = evenParticipantIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className="flex items-center justify-between gap-2 text-sm text-zinc-800 dark:text-zinc-200"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleEvenParticipant(p.id)}
                    />
                    {p.name}
                  </span>
                  {included && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {fromCents(evenShares[p.id] ?? 0)} {currency}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {splitType === "EXACT" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Each person&apos;s share</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Type amounts for the people you know exactly — anyone else automatically splits what&apos;s left.
          </p>
          <div className="flex flex-col gap-2">
            {exactRows.map((row) => {
              const person = people.find((p) => p.id === row.personId);
              return (
                <div key={row.personId} className="flex items-center gap-2">
                  <label className="flex flex-1 items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={row.included}
                      onChange={(e) => updateExactRow(row.personId, { included: e.target.checked })}
                    />
                    {person?.name}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!row.included}
                    value={row.touched ? row.amount : ""}
                    placeholder={row.touched ? undefined : fromCents(exactAutoShares[row.personId] ?? 0)}
                    onChange={(e) => updateExactAmount(row.personId, e.target.value)}
                    onBlur={() => {
                      if (row.amount === "") updateExactRow(row.personId, { touched: false });
                    }}
                    className={`w-28 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-zinc-500 disabled:opacity-50 dark:bg-zinc-900 ${
                      row.touched
                        ? "border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                        : "border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
                    }`}
                  />
                </div>
              );
            })}
          </div>
          <p
            className={`text-sm ${
              exactUntouchedIds.length === 0 && exactRemainderCents !== 0
                ? "text-red-600"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {exactUntouchedIds.length === 0 && exactRemainderCents !== 0
              ? `Amounts entered don't add up to the total (${exactRemainderCents > 0 ? "short by" : "over by"} ${fromCents(
                  Math.abs(exactRemainderCents)
                )} ${currency})`
              : `Remaining to split automatically: ${fromCents(Math.max(exactRemainderCents, 0))} ${currency}`}
          </p>
        </div>
      )}

      {splitType === "SHARES" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Shares per person</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            e.g. give an adult 2 shares and a kid 1 share to split roughly 2:1.
          </p>
          <div className="flex flex-col gap-2">
            {shareRows.map((row) => {
              const person = people.find((p) => p.id === row.personId);
              const step = (delta: number) => {
                const nextShares = Math.max(0, row.shares + delta);
                // Same rule as typing 0 directly: dropping to zero unticks them too.
                updateShareRow(row.personId, {
                  shares: nextShares,
                  included: nextShares > 0 ? row.included : false,
                });
              };
              return (
                <div
                  key={row.personId}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
                >
                  <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={row.included}
                      onChange={(e) => updateShareRow(row.personId, { included: e.target.checked })}
                    />
                    {person?.name}
                  </label>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={!row.included}
                      onClick={() => step(-1)}
                      className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      −
                    </button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        disabled={!row.included}
                        value={row.shares}
                        onChange={(e) => {
                          const value = Math.max(0, Number(e.target.value) || 0);
                          // Typing 0 is a quick way to drop someone from the split,
                          // same as unchecking them — no separate tap needed.
                          updateShareRow(row.personId, {
                            shares: value,
                            included: value > 0 ? row.included : false,
                          });
                        }}
                        className="w-14 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-center text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">x</span>
                    </div>
                    <button
                      type="button"
                      disabled={!row.included}
                      onClick={() => step(1)}
                      className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      +
                    </button>
                    {row.included && (
                      <span className="w-20 text-right text-sm text-zinc-500 dark:text-zinc-400">
                        {fromCents(shareAmounts[row.personId] ?? 0)} {currency}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {splitType === "ITEM" && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Line items</span>
          {items.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex gap-2">
                <input
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount"
                  value={item.amount}
                  onChange={(e) => updateItem(index, { amount: e.target.value })}
                  className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-lg border border-zinc-300 px-2 text-sm text-zinc-500 dark:border-zinc-700"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {people.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={item.personIds.includes(p.id)}
                      onChange={() => toggleItemPerson(index, p.id)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="self-start text-sm font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
          >
            + Add another item
          </button>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Total: {(totalCents / 100).toFixed(2)} {currency}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Who paid</span>
        <div className="flex flex-col gap-2">
          {payers.map((payer, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={payer.personId}
                onChange={(e) => updatePayer(index, { personId: e.target.value })}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={singlePayerAmount ?? payer.amount}
                disabled={singlePayerAmount !== null}
                onChange={(e) => updatePayer(index, { amount: e.target.value })}
                className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              {payers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePayer(index)}
                  className="rounded-lg border border-zinc-300 px-2 text-sm text-zinc-500 dark:border-zinc-700"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPayer}
          className="self-start text-sm font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
        >
          + Add another payer
        </button>
        <p className={`text-sm ${payersMatch ? "text-zinc-500 dark:text-zinc-400" : "text-red-600"}`}>
          Paid so far: {(payersTotalCents / 100).toFixed(2)} / {(totalCents / 100).toFixed(2)} {currency}
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Receipt photo</span>
        <input type="hidden" name="existingReceiptUrl" value={existingReceiptUrl} />
        <input
          type="file"
          name="receipt"
          accept="image/*"
          className="text-sm text-zinc-600 dark:text-zinc-400"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setReceiptPreview(file ? URL.createObjectURL(file) : (initialValues?.receiptUrl ?? null));
          }}
        />
        {receiptPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={receiptPreview}
            alt="Receipt preview"
            className="mt-1 max-h-40 w-auto rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          This expense repeats automatically
        </label>
        {isRecurring && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Repeats</label>
              <select
                name="recurrenceInterval"
                value={recurrenceInterval}
                onChange={(e) => setRecurrenceInterval(e.target.value as "WEEKLY" | "MONTHLY")}
                className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Until (optional)</label>
              <input
                type="date"
                name="recurrenceEndDate"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        )}
      </div>

      <SubmitButton
        disabled={!payersMatch}
        pendingText={isEditing ? "Saving…" : "Adding…"}
        className="mt-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isEditing ? "Save changes" : "Add expense"}
      </SubmitButton>
    </form>
  );
}
