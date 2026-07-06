import { prisma } from "@/lib/prisma";
import { RecurrenceInterval } from "@/generated/prisma/client";
import { getExchangeRate } from "@/lib/exchangeRate";
import { toCents, fromCents } from "@/lib/money";

export function computeNextOccurrence(date: Date, interval: RecurrenceInterval): Date {
  const next = new Date(date);
  if (interval === "WEEKLY") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

/**
 * Finds recurring expenses in a group that are "due" (nextOccurrenceDate has
 * passed) and creates the missing instances, catching up if multiple
 * intervals have elapsed since the app was last opened. There's no cron job —
 * this runs lazily whenever someone views the group.
 */
export async function generateDueRecurringExpenses(groupId: string) {
  const now = new Date();

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return;

  const dueTemplates = await prisma.expense.findMany({
    where: {
      groupId,
      isRecurring: true,
      nextOccurrenceDate: { lte: now },
    },
    include: {
      payers: true,
      participants: true,
      items: { include: { assignments: true } },
    },
  });

  for (const template of dueTemplates) {
    let nextDate = template.nextOccurrenceDate!;
    const interval = template.recurrenceInterval!;

    while (nextDate <= now) {
      const exchangeRate = await getExchangeRate(template.currency, group.homeCurrency);
      const convertedAmount = fromCents(Math.round(toCents(template.amount.toString()) * exchangeRate));

      await prisma.expense.create({
        data: {
          groupId: template.groupId,
          description: template.description,
          date: nextDate,
          category: template.category,
          currency: template.currency,
          amount: template.amount,
          convertedAmount,
          exchangeRate: exchangeRate.toString(),
          splitType: template.splitType,
          isRecurring: false,
          payers: {
            create: template.payers.map((p) => ({
              personId: p.personId,
              amountPaid: p.amountPaid,
            })),
          },
          participants: {
            create: template.participants.map((p) => ({
              personId: p.personId,
              owedAmount: p.owedAmount,
            })),
          },
          items: {
            create: template.items.map((item) => ({
              description: item.description,
              amount: item.amount,
              assignments: {
                create: item.assignments.map((a) => ({ personId: a.personId })),
              },
            })),
          },
        },
      });

      nextDate = computeNextOccurrence(nextDate, interval);
    }

    await prisma.expense.update({
      where: { id: template.id },
      data: { nextOccurrenceDate: nextDate },
    });
  }
}
