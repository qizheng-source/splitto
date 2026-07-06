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
