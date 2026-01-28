// src/app/api/succession/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/succession
 * Get upcoming succession schedule and recommendations
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    // Get all plants with succession enabled
    const successionPlants = await prisma.plant.findMany({
      where: {
        userId,
        successionEnabled: true,
      },
      include: {
        placements: {
          include: {
            bed: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const upcoming: Array<{
      plantId: number;
      plantName: string;
      nextSuccessionNumber: number;
      dueDate: string | null;
      daysUntilDue: number | null;
      isOverdue: boolean;
      currentCount: number;
      maxCount: number | null;
      intervalDays: number | null;
      latestPlacement: {
        id: number;
        bedName: string;
        plantedDate: string | null;
      } | null;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const plant of successionPlants) {
      // Count existing successions for this plant
      const placementsWithDates = plant.placements.filter(
        (p) => p.directSowedDate || p.transplantedDate || p.seedsStartedDate
      );

      const currentCount = placementsWithDates.length;
      const maxCount = plant.successionMaxCount ?? 6;

      // Skip if already at max successions
      if (currentCount >= maxCount) continue;

      // Find the latest planted date
      let latestDate: Date | null = null;
      let latestPlacement = null;

      for (const p of placementsWithDates) {
        const plantedDate = p.directSowedDate ?? p.transplantedDate ?? p.seedsStartedDate;
        if (plantedDate && (!latestDate || plantedDate > latestDate)) {
          latestDate = plantedDate;
          latestPlacement = p;
        }
      }

      // Calculate next due date
      let dueDate: Date | null = null;
      let daysUntilDue: number | null = null;
      let isOverdue = false;

      if (latestDate && plant.successionIntervalDays) {
        dueDate = new Date(latestDate);
        dueDate.setDate(dueDate.getDate() + plant.successionIntervalDays);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isOverdue = daysUntilDue < 0;
      }

      upcoming.push({
        plantId: plant.id,
        plantName: plant.name,
        nextSuccessionNumber: currentCount + 1,
        dueDate: dueDate?.toISOString().split("T")[0] ?? null,
        daysUntilDue,
        isOverdue,
        currentCount,
        maxCount,
        intervalDays: plant.successionIntervalDays,
        latestPlacement: latestPlacement
          ? {
              id: latestPlacement.id,
              bedName: latestPlacement.bed.name,
              plantedDate:
                (
                  latestPlacement.directSowedDate ??
                  latestPlacement.transplantedDate ??
                  latestPlacement.seedsStartedDate
                )
                  ?.toISOString()
                  .split("T")[0] ?? null,
            }
          : null,
      });
    }

    // Sort by due date (overdue first, then soonest)
    upcoming.sort((a, b) => {
      if (a.dueDate === null && b.dueDate === null) return 0;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    return NextResponse.json({
      upcoming,
      total: upcoming.length,
      overdue: upcoming.filter((u) => u.isOverdue).length,
    });
  } catch (error) {
    console.error("Error fetching succession schedule:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch succession schedule" }, { status: 500 });
  }
}

/**
 * POST /api/succession
 * Create a new succession from an existing placement
 * Body: { sourcePlacementId: number, targetBedId?: number, x?: number, y?: number }
 */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json().catch(() => ({}));

    const { sourcePlacementId, targetBedId, x, y } = body;

    if (!sourcePlacementId || typeof sourcePlacementId !== "number") {
      return NextResponse.json({ error: "sourcePlacementId is required" }, { status: 400 });
    }

    // Get the source placement with plant and bed
    const sourcePlacement = await prisma.bedPlacement.findUnique({
      where: { id: sourcePlacementId },
      include: {
        plant: true,
        bed: {
          select: { id: true, userId: true, name: true },
        },
      },
    });

    if (!sourcePlacement || sourcePlacement.bed.userId !== userId) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 });
    }

    if (!sourcePlacement.plant.successionEnabled) {
      return NextResponse.json(
        { error: "Succession planting is not enabled for this plant" },
        { status: 400 }
      );
    }

    // Determine the succession group
    let successionGroupId = sourcePlacement.successionGroupId;
    let nextNumber = 1;

    if (!successionGroupId) {
      // Create a new group and update the source to be #1
      successionGroupId = randomUUID();
      await prisma.bedPlacement.update({
        where: { id: sourcePlacementId },
        data: {
          successionGroupId,
          successionNumber: 1,
        },
      });
      nextNumber = 2;
    } else {
      // Find the highest succession number in this group
      const maxNumber = await prisma.bedPlacement.aggregate({
        where: { successionGroupId },
        _max: { successionNumber: true },
      });
      nextNumber = (maxNumber._max.successionNumber ?? 0) + 1;
    }

    // Check if we've hit the max
    const maxCount = sourcePlacement.plant.successionMaxCount ?? 20;
    if (nextNumber > maxCount) {
      return NextResponse.json(
        { error: `Maximum successions (${maxCount}) reached for this plant` },
        { status: 400 }
      );
    }

    // Determine target bed
    const bedId = targetBedId ?? sourcePlacement.bedId;

    // Verify target bed ownership and get dimensions
    let bedWidthInches = 0;
    let bedHeightInches = 0;
    if (bedId !== sourcePlacement.bedId) {
      const targetBed = await prisma.bed.findUnique({
        where: { id: bedId },
        select: { userId: true, widthInches: true, heightInches: true },
      });
      if (!targetBed || targetBed.userId !== userId) {
        return NextResponse.json({ error: "Target bed not found" }, { status: 404 });
      }
      bedWidthInches = targetBed.widthInches;
      bedHeightInches = targetBed.heightInches;
    } else {
      // Get dimensions for the source bed
      const sourceBed = await prisma.bed.findUnique({
        where: { id: bedId },
        select: { widthInches: true, heightInches: true },
      });
      bedWidthInches = sourceBed?.widthInches ?? 48;
      bedHeightInches = sourceBed?.heightInches ?? 48;
    }

    // Determine position - find available spot if not provided
    let newX = typeof x === "number" ? x : sourcePlacement.x;
    let newY = typeof y === "number" ? y : sourcePlacement.y;

    if (x === undefined && y === undefined) {
      // Get all existing placements in the bed
      const existingPlacements = await prisma.bedPlacement.findMany({
        where: { bedId },
        select: { x: true, y: true, w: true, h: true },
      });

      // Helper to check if a position is available
      const isPositionAvailable = (testX: number, testY: number, w: number, h: number) => {
        // Check bounds
        if (testX < 0 || testY < 0 || testX + w > bedWidthInches || testY + h > bedHeightInches) {
          return false;
        }
        // Check overlap with existing placements
        for (const p of existingPlacements) {
          const overlapX = testX < p.x + p.w && testX + w > p.x;
          const overlapY = testY < p.y + p.h && testY + h > p.y;
          if (overlapX && overlapY) return false;
        }
        return true;
      };

      const placementW = sourcePlacement.w;
      const placementH = sourcePlacement.h;

      // Try adjacent positions: right, down, left, up, then diagonals
      const offsets = [
        [placementW, 0],           // right
        [0, placementH],           // down
        [-placementW, 0],          // left
        [0, -placementH],          // up
        [placementW, placementH],  // diagonal down-right
        [-placementW, placementH], // diagonal down-left
        [placementW, -placementH], // diagonal up-right
        [-placementW, -placementH],// diagonal up-left
      ];

      let foundPosition = false;
      for (const [dx, dy] of offsets) {
        const testX = sourcePlacement.x + dx;
        const testY = sourcePlacement.y + dy;
        if (isPositionAvailable(testX, testY, placementW, placementH)) {
          newX = testX;
          newY = testY;
          foundPosition = true;
          break;
        }
      }

      // If no adjacent position available, scan the entire bed
      if (!foundPosition) {
        const step = Math.min(placementW, placementH);
        outer: for (let scanY = 0; scanY < bedHeightInches; scanY += step) {
          for (let scanX = 0; scanX < bedWidthInches; scanX += step) {
            if (isPositionAvailable(scanX, scanY, placementW, placementH)) {
              newX = scanX;
              newY = scanY;
              foundPosition = true;
              break outer;
            }
          }
        }
      }

      if (!foundPosition) {
        return NextResponse.json(
          { error: "No available space in bed for succession planting." },
          { status: 400 }
        );
      }
    }

    // Calculate expected harvest date
    let expectedHarvestDate: Date | null = null;
    const daysToMaturity = sourcePlacement.plant.daysToMaturityMax ?? sourcePlacement.plant.daysToMaturityMin;
    if (daysToMaturity) {
      expectedHarvestDate = new Date();
      expectedHarvestDate.setDate(expectedHarvestDate.getDate() + daysToMaturity);
    }

    // Create the new succession placement
    const newPlacement = await prisma.bedPlacement.create({
      data: {
        bedId,
        plantId: sourcePlacement.plantId,
        x: newX,
        y: newY,
        w: sourcePlacement.w,
        h: sourcePlacement.h,
        count: sourcePlacement.count,
        successionGroupId,
        successionNumber: nextNumber,
        expectedHarvestDate,
        // Set today as the direct sow date by default
        directSowedDate: new Date(),
      },
      include: {
        plant: true,
        bed: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(newPlacement, { status: 201 });
  } catch (error) {
    console.error("Error creating succession:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Handle unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "Position is already occupied in that bed" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create succession" }, { status: 500 });
  }
}
