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
    return NextResponse.json({ error: "Failed to fetch plan data" }, { status: 500 });
  }
}
