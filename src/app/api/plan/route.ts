import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const placements = await prisma.bedPlacement.findMany({
    include: { plant: true, bed: true },
    orderBy: [{ bedId: "asc" }, { y: "asc" }, { x: "asc" }],
  });

  return NextResponse.json(placements);
}
