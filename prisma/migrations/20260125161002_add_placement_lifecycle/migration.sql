-- AlterTable
ALTER TABLE "BedPlacement" ADD COLUMN "actualHarvestEndDate" DATETIME;
ALTER TABLE "BedPlacement" ADD COLUMN "actualHarvestStartDate" DATETIME;
ALTER TABLE "BedPlacement" ADD COLUMN "expectedHarvestDate" DATETIME;
ALTER TABLE "BedPlacement" ADD COLUMN "notes" TEXT;
ALTER TABLE "BedPlacement" ADD COLUMN "plantingDate" DATETIME;
ALTER TABLE "BedPlacement" ADD COLUMN "status" TEXT;
