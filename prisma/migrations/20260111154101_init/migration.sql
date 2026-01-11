-- CreateTable
CREATE TABLE "UserSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSpringFrost" DATETIME NOT NULL,
    "firstFallFrost" DATETIME NOT NULL,
    "zone" TEXT,
    "units" TEXT NOT NULL DEFAULT 'imperial'
);

-- CreateTable
CREATE TABLE "Plant" (
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
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "widthInches" INTEGER NOT NULL,
    "heightInches" INTEGER NOT NULL,
    "cellInches" INTEGER NOT NULL DEFAULT 12
);

-- CreateTable
CREATE TABLE "BedPlacement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bedId" INTEGER NOT NULL,
    "plantId" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "w" INTEGER NOT NULL DEFAULT 1,
    "h" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "BedPlacement_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BedPlacement_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BedPlacement_bedId_x_y_key" ON "BedPlacement"("bedId", "x", "y");
