import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddExpenseForm } from "@/components/AddExpenseForm";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { people: { orderBy: { createdAt: "asc" } } },
  });

  if (!group) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Add an expense</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">to {group.name}</p>
        </div>
        <AddExpenseForm groupId={group.id} homeCurrency={group.homeCurrency} people={group.people} />
      </div>
    </div>
  );
}
