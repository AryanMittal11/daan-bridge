-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('MONETARY', 'MATERIAL', 'VOLUNTEER', 'BLOOD', 'DISASTER', 'EDUCATION', 'HEALTH', 'WELFARE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'VERIFIED', 'FULFILLED', 'URGENT', 'REJECTED');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "target" INTEGER NOT NULL,
    "raised" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "deadline" TEXT,
    "image" TEXT,
    "location" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
