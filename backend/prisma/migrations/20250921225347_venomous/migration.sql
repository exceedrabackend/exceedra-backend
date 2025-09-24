-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLEANER', 'CLAIM_TEAM', 'ADMIN');

-- CreateEnum
CREATE TYPE "DamageType" AS ENUM ('REPAIR', 'REPLACE');

-- CreateEnum
CREATE TYPE "DamageStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'SUBMITTED_TO_AIRBNB', 'PROOF_REQUIRED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_DAMAGE_REPORT', 'DEADLINE_REMINDER', 'PROOF_DEADLINE_REMINDER', 'STATUS_UPDATE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLEANER',
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "airbnbId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damage_reports" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "itemDamaged" TEXT NOT NULL,
    "damageType" "DamageType" NOT NULL,
    "description" TEXT,
    "damageDate" TIMESTAMP(3) NOT NULL,
    "checkoutDate" TIMESTAMP(3) NOT NULL,
    "status" "DamageStatus" NOT NULL DEFAULT 'PENDING',
    "airbnbDeadline" TIMESTAMP(3) NOT NULL,
    "proofDeadline" TIMESTAMP(3) NOT NULL,
    "submittedToAirbnb" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "damage_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damage_images" (
    "id" TEXT NOT NULL,
    "damageReportId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "damage_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "damageReportId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "properties_airbnbId_key" ON "properties"("airbnbId");

-- AddForeignKey
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_images" ADD CONSTRAINT "damage_images_damageReportId_fkey" FOREIGN KEY ("damageReportId") REFERENCES "damage_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_damageReportId_fkey" FOREIGN KEY ("damageReportId") REFERENCES "damage_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
