/*
  Warnings:

  - You are about to drop the column `damageReportId` on the `damage_images` table. All the data in the column will be lost.
  - You are about to drop the column `damageType` on the `damage_reports` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `damage_reports` table. All the data in the column will be lost.
  - You are about to drop the column `itemDamaged` on the `damage_reports` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `damage_reports` table. All the data in the column will be lost.
  - You are about to drop the `properties` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `damageItemId` to the `damage_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyName` to the `damage_reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "damage_images" DROP CONSTRAINT "damage_images_damageReportId_fkey";

-- DropForeignKey
ALTER TABLE "damage_reports" DROP CONSTRAINT "damage_reports_propertyId_fkey";

-- AlterTable
ALTER TABLE "damage_images" DROP COLUMN "damageReportId",
ADD COLUMN     "damageItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "damage_reports" DROP COLUMN "damageType",
DROP COLUMN "description",
DROP COLUMN "itemDamaged",
DROP COLUMN "propertyId",
ADD COLUMN     "propertyAddress" TEXT,
ADD COLUMN     "propertyName" TEXT NOT NULL;

-- DropTable
DROP TABLE "properties";

-- CreateTable
CREATE TABLE "damage_items" (
    "id" TEXT NOT NULL,
    "damageReportId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "damageType" "DamageType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "damage_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "damage_items" ADD CONSTRAINT "damage_items_damageReportId_fkey" FOREIGN KEY ("damageReportId") REFERENCES "damage_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_images" ADD CONSTRAINT "damage_images_damageItemId_fkey" FOREIGN KEY ("damageItemId") REFERENCES "damage_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
