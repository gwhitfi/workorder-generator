/*
  Warnings:

  - You are about to drop the column `spaceId` on the `Area` table. All the data in the column will be lost.
  - You are about to drop the column `caption` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `archived` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Space` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organizationId` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `WorkOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_unitId_fkey";

-- DropIndex
DROP INDEX "Area_spaceId_idx";

-- AlterTable
ALTER TABLE "Area" DROP COLUMN "spaceId";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "caption",
ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "archived",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "WorkOrder" ALTER COLUMN "title" SET NOT NULL;

-- DropTable
DROP TABLE "Space";

-- CreateIndex
CREATE INDEX "Attachment_propertyId_idx" ON "Attachment"("propertyId");

-- CreateIndex
CREATE INDEX "Attachment_contactId_idx" ON "Attachment"("contactId");

-- CreateIndex
CREATE INDEX "Attachment_organizationId_idx" ON "Attachment"("organizationId");

-- CreateIndex
CREATE INDEX "WorkOrder_tenantId_idx" ON "WorkOrder"("tenantId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint (hand-written: Prisma can't express this). At most one owner; none means an organization file (logo).
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_single_owner" CHECK (num_nonnulls("propertyId", "workOrderId", "lineItemId", "contactId") <= 1);
