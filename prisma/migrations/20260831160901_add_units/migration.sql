/*
  Warnings:

  - You are about to drop the column `propertyId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `Space` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_propertyId_fkey";

-- DropIndex
DROP INDEX "Contact_propertyId_idx";

-- DropIndex
DROP INDEX "Space_propertyId_idx";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "propertyId",
ADD COLUMN     "unitId" TEXT;

-- AlterTable
ALTER TABLE "Space" DROP COLUMN "propertyId",
ADD COLUMN     "unitId" TEXT;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "unitId" TEXT;

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "propertyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Unit_propertyId_idx" ON "Unit"("propertyId");

-- CreateIndex
CREATE INDEX "Unit_organizationId_idx" ON "Unit"("organizationId");

-- CreateIndex
CREATE INDEX "Contact_unitId_idx" ON "Contact"("unitId");

-- CreateIndex
CREATE INDEX "Space_unitId_idx" ON "Space"("unitId");

-- CreateIndex
CREATE INDEX "WorkOrder_unitId_idx" ON "WorkOrder"("unitId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
