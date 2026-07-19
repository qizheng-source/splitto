import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { SettlementActionsMenu } from "@/components/SettlementActionsMenu";

export default async function SettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string; settlementId: string }>;
}) {
  const { id, settlementId } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) notFound();

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: { fromPerson: true, toPerson: true },
  });
  if (!settlement || settlement.groupId !== group.id || settlement.deletedAt) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/group/${group.id}/history`}
            className="text-sm text-zinc-500 dark:text-zinc-400"
            aria-label="Back to history"
          >
            ← Back
          </Link>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Settlement</span>
          <SettlementActionsMenu groupId={group.id} settlementId={settlement.id} />
        </div>

        <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {settlement.fromPerson.name} → {settlement.toPerson.name}
          </span>
          <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMoney(settlement.amount.toString())} {settlement.currency}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {settlement.date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-600">
            Logged{" "}
            {settlement.createdAt.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Status</span>
            <span className="font-medium text-emerald-600">Paid</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Group</span>
            <span className="text-zinc-800 dark:text-zinc-200">{group.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
