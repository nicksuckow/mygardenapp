/*
  Warnings:

  - You are about to alter the column `plantingDepthInches` on the `Plant` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "notes" TEXT
);
INSERT INTO "new_Plant" ("createdAt", "daysToMaturityMax", "daysToMaturityMin", "directSowWeeksRelativeToFrost", "id", "name", "notes", "plantingDepthInches", "spacingInches", "startIndoorsWeeksBeforeFrost", "transplantWeeksAfterFrost", "updatedAt", "variety") SELECT "createdAt", "daysToMaturityMax", "daysToMaturityMin", "directSowWeeksRelativeToFrost", "id", "name", "notes", "plantingDepthInches", "spacingInches", "startIndoorsWeeksBeforeFrost", "transplantWeeksAfterFrost", "updatedAt", "variety" FROM "Plant";
DROP TABLE "Plant";
ALTER TABLE "new_Plant" RENAME TO "Plant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
