-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "widthInches" INTEGER NOT NULL,
    "heightInches" INTEGER NOT NULL,
    "cellInches" INTEGER NOT NULL DEFAULT 12,
    "gardenX" INTEGER,
    "gardenY" INTEGER,
    "gardenRotated" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Bed" ("cellInches", "createdAt", "gardenX", "gardenY", "heightInches", "id", "name", "updatedAt", "widthInches") SELECT "cellInches", "createdAt", "gardenX", "gardenY", "heightInches", "id", "name", "updatedAt", "widthInches" FROM "Bed";
DROP TABLE "Bed";
ALTER TABLE "new_Bed" RENAME TO "Bed";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
