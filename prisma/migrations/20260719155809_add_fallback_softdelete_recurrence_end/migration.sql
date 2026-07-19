-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "exchangeRateIsFallback" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Settlement" ADD COLUMN     "deletedAt" TIMESTAMP(3);
