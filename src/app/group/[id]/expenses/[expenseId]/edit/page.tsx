import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddExpenseForm, type InitialExpenseValues } from "@/components/AddExpenseForm";
import { EXPENSE_CATEGORIES } from "@/lib/currencies";
import { formatMoney } from "@/lib/money";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id, expenseId } = await params;

  // Neither query depends on the other's result — both only need the route
  // params — so they run concurrently instead of one after another.
  const [group, expense] = await Promise.all([
    prisma.group.findUnique({
      where: { id },
      include: { people: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        payers: true,
        participants: true,
        items: { include: { assignments: true } },
      },
    }),
  ]);
  if (!group) notFound();
  if (!expense || expense.groupId !== group.id || expense.deletedAt) notFound();

  // A person archived after this expense was logged must stay visible here
  // so their existing payer/participant/item row doesn't silently disappear —
  // they just can't be newly added to expenses beyond this one.
  const involvedPersonIds = new Set<string>([
    ...expense.payers.map((p) => p.personId),
    ...expense.participants.map((p) => p.personId),
    ...expense.items.flatMap((item) => item.assignments.map((a) => a.personId)),
  ]);
  const editablePeople = group.people.filter((p) => !p.archivedAt || involvedPersonIds.has(p.id));

  const isPresetCategory =
    expense.category !== null && (EXPENSE_CATEGORIES as readonly string[]).includes(expense.category);

  const initialValues: InitialExpenseValues = {
    description: expense.description,
    date: expense.date.toISOString().slice(0, 10),
    category: isPresetCategory ? expense.category! : expense.category ? "Other" : "",
    customCategory: isPresetCategory ? "" : (expense.category ?? ""),
    currency: expense.currency,
    splitType: expense.splitType,
    amount: formatMoney(expense.amount.toString()),
    payers: expense.payers.map((p) => ({
      personId: p.personId,
      amount: formatMoney(p.amountPaid.toString()),
    })),
    evenParticipantIds: expense.participants.map((p) => p.personId),
    exactRows: editablePeople.map((person) => {
      const participant = expense.participants.find((p) => p.personId === person.id);
      return {
        personId: person.id,
        included: Boolean(participant),
        amount: participant ? formatMoney(participant.owedAmount.toString()) : "",
        touched: Boolean(participant),
      };
    }),
    // Shares aren't stored (only the resulting dollar amount is), so editing a
    // shares-split expense resets everyone to 1 share each — same starting
    // point as a fresh expense, just with the previous participants pre-checked.
    shareRows: editablePeople.map((person) => ({
      personId: person.id,
      included: expense.participants.some((p) => p.personId === person.id),
      shares: 1,
    })),
    items: expense.items.map((item) => ({
      description: item.description,
      amount: formatMoney(item.amount.toString()),
      personIds: item.assignments.map((a) => a.personId),
    })),
    isRecurring: expense.isRecurring,
    recurrenceInterval: expense.recurrenceInterval ?? "MONTHLY",
    recurrenceEndDate: expense.recurrenceEndDate ? expense.recurrenceEndDate.toISOString().slice(0, 10) : "",
    receiptUrl: expense.receiptUrl,
  };

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-16">
      <div className="flex w-full max-w-lg flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">Edit expense</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">in {group.name}</p>
        </div>
        <AddExpenseForm
          groupId={group.id}
          homeCurrency={group.homeCurrency}
          people={editablePeople.map((p) => ({ id: p.id, name: p.name, archived: Boolean(p.archivedAt) }))}
          expenseId={expense.id}
          initialValues={initialValues}
        />
      </div>
    </div>
  );
}
