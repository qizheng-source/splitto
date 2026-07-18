// All amounts here are in integer cents to avoid floating-point rounding errors.

/**
 * Splits totalCents evenly across personIds. Any leftover cents (from division
 * that doesn't divide evenly) go one-by-one to the first people in the list,
 * so the shares always add back up to exactly totalCents.
 */
export function splitEvenly(totalCents: number, personIds: string[]): Record<string, number> {
  const count = personIds.length;
  const base = Math.floor(totalCents / count);
  let remainder = totalCents - base * count;

  const shares: Record<string, number> = {};
  for (const id of personIds) {
    shares[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return shares;
}

/**
 * Distributes totalCents across a list of weights (e.g. each person's share in
 * some other currency), proportionally, while guaranteeing the results sum to
 * exactly totalCents. Rounding each entry independently (naive proportional
 * rounding) can drift the total off by a cent or two — this uses the largest-
 * remainder method instead: take the floor of each proportional share, then
 * hand out the few leftover cents to the entries with the biggest fractional
 * remainder, so nothing is ever gained or lost overall.
 */
export function distributeProportionally(totalCents: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return weights.map(() => 0);

  const raw = weights.map((w) => (w / totalWeight) * totalCents);
  const floors = raw.map(Math.floor);
  const remainder = totalCents - floors.reduce((sum, f) => sum + f, 0);

  const order = raw
    .map((r, i) => ({ i, fraction: r - floors[i] }))
    .sort((a, b) => b.fraction - a.fraction);

  const result = [...floors];
  for (let k = 0; k < remainder; k++) {
    result[order[k].i] += 1;
  }
  return result;
}

/**
 * For item-level splitting: each item's cost is split evenly among the people
 * it's assigned to, then each person's shares across all items are summed.
 */
export function splitItemsAmongAssignees(
  items: { amountCents: number; personIds: string[] }[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const item of items) {
    if (item.personIds.length === 0) continue;
    const shares = splitEvenly(item.amountCents, item.personIds);
    for (const [personId, cents] of Object.entries(shares)) {
      totals[personId] = (totals[personId] ?? 0) + cents;
    }
  }
  return totals;
}
