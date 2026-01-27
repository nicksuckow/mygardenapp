import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Plant family mapping for rotation warnings
const PLANT_FAMILIES: Record<string, string[]> = {
  nightshade: ["tomato", "pepper", "eggplant", "potato"],
  brassica: ["broccoli", "cabbage", "cauliflower", "kale", "brussels sprouts", "collard", "kohlrabi"],
  cucurbit: ["cucumber", "squash", "zucchini", "pumpkin", "melon", "watermelon", "gourd"],
  allium: ["onion", "garlic", "leek", "shallot", "chive"],
  legume: ["bean", "pea", "lentil", "peanut"],
  carrot: ["carrot", "parsnip", "celery", "parsley", "dill", "fennel"],
  lettuce: ["lettuce", "endive", "chicory", "artichoke", "sunflower"],
};

function getPlantFamily(plantName: string): string | null {
  const lowerName = plantName.toLowerCase();
  for (const [family, plants] of Object.entries(PLANT_FAMILIES)) {
    if (plants.some(p => lowerName.includes(p))) {
      return family;
    }
  }
  return null;
}

// Archive a completed placement to history
export async function POST(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const placementId = Number(id);

    if (!Number.isInteger(placementId) || placementId <= 0) {
      return NextResponse.json({ error: "Invalid placement id" }, { status: 400 });
    }

    // Get the placement with bed ownership check
    const placement = await prisma.bedPlacement.findFirst({
      where: { id: placementId },
      include: {
        bed: true,
        plant: true,
      },
    });

    if (!placement || placement.bed.userId !== userId) {
      return NextResponse.json({ error: "Placement not found or access denied" }, { status: 404 });
    }

    // Determine season based on harvest date or current date
    const harvestDate = placement.harvestEndedDate || new Date();
    const month = harvestDate.getMonth();
    let seasonName: string;
    if (month >= 2 && month <= 4) {
      seasonName = "spring";
    } else if (month >= 5 && month <= 7) {
      seasonName = "summer";
    } else if (month >= 8 && month <= 10) {
      seasonName = "fall";
    } else {
      seasonName = "winter";
    }

    // Create history record
    await prisma.placementHistory.create({
      data: {
        bedId: placement.bedId,
        plantName: placement.plant.name,
        plantType: getPlantFamily(placement.plant.name),
        x: placement.x,
        y: placement.y,
        w: placement.w,
        h: placement.h,
        seasonYear: harvestDate.getFullYear(),
        seasonName,
        harvestYield: placement.harvestYield,
        harvestYieldUnit: placement.harvestYieldUnit,
        notes: placement.notes,
      },
    });

    // Delete the current placement
    await prisma.bedPlacement.delete({
      where: { id: placementId },
    });

    return NextResponse.json({ success: true, message: "Placement archived to history" });
  } catch (error) {
    console.error("Error archiving placement:", error);
    return NextResponse.json({ error: "Failed to archive placement" }, { status: 500 });
  }
}
