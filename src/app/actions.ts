"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toCents, fromCents } from "@/lib/money";
import { splitEvenly, splitItemsAmongAssignees } from "@/lib/splitting";
import { computeNextOccurrence } from "@/lib/recurring";
import { getExchangeRate } from "@/lib/exchangeRate";
import { put } from "@vercel/blob";
import type { SplitType, RecurrenceInterval } from "@/generated/prisma/client";

export async function createGroup(formData: FormData) {
  const name = String(formData.get("groupName") ?? "").trim();
  const homeCurrency = String(formData.get("homeCurrency") ?? "").trim();
  const participantNames = formData
    .getAll("participantName")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  if (!name || !homeCurrency || participantNames.length === 0) {
    throw new Error("Group name, home currency, and at least one participant are required.");
  }

  const group = await prisma.group.create({
    data: {
      name,
      homeCurrency,
      people: {
        create: participantNames.map((personName) => ({ name: personName })),
      },
    },
  });

  redirect(`/group/${group.id}`);
}

export async function addParticipant(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!groupId || !name) {
    throw new Error("A name is required to add a participant.");
  }

  await prisma.person.create({
    data: { groupId, name },
  });

  revalidatePath(`/group/${groupId}`);
}

export async function recordSettlement(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const fromPersonId = String(formData.get("fromPersonId") ?? "");
  const toPersonId = String(formData.get("toPersonId") ?? "");
  const amount = String(formData.get("amount") ?? "");
  const currency = String(formData.get("currency") ?? "");

  if (!groupId || !fromPersonId || !toPersonId || !amount || !currency) {
    throw new Error("Missing required settlement fields.");
  }

  await prisma.settlement.create({
    data: { groupId, fromPersonId, toPersonId, amount, currency },
  });

  revalidatePath(`/group/${groupId}`);
  revalidatePath(`/group/${groupId}/settle`);
}

type PayerInput = { personId: string; amount: string };
type ExactShareInput = { personId: string; amount: string };
type ItemInput = { description: string; amount: string; personIds: string[] };

async function parseExpenseForm(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const dateInput = String(formData.get("date") ?? "");
  const currency = String(formData.get("currency") ?? "").trim();
  const splitType = String(formData.get("splitType") ?? "") as SplitType;
  const categorySelect = String(formData.get("category") ?? "");
  const customCategory = String(formData.get("customCategory") ?? "").trim();
  const category = categorySelect === "Other" && customCategory ? customCategory : categorySelect;

  if (!groupId || !description || !dateInput || !currency || !category) {
    throw new Error("Missing required expense fields.");
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new Error("Group not found.");
  }

  const payers: PayerInput[] = JSON.parse(String(formData.get("payersJson") ?? "[]"));
  const payersTotalCents = payers.reduce((sum, p) => sum + toCents(p.amount), 0);

  if (payers.length === 0 || payersTotalCents <= 0) {
    throw new Error("At least one payer with an amount is required.");
  }

  let totalCents: number;
  let participantShares: Record<string, number>;
  let itemsForCreate: { description: string; amount: string; personIds: string[] }[] = [];

  if (splitType === "ITEM") {
    const items: ItemInput[] = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
    if (items.length === 0) {
      throw new Error("At least one item is required for an item-level split.");
    }
    totalCents = items.reduce((sum, item) => sum + toCents(item.amount), 0);
    participantShares = splitItemsAmongAssignees(
      items.map((item) => ({ amountCents: toCents(item.amount), personIds: item.personIds }))
    );
    itemsForCreate = items;
  } else if (splitType === "EXACT") {
    const exactShares: ExactShareInput[] = JSON.parse(String(formData.get("exactJson") ?? "[]"));
    if (exactShares.length === 0) {
      throw new Error("At least one participant is required for an exact split.");
    }
    totalCents = exactShares.reduce((sum, s) => sum + toCents(s.amount), 0);
    participantShares = {};
    for (const s of exactShares) {
      participantShares[s.personId] = toCents(s.amount);
    }
  } else {
    const participantIds: string[] = JSON.parse(String(formData.get("participantsJson") ?? "[]"));
    if (participantIds.length === 0) {
      throw new Error("At least one participant is required for an even split.");
    }
    totalCents = toCents(String(formData.get("amount") ?? "0"));
    participantShares = splitEvenly(totalCents, participantIds);
  }

  if (payersTotalCents !== totalCents) {
    throw new Error("The amount paid must add up to the total expense amount.");
  }

  const isRecurring = formData.get("isRecurring") === "on";
  const recurrenceInterval = isRecurring
    ? (String(formData.get("recurrenceInterval") ?? "") as RecurrenceInterval)
    : null;
  const date = new Date(dateInput);
  const nextOccurrenceDate =
    isRecurring && recurrenceInterval ? computeNextOccurrence(date, recurrenceInterval) : null;

  const exchangeRate = await getExchangeRate(currency, group.homeCurrency);
  const convertedCents = Math.round(totalCents * exchangeRate);

  const receiptFile = formData.get("receipt");
  const existingReceiptUrl = String(formData.get("existingReceiptUrl") ?? "");
  let receiptUrl = existingReceiptUrl || null;
  if (receiptFile instanceof File && receiptFile.size > 0) {
    const blob = await put(`receipts/${receiptFile.name}`, receiptFile, {
      access: "public",
      addRandomSuffix: true,
    });
    receiptUrl = blob.url;
  }

  return {
    groupId,
    receiptUrl,
    description,
    date,
    category,
    currency,
    splitType,
    isRecurring,
    recurrenceInterval,
    nextOccurrenceDate,
    amount: fromCents(totalCents),
    convertedAmount: fromCents(convertedCents),
    exchangeRate: exchangeRate.toString(),
    payersData: payers.map((p) => ({
      personId: p.personId,
      amountPaid: fromCents(toCents(p.amount)),
    })),
    participantsData: Object.entries(participantShares).map(([personId, cents]) => ({
      personId,
      owedAmount: fromCents(cents),
    })),
    itemsData: itemsForCreate.map((item) => ({
      description: item.description,
      amount: fromCents(toCents(item.amount)),
      personIds: item.personIds,
    })),
  };
}

export async function createExpense(formData: FormData) {
  const parsed = await parseExpenseForm(formData);

  await prisma.expense.create({
    data: {
      groupId: parsed.groupId,
      description: parsed.description,
      date: parsed.date,
      category: parsed.category,
      currency: parsed.currency,
      amount: parsed.amount,
      convertedAmount: parsed.convertedAmount,
      exchangeRate: parsed.exchangeRate,
      receiptUrl: parsed.receiptUrl,
      splitType: parsed.splitType,
      isRecurring: parsed.isRecurring,
      recurrenceInterval: parsed.recurrenceInterval,
      nextOccurrenceDate: parsed.nextOccurrenceDate,
      payers: { create: parsed.payersData },
      participants: { create: parsed.participantsData },
      items:
        parsed.splitType === "ITEM"
          ? {
              create: parsed.itemsData.map((item) => ({
                description: item.description,
                amount: item.amount,
                assignments: { create: item.personIds.map((personId) => ({ personId })) },
              })),
            }
          : undefined,
    },
  });

  redirect(`/group/${parsed.groupId}`);
}

export async function updateExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  if (!expenseId) {
    throw new Error("Missing expense id.");
  }

  const parsed = await parseExpenseForm(formData);

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      description: parsed.description,
      date: parsed.date,
      category: parsed.category,
      currency: parsed.currency,
      amount: parsed.amount,
      convertedAmount: parsed.convertedAmount,
      exchangeRate: parsed.exchangeRate,
      receiptUrl: parsed.receiptUrl,
      splitType: parsed.splitType,
      isRecurring: parsed.isRecurring,
      recurrenceInterval: parsed.recurrenceInterval,
      nextOccurrenceDate: parsed.nextOccurrenceDate,
      payers: { deleteMany: {}, create: parsed.payersData },
      participants: { deleteMany: {}, create: parsed.participantsData },
      items: {
        deleteMany: {},
        create:
          parsed.splitType === "ITEM"
            ? parsed.itemsData.map((item) => ({
                description: item.description,
                amount: item.amount,
                assignments: { create: item.personIds.map((personId) => ({ personId })) },
              }))
            : [],
      },
    },
  });

  redirect(`/group/${parsed.groupId}`);
}

export async function deleteExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");

  if (!expenseId || !groupId) {
    throw new Error("Missing expense id.");
  }

  await prisma.expense.delete({ where: { id: expenseId } });

  revalidatePath(`/group/${groupId}`);
}
