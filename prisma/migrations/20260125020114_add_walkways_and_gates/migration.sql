-- CreateTable
CREATE TABLE "Walkway" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "name" TEXT,
    CONSTRAINT "Walkway_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Garden" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT,
    CONSTRAINT "Gate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Garden" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Walkway_userId_idx" ON "Walkway"("userId");

-- CreateIndex
CREATE INDEX "Gate_userId_idx" ON "Gate"("userId");
