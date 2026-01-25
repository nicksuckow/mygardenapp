import { NextResponse } from "next/server";
import { getTreflePlantDetails, convertTrefleToPlant } from "@/lib/trefle";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();
    const { trefleId } = body;

    if (!trefleId || !Number.isInteger(trefleId)) {
      return NextResponse.json(
        { error: "Valid Trefle plant ID is required" },
        { status: 400 }
      );
    }

    // Fetch detailed plant data from Trefle
    const response = await getTreflePlantDetails(trefleId);
    const treflePlant = response.data;

    // Convert Trefle data to our Plant model format
    const plantData = convertTrefleToPlant(treflePlant);

    // Check if plant with same name already exists for this user
    const existingPlant = await prisma.plant.findFirst({
      where: {
        userId,
        name: plantData.name,
      },
    });

    if (existingPlant) {
      return NextResponse.json(
        {
          error: `A plant named "${plantData.name}" already exists in your library`,
          existingPlant,
        },
        { status: 409 }
      );
    }

    // Create the plant in the database
    const plant = await prisma.plant.create({
      data: {
        userId,
        name: plantData.name,
        variety: plantData.variety,
        spacingInches: plantData.spacingInches,
        plantingDepthInches: plantData.plantingDepthInches,
        daysToMaturityMin: plantData.daysToMaturityMin,
        daysToMaturityMax: plantData.daysToMaturityMax,
        notes: plantData.notes,
        // Additional Trefle fields
        scientificName: plantData.scientificName,
        growthForm: plantData.growthForm,
        growthHabit: plantData.growthHabit,
        growthRate: plantData.growthRate,
        averageHeightCm: plantData.averageHeightCm,
        minTemperatureC: plantData.minTemperatureC,
        maxTemperatureC: plantData.maxTemperatureC,
        lightRequirement: plantData.lightRequirement,
        soilNutriments: plantData.soilNutriments,
        soilHumidity: plantData.soilHumidity,
        edible: plantData.edible,
        ediblePart: plantData.ediblePart,
      },
    });

    return NextResponse.json({
      success: true,
      plant,
      trefleData: treflePlant,
    }, { status: 201 });
  } catch (error) {
    console.error("Trefle import error:", error);

    if (error instanceof Error && error.message.includes("API key not configured")) {
      return NextResponse.json(
        { error: "Trefle API is not configured. Please add TREFLE_API_KEY to your environment variables." },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message.includes("Trefle API error")) {
      return NextResponse.json(
        { error: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to import plant from Trefle" },
      { status: 500 }
    );
  }
}
