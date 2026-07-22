import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSettlement } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import { SubmitButton } from "@/components/SubmitButton";

export default async function EditSettlementPage({
  params,
}: {
  params: Promise<{ id: string; settlementId: string }>;
}) {
  const { id, settlementId } = await params;

  // Neither query depends on the other's result — both only need the route
  // params — so they run concurrently instead of one after another.
  const [group, settlement] = await Promise.all([
    prisma.group.findUnique({
      where: { id },
      include: { people: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.settlement.findUnique({ where: { id: settlementId } }),
  ]);
  if (!group) notFound();
  if (!settlement || settlement.groupId !== group.id || settlement.deletedAt) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
            Edit settlement
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">in {group.name}</p>
        </div>

        <form action={updateSettlement} className="flex flex-col gap-4">
          <input type="hidden" name="groupId" value={group.id} />
          <input type="hidden" name="settlementId" value={settlement.id} />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">From</label>
              <select
                name="fromPersonId"
                defaultValue={settlement.fromPersonId}
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {group.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">To</label>
              <select
                name="toPersonId"
                defaultValue={settlement.toPersonId}
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {group.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Amount ({settlement.currency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="amount"
              required
              defaultValue={formatMoney(settlement.amount.toString())}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</label>
            <input
              type="date"
              name="date"
              required
              defaultValue={settlement.date.toISOString().slice(0, 10)}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <SubmitButton className="mt-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60">
            Save changes
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
