-- AlterEnum
ALTER TYPE "DamageStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "damage_reports" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "claimAmount" DECIMAL(65,30);
