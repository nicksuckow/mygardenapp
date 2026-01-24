/*
  Warnings:

  - Added the required column `userId` to the `Bed` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Garden` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `UserSettings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "widthInches" INTEGER NOT NULL,
    "heightInches" INTEGER NOT NULL,
    "cellInches" INTEGER NOT NULL DEFAULT 12,
    "gardenX" INTEGER,
    "gardenY" INTEGER,
    "gardenRotated" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Bed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Bed" ("cellInches", "createdAt", "gardenRotated", "gardenX", "gardenY", "heightInches", "id", "name", "updatedAt", "widthInches") SELECT "cellInches", "createdAt", "gardenRotated", "gardenX", "gardenY", "heightInches", "id", "name", "updatedAt", "widthInches" FROM "Bed";
DROP TABLE "Bed";
ALTER TABLE "new_Bed" RENAME TO "Bed";
CREATE INDEX "Bed_userId_idx" ON "Bed"("userId");
CREATE TABLE "new_Garden" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "widthInches" INTEGER NOT NULL,
    "heightInches" INTEGER NOT NULL,
    "cellInches" INTEGER NOT NULL DEFAULT 12,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Garden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Garden" ("cellInches", "heightInches", "id", "updatedAt", "widthInches") SELECT "cellInches", "heightInches", "id", "updatedAt", "widthInches" FROM "Garden";
DROP TABLE "Garden";
ALTER TABLE "new_Garden" RENAME TO "Garden";
CREATE UNIQUE INDEX "Garden_userId_key" ON "Garden"("userId");
CREATE INDEX "Garden_userId_idx" ON "Garden"("userId");
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
    CONSTRAINT "Plant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Plant" ("createdAt", "daysToMaturityMax", "daysToMaturityMin", "directSowWeeksRelativeToFrost", "id", "name", "notes", "plantingDepthInches", "spacingInches", "startIndoorsWeeksBeforeFrost", "transplantWeeksAfterFrost", "updatedAt", "variety") SELECT "createdAt", "daysToMaturityMax", "daysToMaturityMin", "directSowWeeksRelativeToFrost", "id", "name", "notes", "plantingDepthInches", "spacingInches", "startIndoorsWeeksBeforeFrost", "transplantWeeksAfterFrost", "updatedAt", "variety" FROM "Plant";
DROP TABLE "Plant";
ALTER TABLE "new_Plant" RENAME TO "Plant";
CREATE INDEX "Plant_userId_idx" ON "Plant"("userId");
CREATE INDEX "Plant_userId_name_idx" ON "Plant"("userId", "name");
CREATE TABLE "new_UserSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSpringFrost" DATETIME NOT NULL,
    "firstFallFrost" DATETIME NOT NULL,
    "zone" TEXT,
    "units" TEXT NOT NULL DEFAULT 'imperial',
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("createdAt", "firstFallFrost", "id", "lastSpringFrost", "units", "updatedAt", "zone") SELECT "createdAt", "firstFallFrost", "id", "lastSpringFrost", "units", "updatedAt", "zone" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
