-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSettings" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSpringFrost" TIMESTAMP(3) NOT NULL,
    "firstFallFrost" TIMESTAMP(3) NOT NULL,
    "zone" TEXT,
    "units" TEXT NOT NULL DEFAULT 'imperial',

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plant" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "spacingInches" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "daysToMaturityMin" INTEGER,
    "daysToMaturityMax" INTEGER,
    "startIndoorsWeeksBeforeFrost" INTEGER,
    "transplantWeeksAfterFrost" INTEGER,
    "directSowWeeksRelativeToFrost" INTEGER,
    "plantingDepthInches" DOUBLE PRECISION,
    "notes" TEXT,
    "scientificName" TEXT,
    "growthForm" TEXT,
    "growthHabit" TEXT,
    "growthRate" TEXT,
    "averageHeightCm" DOUBLE PRECISION,
    "minTemperatureC" DOUBLE PRECISION,
    "maxTemperatureC" DOUBLE PRECISION,
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

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bed" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "widthInches" INTEGER NOT NULL,
    "heightInches" INTEGER NOT NULL,
    "cellInches" INTEGER NOT NULL DEFAULT 12,
    "gardenX" INTEGER,
    "gardenY" INTEGER,
    "gardenRotated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Garden" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "widthInches" INTEGER NOT NULL,
    "heightInches" INTEGER NOT NULL,
    "cellInches" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Walkway" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "Walkway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Gate" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT,

    CONSTRAINT "Gate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BedPlacement" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bedId" INTEGER NOT NULL,
    "plantId" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "w" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "h" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT,
    "plantingDate" TIMESTAMP(3),
    "expectedHarvestDate" TIMESTAMP(3),
    "actualHarvestStartDate" TIMESTAMP(3),
    "actualHarvestEndDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "BedPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "public"."PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "public"."UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "public"."UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Plant_userId_idx" ON "public"."Plant"("userId");

-- CreateIndex
CREATE INDEX "Plant_userId_name_idx" ON "public"."Plant"("userId", "name");

-- CreateIndex
CREATE INDEX "Bed_userId_idx" ON "public"."Bed"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Garden_userId_key" ON "public"."Garden"("userId");

-- CreateIndex
CREATE INDEX "Garden_userId_idx" ON "public"."Garden"("userId");

-- CreateIndex
CREATE INDEX "Walkway_userId_idx" ON "public"."Walkway"("userId");

-- CreateIndex
CREATE INDEX "Gate_userId_idx" ON "public"."Gate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BedPlacement_bedId_x_y_key" ON "public"."BedPlacement"("bedId", "x", "y");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Plant" ADD CONSTRAINT "Plant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bed" ADD CONSTRAINT "Bed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Garden" ADD CONSTRAINT "Garden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Walkway" ADD CONSTRAINT "Walkway_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Garden"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Gate" ADD CONSTRAINT "Gate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Garden"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BedPlacement" ADD CONSTRAINT "BedPlacement_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "public"."Bed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BedPlacement" ADD CONSTRAINT "BedPlacement_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

