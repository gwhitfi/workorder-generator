/*
  Warnings:

  - You are about to drop the column `areaName` on the `Area` table. All the data in the column will be lost.
  - You are about to drop the column `areaPresetId` on the `Area` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `Area` table. All the data in the column will be lost.
  - You are about to drop the column `roomName` on the `Area` table. All the data in the column will be lost.
  - You are about to drop the column `roomPresetId` on the `Area` table. All the data in the column will be lost.
  - You are about to drop the `AreaPreset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomPreset` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `Area` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_areaPresetId_fkey";

-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_roomPresetId_fkey";

-- DropForeignKey
ALTER TABLE "AreaPreset" DROP CONSTRAINT "AreaPreset_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "RoomPreset" DROP CONSTRAINT "RoomPreset_organizationId_fkey";

-- DropIndex
DROP INDEX "Area_areaPresetId_idx";

-- DropIndex
DROP INDEX "Area_roomPresetId_idx";

-- AlterTable
ALTER TABLE "Area" DROP COLUMN "areaName",
DROP COLUMN "areaPresetId",
DROP COLUMN "label",
DROP COLUMN "roomName",
DROP COLUMN "roomPresetId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "spaceId" TEXT;

-- DropTable
DROP TABLE "AreaPreset";

-- DropTable
DROP TABLE "RoomPreset";

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "propertyId" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Space_organizationId_idx" ON "Space"("organizationId");

-- CreateIndex
CREATE INDEX "Space_propertyId_idx" ON "Space"("propertyId");

-- CreateIndex
CREATE INDEX "Area_spaceId_idx" ON "Area"("spaceId");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;
