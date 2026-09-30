/*
  Warnings:

  - Made the column `jobNumber` on table `WorkOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "jobNumberYear" INTEGER,
ADD COLUMN     "lastJobNumber" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "WorkOrder" ALTER COLUMN "jobNumber" SET NOT NULL;
