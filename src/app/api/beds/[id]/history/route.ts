import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Get placement history for a bed
export async function GET(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const bedId = Number(id);

    if (!Number.isInteger(bedId) || bedId <= 0) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    // Verify bed ownership
    const bed = await prisma.bed.findFirst({
      where: { id: bedId, userId },
    });

    if (!bed) {
      return NextResponse.json({ error: "Bed not found or access denied" }, { status: 404 });
    }

    // Get history, ordered by most recent first
    const history = await prisma.placementHistory.findMany({
      where: { bedId },
      orderBy: [
        { seasonYear: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Group by year for easier display
    const byYear: Record<number, typeof history> = {};
    for (const h of history) {
      if (!byYear[h.seasonYear]) {
        byYear[h.seasonYear] = [];
      }
      byYear[h.seasonYear].push(h);
    }

    return NextResponse.json({
      history,
      byYear,
      years: Object.keys(byYear).map(Number).sort((a, b) => b - a),
    });
  } catch (error) {
    console.error("Error fetching placement history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
