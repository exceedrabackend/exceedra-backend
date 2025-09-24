-- AlterTable
ALTER TABLE "damage_reports" ADD COLUMN     "confirmationCode" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "receivedAmount" DECIMAL(65,30);
