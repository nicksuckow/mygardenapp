-- CreateTable
CREATE TABLE "SeedInventory" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plantId" INTEGER,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "brand" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "seedCount" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "lotNumber" TEXT,
    "notes" TEXT,
    "sowingInstructions" TEXT,
    "daysToGermination" INTEGER,
    "germinationRate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'available',

    CONSTRAINT "SeedInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeedInventory_userId_idx" ON "SeedInventory"("userId");

-- CreateIndex
CREATE INDEX "SeedInventory_userId_status_idx" ON "SeedInventory"("userId", "status");

-- AddForeignKey
ALTER TABLE "SeedInventory" ADD CONSTRAINT "SeedInventory_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedInventory" ADD CONSTRAINT "SeedInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
