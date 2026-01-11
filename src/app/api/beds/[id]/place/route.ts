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

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: { placements: { include: { plant: true } } },
  });
  if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 });

  const plant = await prisma.plant.findUnique({ where: { id: plantId } });
  if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

  const cols = Math.max(1, Math.floor(bed.widthInches / bed.cellInches));
  const rows = Math.max(1, Math.floor(bed.heightInches / bed.cellInches));

  // footprint size in cells (square footprint derived from spacing)
  const footprint = Math.max(1, Math.ceil(plant.spacingInches / bed.cellInches));
  const w = footprint;
  const h = footprint;

  // bounds check
  if (x < 0 || y < 0 || x + w > cols || y + h > rows) {
    return NextResponse.json(
      { error: "Footprint does not fit in bed at that position", details: { x, y, w, h, cols, rows } },
      { status: 409 }
    );
  }

  // overlap check against existing footprints
  const newLeft = x;
  const newTop = y;
  const newRight = x + w - 1;
  const newBottom = y + h - 1;

  for (const p of bed.placements) {
    const pw = p.w ?? 1;
    const ph = p.h ?? 1;

    const left = p.x;
    const top = p.y;
    const right = p.x + pw - 1;
    const bottom = p.y + ph - 1;

    const overlaps =
      newLeft <= right && newRight >= left && newTop <= bottom && newBottom >= top;

    if (overlaps) {
      return NextResponse.json(
        {
          error: "Overlaps an existing plant footprint",
          details: { existingPlant: p.plant.name, existingAt: { x: p.x, y: p.y, w: pw, h: ph } },
        },
        { status: 409 }
      );
    }
  }

  // create a single placement row representing the whole plant footprint
  const placement = await prisma.bedPlacement.create({
    data: { bedId, plantId, x, y, w, h, count: 1 },
  });

  return NextResponse.json(placement);
}
