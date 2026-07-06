export function toCents(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Formats a Decimal/string/number for display, always with exactly 2 decimal places. */
export function formatMoney(amount: string | number): string {
  return Number(amount).toFixed(2);
}
