/**
 * Looks up the current conversion rate from one currency to another using
 * exchangerate-api.com. Returns 1 immediately if both currencies match, so
 * callers don't need to special-case the "no conversion needed" case.
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    throw new Error("Exchange rate API key is not configured.");
  }

  const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to reach the exchange rate service.");
  }

  const data = await res.json();
  if (data.result !== "success") {
    throw new Error(`Exchange rate lookup failed: ${data["error-type"] ?? "unknown error"}`);
  }

  return data.conversion_rate as number;
}
