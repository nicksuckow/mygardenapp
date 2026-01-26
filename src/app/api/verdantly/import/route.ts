import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { convertVerdantlyToPlant, type VerdantlyPlant } from "@/lib/verdantly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/verdantly/import
 * Import a plant from Verdantly into user's plant database
 * Body: { plantData: VerdantlyPlant } - Full Verdantly plant object
 */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();
    const { plantData: verdantlyPlant } = body;

    if (!verdantlyPlant || !verdantlyPlant.id) {
      return NextResponse.json(
        { error: "plantData is required" },
        { status: 400 }
      );
    }

    // Convert to our plant format
    const plantData = convertVerdantlyToPlant(verdantlyPlant as VerdantlyPlant);

    // Check if plant already exists for this user
    const existingPlant = await prisma.plant.findFirst({
      where: {
        userId,
        name: plantData.name,
        variety: plantData.variety,
      },
    });

    if (existingPlant) {
      return NextResponse.json(
        {
          error: "This plant already exists in your collection",
          plant: existingPlant,
        },
        { status: 409 }
      );
    }

    // Create the plant
    const newPlant = await prisma.plant.create({
      data: {
        ...plantData,
        userId,
      },
    });

    return NextResponse.json(newPlant);
  } catch (error) {
    console.error("Error importing plant from Verdantly:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to import plant";

    // Check if it's an API key error
    if (errorMessage.includes("RapidAPI key not configured")) {
      return NextResponse.json(
        {
          error: "API key not configured. Please add RAPIDAPI_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
