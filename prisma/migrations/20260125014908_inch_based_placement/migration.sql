/*
  Warnings:

  - You are about to alter the column `h` on the `BedPlacement` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `w` on the `BedPlacement` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `x` on the `BedPlacement` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `y` on the `BedPlacement` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `spacingInches` on the `Plant` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BedPlacement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bedId" INTEGER NOT NULL,
    "plantId" INTEGER NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "w" REAL NOT NULL DEFAULT 1,
    "h" REAL NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "BedPlacement_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BedPlacement_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BedPlacement" ("bedId", "count", "createdAt", "h", "id", "plantId", "updatedAt", "w", "x", "y") SELECT "bedId", "count", "createdAt", "h", "id", "plantId", "updatedAt", "w", "x", "y" FROM "BedPlacement";
DROP TABLE "BedPlacement";
ALTER TABLE "new_BedPlacement" RENAME TO "BedPlacement";
CREATE UNIQUE INDEX "BedPlacement_bedId_x_y_key" ON "BedPlacement"("bedId", "x", "y");
CREATE TABLE "new_Plant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "spacingInches" REAL NOT NULL DEFAULT 12,
    "daysToMaturityMin" INTEGER,
    "daysToMaturityMax" INTEGER,
    "startIndoorsWeeksBeforeFrost" INTEGER,
    "transplantWeeksAfterFrost" INTEGER,
    "directSowWeeksRelativeToFrost" INTEGER,
    "plantingDepthInches" REAL,
    "notes" TEXT,
    "scientificName" TEXT,
    "growthForm" TEXT,
    "growthHabit" TEXT,
    "growthRate" TEXT,
    "averageHeightCm" REAL,
    "minTemperatureC" REAL,
    "maxTemperatureC" REAL,
    "lightRequirement" INTEGER,
    "soilNutriments" INTEGER,
    "soilHumidity" INTEGER,
    "edible" BOOLEAN NOT NULL DEFAULT false,
    "ediblePart" TEXT,
    "cycle" TEXT,
    "watering" TEXT,
    "sunlight" TEXT,
    "floweringSeason" TEXT,
    "harvestSeason" TEXT,
    "careLevel" TEXT,
    "maintenance" TEXT,
    "indoor" BOOLEAN NOT NULL DEFAULT false,
    "droughtTolerant" BOOLEAN NOT NULL DEFAULT false,
    "medicinal" BOOLEAN NOT NULL DEFAULT false,
    "poisonousToHumans" INTEGER,
    "poisonousToPets" INTEGER,
    "description" TEXT,
    CONSTRAINT "Plant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Plant" ("averageHeightCm", "careLevel", "createdAt", "cycle", "daysToMaturityMax", "daysToMaturityMin", "description", "directSowWeeksRelativeToFrost", "droughtTolerant", "edible", "ediblePart", "floweringSeason", "growthForm", "growthHabit", "growthRate", "harvestSeason", "id", "indoor", "lightRequirement", "maintenance", "maxTemperatureC", "medicinal", "minTemperatureC", "name", "notes", "plantingDepthInches", "poisonousToHumans", "poisonousToPets", "scientificName", "soilHumidity", "soilNutriments", "spacingInches", "startIndoorsWeeksBeforeFrost", "sunlight", "transplantWeeksAfterFrost", "updatedAt", "userId", "variety", "watering") SELECT "averageHeightCm", "careLevel", "createdAt", "cycle", "daysToMaturityMax", "daysToMaturityMin", "description", "directSowWeeksRelativeToFrost", "droughtTolerant", "edible", "ediblePart", "floweringSeason", "growthForm", "growthHabit", "growthRate", "harvestSeason", "id", "indoor", "lightRequirement", "maintenance", "maxTemperatureC", "medicinal", "minTemperatureC", "name", "notes", "plantingDepthInches", "poisonousToHumans", "poisonousToPets", "scientificName", "soilHumidity", "soilNutriments", "spacingInches", "startIndoorsWeeksBeforeFrost", "sunlight", "transplantWeeksAfterFrost", "updatedAt", "userId", "variety", "watering" FROM "Plant";
DROP TABLE "Plant";
ALTER TABLE "new_Plant" RENAME TO "Plant";
CREATE INDEX "Plant_userId_idx" ON "Plant"("userId");
CREATE INDEX "Plant_userId_name_idx" ON "Plant"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
