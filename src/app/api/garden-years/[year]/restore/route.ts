import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ year: string }> };

type ArchivedBed = {
  name: string;
  widthInches: number;
  heightInches: number;
  cellInches: number;
  gardenX: number | null;
  gardenY: number | null;
  gardenRotated: boolean;
  microClimate: string | null;
  placements: {
    x: number;
    y: number;
    w: number;
    h: number;
    plantName: string;
    plantSpacing: number;
  }[];
};

// Restore beds and layout from a previous year (creates new placements without dates)
export async function POST(req: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { year: yearStr } = await ctx.params;
    const year = Number(yearStr);

    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const restoreLayout = body.restoreLayout !== false; // Default true
    const restorePlacements = body.restorePlacements !== false; // Default true

    // Get the archive
    const gardenYear = await prisma.gardenYear.findUnique({
      where: { userId_year: { userId, year } },
    });

    if (!gardenYear || !gardenYear.bedsSnapshot) {
      return NextResponse.json({ error: "Archive not found or empty" }, { status: 404 });
    }

    const archivedBeds: ArchivedBed[] = JSON.parse(gardenYear.bedsSnapshot);

    // Get user's existing plants (for matching by name)
    const userPlants = await prisma.plant.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const plantsByName = new Map(userPlants.map((p) => [p.name.toLowerCase(), p.id]));

    const results = {
      bedsCreated: 0,
      bedsUpdated: 0,
      placementsCreated: 0,
      plantsNotFound: [] as string[],
    };

    // Get existing beds to check for duplicates
    const existingBeds = await prisma.bed.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const existingBedNames = new Map(existingBeds.map((b) => [b.name.toLowerCase(), b.id]));

    for (const archivedBed of archivedBeds) {
      let bedId: number;

      // Check if bed with this name exists
      const existingBedId = existingBedNames.get(archivedBed.name.toLowerCase());

      if (existingBedId) {
        // Update existing bed if restoring layout
        if (restoreLayout) {
          await prisma.bed.update({
            where: { id: existingBedId },
            data: {
              gardenX: archivedBed.gardenX,
              gardenY: archivedBed.gardenY,
              gardenRotated: archivedBed.gardenRotated,
              microClimate: archivedBed.microClimate,
            },
          });
          results.bedsUpdated++;
        }
        bedId = existingBedId;
      } else {
        // Create new bed
        const newBed = await prisma.bed.create({
          data: {
            userId,
            name: archivedBed.name,
            widthInches: archivedBed.widthInches,
            heightInches: archivedBed.heightInches,
            cellInches: archivedBed.cellInches,
            gardenX: restoreLayout ? archivedBed.gardenX : null,
            gardenY: restoreLayout ? archivedBed.gardenY : null,
            gardenRotated: archivedBed.gardenRotated,
            microClimate: archivedBed.microClimate,
          },
        });
        bedId = newBed.id;
        results.bedsCreated++;
      }

      // Restore placements
      if (restorePlacements) {
        for (const placement of archivedBed.placements) {
          const plantId = plantsByName.get(placement.plantName.toLowerCase());

          if (!plantId) {
            if (!results.plantsNotFound.includes(placement.plantName)) {
              results.plantsNotFound.push(placement.plantName);
            }
            continue;
          }

          // Check if placement already exists at this position
          const existingPlacement = await prisma.bedPlacement.findUnique({
            where: {
              bedId_x_y: { bedId, x: placement.x, y: placement.y },
            },
          });

          if (!existingPlacement) {
            await prisma.bedPlacement.create({
              data: {
                bedId,
                plantId,
                x: placement.x,
                y: placement.y,
                w: placement.w,
                h: placement.h,
                // Don't restore dates - this is a new season
              },
            });
            results.placementsCreated++;
          }
        }
      }
    }

    return NextResponse.json({
      message: `Restored from ${year}`,
      ...results,
    });
  } catch (error) {
    console.error("Error restoring garden year:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to restore archive" }, { status: 500 });
  }
}
