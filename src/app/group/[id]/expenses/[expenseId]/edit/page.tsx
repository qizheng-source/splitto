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

  const group = await prisma.group.findUnique({
    where: { id },
    include: { people: { orderBy: { createdAt: "asc" } } },
  });
  if (!group) notFound();

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      payers: true,
      participants: true,
      items: { include: { assignments: true } },
    },
  });
  if (!expense || expense.groupId !== group.id) notFound();

  const isPresetCategory = (EXPENSE_CATEGORIES as readonly string[]).includes(expense.category);

  const initialValues: InitialExpenseValues = {
    description: expense.description,
    date: expense.date.toISOString().slice(0, 10),
    category: isPresetCategory ? expense.category : "Other",
    customCategory: isPresetCategory ? "" : expense.category,
    currency: expense.currency,
    splitType: expense.splitType,
    amount: formatMoney(expense.amount.toString()),
    payers: expense.payers.map((p) => ({
      personId: p.personId,
      amount: formatMoney(p.amountPaid.toString()),
    })),
    evenParticipantIds: expense.participants.map((p) => p.personId),
    exactRows: group.people.map((person) => {
      const participant = expense.participants.find((p) => p.personId === person.id);
      return {
        personId: person.id,
        included: Boolean(participant),
        amount: participant ? formatMoney(participant.owedAmount.toString()) : "",
        touched: Boolean(participant),
      };
    }),
    items: expense.items.map((item) => ({
      description: item.description,
      amount: formatMoney(item.amount.toString()),
      personIds: item.assignments.map((a) => a.personId),
    })),
    isRecurring: expense.isRecurring,
    recurrenceInterval: expense.recurrenceInterval ?? "MONTHLY",
    receiptUrl: expense.receiptUrl,
  };

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit expense</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">in {group.name}</p>
        </div>
        <AddExpenseForm
          groupId={group.id}
          homeCurrency={group.homeCurrency}
          people={group.people}
          expenseId={expense.id}
          initialValues={initialValues}
        />
      </div>
    </div>
  );
}
