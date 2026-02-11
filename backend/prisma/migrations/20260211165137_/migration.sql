-- CreateEnum
CREATE TYPE "BloodRequestStatus" AS ENUM ('FULFILLED', 'PENDING');

-- AlterTable
ALTER TABLE "BloodRequest" ADD COLUMN     "status" "BloodRequestStatus" NOT NULL DEFAULT 'PENDING';
