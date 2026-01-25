/*
  Warnings:

  - You are about to drop the column `actualHarvestEndDate` on the `BedPlacement` table. All the data in the column will be lost.
  - You are about to drop the column `actualHarvestStartDate` on the `BedPlacement` table. All the data in the column will be lost.
  - You are about to drop the column `expectedHarvestDate` on the `BedPlacement` table. All the data in the column will be lost.
  - You are about to drop the column `plantingDate` on the `BedPlacement` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `BedPlacement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BedPlacement" DROP COLUMN "actualHarvestEndDate",
DROP COLUMN "actualHarvestStartDate",
DROP COLUMN "expectedHarvestDate",
DROP COLUMN "plantingDate",
DROP COLUMN "status",
ADD COLUMN     "directSowedDate" TIMESTAMP(3),
ADD COLUMN     "harvestEndedDate" TIMESTAMP(3),
ADD COLUMN     "harvestStartedDate" TIMESTAMP(3),
ADD COLUMN     "seedsStartedDate" TIMESTAMP(3),
ADD COLUMN     "transplantedDate" TIMESTAMP(3);
