import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getGroupBalances, simplifyDebts } from "@/lib/balances";
import { formatMoney, fromCents } from "@/lib/money";
import { recordSettlement } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SettleUpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) notFound();

  const balances = await getGroupBalances(id);
  const suggestions = simplifyDebts(balances);
  const nameById = Object.fromEntries(balances.map((b) => [b.personId, b.name]));

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col gap-1">
          <Link href={`/group/${group.id}`} className="text-sm text-zinc-500 dark:text-zinc-400">
            ← Back to {group.name}
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Settle up</h1>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Balances
          </span>
          <ul className="flex flex-col gap-2">
            {balances.map((b) => (
              <li
                key={b.personId}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="text-zinc-800 dark:text-zinc-200">{b.name}</span>
                <span
                  className={
                    b.balanceCents > 0
                      ? "text-emerald-600"
                      : b.balanceCents < 0
                        ? "text-red-600"
                        : "text-zinc-500 dark:text-zinc-400"
                  }
                >
                  {b.balanceCents === 0
                    ? "settled up"
                    : b.balanceCents > 0
                      ? `is owed ${formatMoney(fromCents(b.balanceCents))} ${group.homeCurrency}`
                      : `owes ${formatMoney(fromCents(-b.balanceCents))} ${group.homeCurrency}`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Suggested payments
          </span>
          {suggestions.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">Everyone is settled up.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {suggestions.map((s, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {nameById[s.fromPersonId]} → {nameById[s.toPersonId]}
                    <span className="ml-2 font-medium">
                      {formatMoney(fromCents(s.amountCents))} {group.homeCurrency}
                    </span>
                  </span>
                  <form action={recordSettlement}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="fromPersonId" value={s.fromPersonId} />
                    <input type="hidden" name="toPersonId" value={s.toPersonId} />
                    <input type="hidden" name="amount" value={fromCents(s.amountCents)} />
                    <input type="hidden" name="currency" value={group.homeCurrency} />
                    <SubmitButton
                      pendingText="Saving…"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Mark as paid
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
