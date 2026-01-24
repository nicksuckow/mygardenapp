import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const placements = await prisma.bedPlacement.findMany({
      where: {
        bed: { userId },
      },
      include: { plant: true, bed: true },
      orderBy: [{ bedId: "asc" }, { y: "asc" }, { x: "asc" }],
    });

    return NextResponse.json(placements);
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Unauthorized or failed to fetch plan" }, { status: 401 });
  }
}
