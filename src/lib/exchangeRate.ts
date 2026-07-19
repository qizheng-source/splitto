import { prisma } from "@/lib/prisma";

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

/**
 * Same as getExchangeRate, but never blocks expense entry: if the live API
 * call fails (outage, free-tier quota, etc.), falls back to the most recent
 * rate this group actually used for the same currency pair, or 1:1 as a last
 * resort. Callers should flag the result as an estimate so it can be fixed
 * later, rather than silently pretending it's a real live rate.
 */
export async function getExchangeRateWithFallback(
  from: string,
  to: string,
  groupId: string
): Promise<{ rate: number; isFallback: boolean }> {
  if (from === to) return { rate: 1, isFallback: false };

  try {
    const rate = await getExchangeRate(from, to);
    return { rate, isFallback: false };
  } catch {
    const lastKnown = await prisma.expense.findFirst({
      where: { groupId, currency: from, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { exchangeRate: true },
    });
    return { rate: lastKnown ? Number(lastKnown.exchangeRate) : 1, isFallback: true };
  }
}
