-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "spacingInches" INTEGER NOT NULL DEFAULT 12,
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
INSERT INTO "new_Plant" ("averageHeightCm", "createdAt", "daysToMaturityMax", "daysToMaturityMin", "directSowWeeksRelativeToFrost", "edible", "ediblePart", "growthForm", "growthHabit", "growthRate", "id", "lightRequirement", "maxTemperatureC", "minTemperatureC", "name", "notes", "plantingDepthInches", "scientificName", "soilHumidity", "soilNutriments", "spacingInches", "startIndoorsWeeksBeforeFrost", "transplantWeeksAfterFrost", "updatedAt", "userId", "variety") SELECT "averageHeightCm", "createdAt", "daysToMaturityMax", "daysToMaturityMin", "directSowWeeksRelativeToFrost", "edible", "ediblePart", "growthForm", "growthHabit", "growthRate", "id", "lightRequirement", "maxTemperatureC", "minTemperatureC", "name", "notes", "plantingDepthInches", "scientificName", "soilHumidity", "soilNutriments", "spacingInches", "startIndoorsWeeksBeforeFrost", "transplantWeeksAfterFrost", "updatedAt", "userId", "variety" FROM "Plant";
DROP TABLE "Plant";
ALTER TABLE "new_Plant" RENAME TO "Plant";
CREATE INDEX "Plant_userId_idx" ON "Plant"("userId");
CREATE INDEX "Plant_userId_name_idx" ON "Plant"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
