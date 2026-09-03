-- AlterEnum
ALTER TYPE "ContactType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;
