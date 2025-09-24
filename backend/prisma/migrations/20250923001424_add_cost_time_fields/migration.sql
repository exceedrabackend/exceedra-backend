-- AlterTable
ALTER TABLE "damage_items" ADD COLUMN     "repairCost" DECIMAL(65,30),
ADD COLUMN     "repairTime" TEXT,
ADD COLUMN     "replacementCost" DECIMAL(65,30),
ADD COLUMN     "replacementLink" TEXT;
