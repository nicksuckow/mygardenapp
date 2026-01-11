import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function bedSizeInGardenCells(
  bed: { widthInches: number; heightInches: number; gardenRotated?: boolean | null },
  gardenCellInches: number
) {
  const wIn = bed.gardenRotated ? bed.heightInches : bed.widthInches;
  const hIn = bed.gardenRotated ? bed.widthInches : bed.heightInches;

  return {
    w: Math.max(1, Math.ceil(wIn / gardenCellInches)),
    h: Math.max(1, Math.ceil(hIn / gardenCellInches)),
  };
}

export async function POST(req: Request, ctx: Ctx) {
  const { id: idStr } = await ctx.params;
  const bedId = Number(idStr);
  if (!Number.isFinite(bedId)) {
    return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const gardenX = Number(body.gardenX);
  const gardenY = Number(body.gardenY);

  if (!Number.isFinite(gardenX) || !Number.isFinite(gardenY)) {
    return NextResponse.json({ error: "gardenX and gardenY are required." }, { status: 400 });
  }

  const garden = await prisma.garden.findUnique({ where: { id: 1 } });
  if (!garden) {
    return NextResponse.json({ error: "Garden not set up yet." }, { status: 400 });
  }

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    select: { id: true, name: true, widthInches: true, heightInches: true, gardenRotated: true },
  });
  if (!bed) {
    return NextResponse.json({ error: "Bed not found." }, { status: 404 });
  }

  const gardenCols = Math.max(1, Math.floor(garden.widthInches / garden.cellInches));
  const gardenRows = Math.max(1, Math.floor(garden.heightInches / garden.cellInches));

  const mySize = bedSizeInGardenCells(bed, garden.cellInches);

  if (
    gardenX < 0 ||
    gardenY < 0 ||
    gardenX + mySize.w > gardenCols ||
    gardenY + mySize.h > gardenRows
  ) {
    return NextResponse.json({ error: "Bed would be outside the garden bounds." }, { status: 400 });
  }

  const others = await prisma.bed.findMany({
    where: { id: { not: bedId }, gardenX: { not: null }, gardenY: { not: null } },
    select: {
      id: true,
      name: true,
      gardenX: true,
      gardenY: true,
      widthInches: true,
      heightInches: true,
      gardenRotated: true,
    },
  });

  const myRect = { x: gardenX, y: gardenY, w: mySize.w, h: mySize.h };

  for (const o of others) {
    const ox = o.gardenX ?? 0;
    const oy = o.gardenY ?? 0;
    const os = bedSizeInGardenCells(o, garden.cellInches);

    if (rectsOverlap(myRect, { x: ox, y: oy, w: os.w, h: os.h })) {
      return NextResponse.json({ error: `Overlaps with "${o.name}".` }, { status: 400 });
    }
  }

  const updated = await prisma.bed.update({
    where: { id: bedId },
    data: { gardenX, gardenY },
  });

  return NextResponse.json(updated);
}
