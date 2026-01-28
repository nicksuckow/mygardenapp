import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in to view your planting schedule" }, { status: 401 });
    }

    const userId = session.user.id;

    // First get user's bed IDs (fast indexed query)
    const userBeds = await prisma.bed.findMany({
      where: { userId },
      select: { id: true },
    });

    const bedIds = userBeds.map((b) => b.id);

    if (bedIds.length === 0) {
      return NextResponse.json([]);
    }

    // Then query placements directly with bedId IN (...) - uses index
    const placements = await prisma.bedPlacement.findMany({
      where: {
        bedId: { in: bedIds },
      },
      include: {
        plant: true,
        bed: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ bedId: "asc" }, { y: "asc" }, { x: "asc" }],
    });

    return NextResponse.json(placements);
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan data" }, { status: 500 });
  }
}
