import { prisma } from "@/lib/prisma";

export type PotentialDuplicate = {
  id: string;
  description: string;
  payerNames: string[];
};

/**
 * Two people logging the same real-world bill rarely type the same
 * description, so wording is never compared. Instead this matches on the
 * signal that's actually consistent between them: the exact amount, the
 * exact currency, and the same calendar day. It's a soft warning only —
 * displayed for a human to judge, never blocking or auto-merging anything.
 */
export async function findPotentialDuplicates(params: {
  groupId: string;
  expenseId: string;
  amount: string;
  currency: string;
  date: Date;
}): Promise<PotentialDuplicate[]> {
  const dayStart = new Date(params.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const matches = await prisma.expense.findMany({
    where: {
      groupId: params.groupId,
      id: { not: params.expenseId },
      deletedAt: null,
      currency: params.currency,
      amount: params.amount,
      date: { gte: dayStart, lt: dayEnd },
    },
    include: { payers: { include: { person: true } } },
  });

  return matches.map((m) => ({
    id: m.id,
    description: m.description,
    payerNames: m.payers.map((p) => p.person.name),
  }));
}

/**
 * List-view variant: given a set of already-loaded expenses, finds which
 * ones share an exact amount + currency + calendar day with at least one
 * other (excluding itself). No extra DB queries — just groups what's
 * already in memory, for a lightweight "possible duplicate" badge.
 */
export function findDuplicateExpenseIds(
  expenses: { id: string; amount: string | number; currency: string; date: Date }[]
): Set<string> {
  const idsByKey = new Map<string, string[]>();
  for (const e of expenses) {
    const key = `${e.currency}|${Number(e.amount).toFixed(2)}|${e.date.toDateString()}`;
    const ids = idsByKey.get(key) ?? [];
    ids.push(e.id);
    idsByKey.set(key, ids);
  }

  const duplicateIds = new Set<string>();
  for (const ids of idsByKey.values()) {
    if (ids.length > 1) {
      for (const id of ids) duplicateIds.add(id);
    }
  }
  return duplicateIds;
}
