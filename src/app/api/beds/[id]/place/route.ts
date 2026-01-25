import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper function to add days to a date
function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const bedId = Number(id);

    if (!Number.isInteger(bedId) || bedId <= 0) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    const body = await req.json();
    const plantId = Number(body.plantId);
    const x = Number(body.x);
    const y = Number(body.y);

    if (!Number.isInteger(plantId)) {
      return NextResponse.json({ error: "Invalid plant id" }, { status: 400 });
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    if (x < 0 || y < 0) {
      return NextResponse.json({ error: "Coordinates must be non-negative" }, { status: 400 });
    }

    const bed = await prisma.bed.findUnique({
      where: { id: bedId, userId },
      include: { placements: { include: { plant: true } } },
    });
    if (!bed) return NextResponse.json({ error: "Bed not found or access denied" }, { status: 404 });

    const plant = await prisma.plant.findUnique({ where: { id: plantId, userId } });
    if (!plant) return NextResponse.json({ error: "Plant not found or access denied" }, { status: 404 });

    // footprint size in inches (square footprint derived from spacing)
    const w = plant.spacingInches;
    const h = plant.spacingInches;

    // bounds check - ensure plant fits within bed dimensions
    if (x + w > bed.widthInches || y + h > bed.heightInches) {
      return NextResponse.json(
        { error: "Plant footprint does not fit in bed at that position", details: { x, y, w, h, bedWidth: bed.widthInches, bedHeight: bed.heightInches } },
        { status: 409 }
      );
    }

    // Spacing check - ensure minimum distance from existing plants
    // Calculate center of new plant
    const newCenterX = x + w / 2;
    const newCenterY = y + h / 2;

    for (const p of bed.placements) {
      const pw = p.w ?? plant.spacingInches;
      const ph = p.h ?? plant.spacingInches;

      // Calculate center of existing plant
      const existingCenterX = p.x + pw / 2;
      const existingCenterY = p.y + ph / 2;

      // Calculate distance between centers
      const distanceX = Math.abs(newCenterX - existingCenterX);
      const distanceY = Math.abs(newCenterY - existingCenterY);
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      // Required spacing is the larger of the two plants' spacing requirements
      const requiredSpacing = Math.max(plant.spacingInches, p.plant.spacingInches);

      if (distance < requiredSpacing) {
        return NextResponse.json(
          {
            error: `Too close to existing ${p.plant.name}`,
            details: {
              existingPlant: p.plant.name,
              existingAt: { x: p.x, y: p.y },
              distance: distance.toFixed(1),
              requiredSpacing: requiredSpacing
            },
          },
          { status: 409 }
        );
      }
    }

    // Build placement data with optional lifecycle fields
    const placementData: {
      bedId: number;
      plantId: number;
      x: number;
      y: number;
      w: number;
      h: number;
      count: number;
      status?: string;
      plantingDate?: Date;
      expectedHarvestDate?: Date;
      notes?: string;
    } = { bedId, plantId, x, y, w, h, count: 1 };

    // Add optional lifecycle fields if provided
    if (typeof body.status === "string" && body.status) {
      placementData.status = body.status;
    } else {
      placementData.status = "planned"; // Default status
    }

    if (body.plantingDate) {
      const plantingDate = new Date(body.plantingDate);
      if (!isNaN(plantingDate.getTime())) {
        placementData.plantingDate = plantingDate;

        // Auto-calculate expected harvest date
        if (plant.daysToMaturityMin) {
          placementData.expectedHarvestDate = addDays(plantingDate, plant.daysToMaturityMin);
        }
      }
    }

    if (typeof body.notes === "string" && body.notes.trim()) {
      placementData.notes = body.notes.trim();
    }

    // create a single placement row representing the whole plant footprint
    const placement = await prisma.bedPlacement.create({
      data: placementData,
    });

    return NextResponse.json(placement);
  } catch (error) {
    console.error("Error placing plant:", error);
    return NextResponse.json({ error: "Unauthorized or failed to place plant" }, { status: 401 });
  }
}
