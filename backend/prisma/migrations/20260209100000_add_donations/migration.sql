-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('MONEY', 'MATERIAL');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PROCESSING', 'COMPLETED');

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "DonationType" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'COMPLETED',
    "items" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
