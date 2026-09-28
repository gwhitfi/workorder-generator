-- AlterEnum
ALTER TYPE "WorkOrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);
