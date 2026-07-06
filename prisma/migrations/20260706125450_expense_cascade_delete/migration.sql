-- DropForeignKey
ALTER TABLE "ExpenseItem" DROP CONSTRAINT "ExpenseItem_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseItemAssignment" DROP CONSTRAINT "ExpenseItemAssignment_itemId_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseParticipant" DROP CONSTRAINT "ExpenseParticipant_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "ExpensePayer" DROP CONSTRAINT "ExpensePayer_expenseId_fkey";

-- AddForeignKey
ALTER TABLE "ExpensePayer" ADD CONSTRAINT "ExpensePayer_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseParticipant" ADD CONSTRAINT "ExpenseParticipant_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItemAssignment" ADD CONSTRAINT "ExpenseItemAssignment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
