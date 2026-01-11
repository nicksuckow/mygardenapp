import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bedId = Number(id);

  if (!Number.isInteger(bedId) || bedId <= 0) {
    return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
  }

  const body = await req.json();
  const plantId = Number(body.plantId);
  const x = Number(body.x);
  const y = Number(body.y);

  if (!Number.isInteger(plantId)) {
    return NextResponse.json({ error: "Invalid plant id" }, { status: 400 });
  }
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // Load bed + current placements
  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: { placements: { include: { plant: true } } },
  });
  if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 });

  // Load plant we’re trying to place
  const plant = await prisma.plant.findUnique({ where: { id: plantId } });
  if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

  // Convert spacing inches -> required cells on this bed’s grid
  // Example: spacing 24" on 12" grid => requiredCells = 2
  const requiredCells = Math.max(1, Math.ceil(plant.spacingInches / bed.cellInches));

  // Reject if too close to ANY existing placement (except the same cell)
  for (const p of bed.placements) {
    if (p.x === x && p.y === y) continue;

    const dx = Math.abs(p.x - x);
    const dy = Math.abs(p.y - y);

    // Square distance in cell-space (simple + beginner friendly)
    if (dx < requiredCells && dy < requiredCells) {
      return NextResponse.json(
        {
          error: "Too close to another plant",
          details: {
            placing: plant.name,
            existing: p.plant.name,
            requiredCells,
            gridCellInches: bed.cellInches,
          },
        },
        { status: 409 }
      );
    }
  }

  // Place (update if occupied, else create)
  const existing = await prisma.bedPlacement.findFirst({
    where: { bedId, x, y },
  });

  const placement = existing
    ? await prisma.bedPlacement.update({
        where: { id: existing.id },
        data: { plantId },
      })
    : await prisma.bedPlacement.create({
        data: { bedId, plantId, x, y, w: 1, h: 1, count: 1 },
      });

  return NextResponse.json(placement);
}
