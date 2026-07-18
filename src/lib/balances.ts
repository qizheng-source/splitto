import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money";
import { distributeProportionally } from "@/lib/splitting";

export type Balance = { personId: string; name: string; balanceCents: number };
export type Settlement = { fromPersonId: string; toPersonId: string; amountCents: number };

/**
 * Calculates each person's net balance in the group's home currency, in cents.
 * Positive means the group owes them money overall; negative means they owe
 * the group. Every expense amount is converted using the exchange rate that
 * was captured when that expense was logged, so mixed currencies stay consistent.
 */
export async function getGroupBalances(groupId: string): Promise<Balance[]> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      people: { orderBy: { createdAt: "asc" } },
      expenses: { include: { payers: true, participants: true } },
      settlements: true,
    },
  });

  if (!group) return [];

  const balanceCents: Record<string, number> = {};
  for (const person of group.people) balanceCents[person.id] = 0;

  for (const expense of group.expenses) {
    // Convert each person's share of this expense into home-currency cents by
    // distributing the expense's own (already correctly rounded) converted
    // total proportionally — never by rounding each share independently,
    // which can drift the group's overall balance away from zero over time.
    const convertedTotalCents = toCents(expense.convertedAmount.toString());

    const payerShares = distributeProportionally(
      convertedTotalCents,
      expense.payers.map((p) => toCents(p.amountPaid.toString()))
    );
    expense.payers.forEach((payer, i) => {
      balanceCents[payer.personId] = (balanceCents[payer.personId] ?? 0) + payerShares[i];
    });

    const participantShares = distributeProportionally(
      convertedTotalCents,
      expense.participants.map((p) => toCents(p.owedAmount.toString()))
    );
    expense.participants.forEach((participant, i) => {
      balanceCents[participant.personId] =
        (balanceCents[participant.personId] ?? 0) - participantShares[i];
    });
  }

  for (const settlement of group.settlements) {
    const cents = toCents(settlement.amount.toString());
    balanceCents[settlement.fromPersonId] = (balanceCents[settlement.fromPersonId] ?? 0) + cents;
    balanceCents[settlement.toPersonId] = (balanceCents[settlement.toPersonId] ?? 0) - cents;
  }

  return group.people.map((person) => ({
    personId: person.id,
    name: person.name,
    balanceCents: balanceCents[person.id] ?? 0,
  }));
}

/**
 * Greedily matches the biggest debtor with the biggest creditor, repeatedly,
 * until everyone is settled. This is the standard approach apps like
 * Splitwise use to minimize the number of payments needed.
 */
export function simplifyDebts(balances: Balance[]): Settlement[] {
  const creditors = balances
    .filter((b) => b.balanceCents > 0)
    .map((b) => ({ id: b.personId, amount: b.balanceCents }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.balanceCents < 0)
    .map((b) => ({ id: b.personId, amount: -b.balanceCents }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      settlements.push({ fromPersonId: debtor.id, toPersonId: creditor.id, amountCents: amount });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}
