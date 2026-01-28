import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const years = await prisma.gardenYear.findMany({
      where: { userId },
      orderBy: { year: "desc" },
    });

    return NextResponse.json(years);
  } catch (error) {
    console.error("Error fetching garden years:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch garden years" }, { status: 500 });
  }
}

// Archive current garden as a year snapshot
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json().catch(() => ({}));

    const year = typeof body?.year === "number" ? body.year : new Date().getFullYear();

    // Check if year already exists
    const existing = await prisma.gardenYear.findUnique({
      where: { userId_year: { userId, year } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Archive for ${year} already exists. Delete it first to create a new one.` },
        { status: 400 }
      );
    }

    // Get current garden data
    const garden = await prisma.garden.findUnique({
      where: { userId },
    });

    // Get all beds with placements
    const beds = await prisma.bed.findMany({
      where: { userId },
      include: {
        placements: {
          include: {
            plant: {
              select: { id: true, name: true, spacingInches: true },
            },
          },
        },
      },
    });

    // Calculate stats
    const totalPlacements = beds.reduce((sum, b) => sum + b.placements.length, 0);
    const totalHarvest = beds.reduce((sum, b) => {
      return sum + b.placements.reduce((pSum, p) => pSum + (p.harvestYield ?? 0), 0);
    }, 0);

    // Create the archive
    const gardenYear = await prisma.gardenYear.create({
      data: {
        userId,
        year,
        name: body.name || `${year} Garden`,
        gardenSnapshot: garden ? JSON.stringify(garden) : null,
        bedsSnapshot: JSON.stringify(
          beds.map((b) => ({
            id: b.id,
            name: b.name,
            widthInches: b.widthInches,
            heightInches: b.heightInches,
            cellInches: b.cellInches,
            gardenX: b.gardenX,
            gardenY: b.gardenY,
            gardenRotated: b.gardenRotated,
            microClimate: b.microClimate,
            placements: b.placements.map((p) => ({
              x: p.x,
              y: p.y,
              w: p.w,
              h: p.h,
              plantName: p.plant.name,
              plantSpacing: p.plant.spacingInches,
              seedsStartedDate: p.seedsStartedDate,
              transplantedDate: p.transplantedDate,
              directSowedDate: p.directSowedDate,
              harvestStartedDate: p.harvestStartedDate,
              harvestEndedDate: p.harvestEndedDate,
              harvestYield: p.harvestYield,
              harvestYieldUnit: p.harvestYieldUnit,
            })),
          }))
        ),
        totalBeds: beds.length,
        totalPlacements,
        totalHarvest: totalHarvest > 0 ? totalHarvest : null,
        harvestUnit: "lbs", // Default
      },
    });

    return NextResponse.json(gardenYear, { status: 201 });
  } catch (error) {
    console.error("Error creating garden year archive:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create archive" }, { status: 500 });
  }
}
