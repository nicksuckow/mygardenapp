import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ unwrap params
  const bedId = Number(id);

  if (!Number.isInteger(bedId) || bedId <= 0) {
    return NextResponse.json(
      { error: "Invalid bed id", received: id },
      { status: 400 }
    );
  }

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: { placements: { include: { plant: true } } },
  });

  if (!bed) {
    return NextResponse.json({ error: "Bed not found", id: bedId }, { status: 404 });
  }

  return NextResponse.json(bed);
}
