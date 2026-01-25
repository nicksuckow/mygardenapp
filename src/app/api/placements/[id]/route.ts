import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ id: string }> };

// Helper function to add days to a date
function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

// GET /api/placements/[id] - Get single placement with full details
export async function GET(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const placementId = Number(idStr);

    if (!Number.isFinite(placementId)) {
      return NextResponse.json({ error: "Invalid placement id" }, { status: 400 });
    }

    const placement = await prisma.bedPlacement.findUnique({
      where: { id: placementId },
      include: {
        bed: {
          select: { id: true, name: true, userId: true },
        },
        plant: {
          select: {
            id: true,
            name: true,
            variety: true,
            daysToMaturityMin: true,
            daysToMaturityMax: true,
          },
        },
      },
    });

    if (!placement || placement.bed.userId !== userId) {
      return NextResponse.json({ error: "Placement not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(placement);
  } catch (error) {
    console.error("Error fetching placement:", error);
    return NextResponse.json({ error: "Unauthorized or failed to fetch placement" }, { status: 401 });
  }
}

// PATCH /api/placements/[id] - Update placement lifecycle fields
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const placementId = Number(idStr);

    if (!Number.isFinite(placementId)) {
      return NextResponse.json({ error: "Invalid placement id" }, { status: 400 });
    }

    // Verify ownership
    const placement = await prisma.bedPlacement.findUnique({
      where: { id: placementId },
      include: {
        bed: { select: { userId: true } },
        plant: {
          select: {
            daysToMaturityMin: true,
            daysToMaturityMax: true,
          },
        },
      },
    });

    if (!placement || placement.bed.userId !== userId) {
      return NextResponse.json({ error: "Placement not found or access denied" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    // Build update data object
    const data: Record<string, unknown> = {};

    // Validate and add status
    if (typeof body.status === "string") {
      const validStatuses = ["planned", "planted", "growing", "harvesting", "harvested", "removed"];
      if (validStatuses.includes(body.status)) {
        data.status = body.status;
      } else {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
    }

    // Handle date fields
    if (body.plantingDate !== undefined) {
      if (body.plantingDate === null) {
        data.plantingDate = null;
        data.expectedHarvestDate = null; // Clear expected harvest if planting date is cleared
      } else {
        const plantingDate = new Date(body.plantingDate);
        if (isNaN(plantingDate.getTime())) {
          return NextResponse.json({ error: "Invalid planting date" }, { status: 400 });
        }
        data.plantingDate = plantingDate;

        // Auto-calculate expected harvest date
        if (placement.plant.daysToMaturityMin) {
          data.expectedHarvestDate = addDays(plantingDate, placement.plant.daysToMaturityMin);
        }
      }
    }

    if (body.actualHarvestStartDate !== undefined) {
      if (body.actualHarvestStartDate === null) {
        data.actualHarvestStartDate = null;
      } else {
        const harvestStartDate = new Date(body.actualHarvestStartDate);
        if (isNaN(harvestStartDate.getTime())) {
          return NextResponse.json({ error: "Invalid actual harvest start date" }, { status: 400 });
        }

        // Validate: harvest start must be >= planting date if planting date exists
        const plantingDate = data.plantingDate
          ? new Date(data.plantingDate as Date)
          : placement.plantingDate;
        if (plantingDate && harvestStartDate < plantingDate) {
          return NextResponse.json(
            { error: "Harvest start date must be on or after planting date" },
            { status: 400 }
          );
        }

        data.actualHarvestStartDate = harvestStartDate;
      }
    }

    if (body.actualHarvestEndDate !== undefined) {
      if (body.actualHarvestEndDate === null) {
        data.actualHarvestEndDate = null;
      } else {
        const harvestEndDate = new Date(body.actualHarvestEndDate);
        if (isNaN(harvestEndDate.getTime())) {
          return NextResponse.json({ error: "Invalid actual harvest end date" }, { status: 400 });
        }

        // Validate: harvest end must be >= harvest start if harvest start exists
        const harvestStartDate = data.actualHarvestStartDate
          ? new Date(data.actualHarvestStartDate as Date)
          : placement.actualHarvestStartDate;
        if (harvestStartDate && harvestEndDate < harvestStartDate) {
          return NextResponse.json(
            { error: "Harvest end date must be on or after harvest start date" },
            { status: 400 }
          );
        }

        data.actualHarvestEndDate = harvestEndDate;
      }
    }

    // Add notes if provided
    if (typeof body.notes === "string") {
      data.notes = body.notes.trim();
    }

    // If no fields to update, return error
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Update the placement
    const updated = await prisma.bedPlacement.update({
      where: { id: placementId },
      data,
      include: {
        bed: {
          select: { id: true, name: true },
        },
        plant: {
          select: { id: true, name: true, variety: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating placement:", error);
    return NextResponse.json({ error: "Unauthorized or failed to update placement" }, { status: 401 });
  }
}
