import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/account/export
 * Export all user data as JSON - GDPR data portability requirement.
 * Returns all plants, beds, placements, seeds, journal entries, and settings.
 */
export async function GET(req: Request) {
  // Rate limit check
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "data-export", RATE_LIMITS.general);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to export your data" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all user data in parallel
    const [
      user,
      settings,
      plants,
      beds,
      placements,
      seedInventory,
      journalEntries,
      gardenYears,
      garden,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      }),
      prisma.userSettings.findUnique({
        where: { userId },
      }),
      prisma.plant.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.bed.findMany({
        where: { userId },
        include: {
          placementHistory: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.bedPlacement.findMany({
        where: {
          bed: { userId },
        },
        include: {
          plant: { select: { name: true, variety: true } },
          bed: { select: { name: true } },
        },
      }),
      prisma.seedInventory.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.gardenJournal.findMany({
        where: { userId },
        orderBy: { entryDate: "desc" },
      }),
      prisma.gardenYear.findMany({
        where: { userId },
        orderBy: { year: "desc" },
      }),
      prisma.garden.findUnique({
        where: { userId },
        include: {
          walkways: true,
          gates: true,
        },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      user: {
        ...user,
        // Exclude sensitive fields
        password: undefined,
      },
      settings,
      garden,
      plants: plants.map((p) => ({
        ...p,
        // Remove internal IDs that aren't meaningful outside the app
        userId: undefined,
      })),
      beds: beds.map((b) => ({
        ...b,
        userId: undefined,
        placements: placements
          .filter((p) => p.bedId === b.id)
          .map((p) => ({
            ...p,
            plantName: p.plant.name,
            plantVariety: p.plant.variety,
            plant: undefined,
            bed: undefined,
          })),
      })),
      seedInventory: seedInventory.map((s) => ({
        ...s,
        userId: undefined,
      })),
      journalEntries: journalEntries.map((j) => ({
        ...j,
        userId: undefined,
      })),
      gardenYears: gardenYears.map((g) => ({
        ...g,
        userId: undefined,
      })),
    };

    // Return as downloadable JSON file
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="garden-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data. Please try again." },
      { status: 500 }
    );
  }
}
