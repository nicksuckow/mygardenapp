import { NextResponse } from "next/server";
import { getPerenualPlantDetails, convertPerenualToPlant } from "@/lib/perenual";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();
    const { perenualId } = body;

    if (!perenualId || !Number.isInteger(perenualId)) {
      return NextResponse.json(
        { error: "Valid Perenual plant ID is required" },
        { status: 400 }
      );
    }

    // Fetch detailed plant data from Perenual
    const perenualPlant = await getPerenualPlantDetails(perenualId);

    // Convert Perenual data to our Plant model format
    const plantData = convertPerenualToPlant(perenualPlant);

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
        // Additional fields from Perenual
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
        // Additional Perenual-specific fields
        cycle: plantData.cycle,
        watering: plantData.watering,
        sunlight: plantData.sunlight,
        floweringSeason: plantData.floweringSeason,
        harvestSeason: plantData.harvestSeason,
        careLevel: plantData.careLevel,
        maintenance: plantData.maintenance,
        indoor: plantData.indoor,
        droughtTolerant: plantData.droughtTolerant,
        medicinal: plantData.medicinal,
        poisonousToHumans: plantData.poisonousToHumans,
        poisonousToPets: plantData.poisonousToPets,
        description: plantData.description,
      },
    });

    return NextResponse.json({
      success: true,
      plant,
      perenualData: perenualPlant,
    }, { status: 201 });
  } catch (error) {
    console.error("Perenual import error:", error);

    if (error instanceof Error && error.message.includes("API key not configured")) {
      return NextResponse.json(
        { error: "Perenual API is not configured. Please add PERENUAL_API_KEY to your environment variables." },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message.includes("Perenual API error")) {
      return NextResponse.json(
        { error: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to import plant from Perenual" },
      { status: 500 }
    );
  }
}
