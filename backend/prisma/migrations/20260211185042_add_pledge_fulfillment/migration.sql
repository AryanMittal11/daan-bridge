-- CreateEnum
CREATE TYPE "PledgeStatus" AS ENUM ('PENDING', 'FULFILLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "BloodRequest" ADD COLUMN     "fulfilledBy" TEXT,
ADD COLUMN     "fulfilledDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Pledge" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "status" "PledgeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pledge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_fulfilledBy_fkey" FOREIGN KEY ("fulfilledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
