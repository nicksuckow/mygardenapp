import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

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
  try {
    const userId = await getCurrentUserId();

    const { id: idStr } = await ctx.params;
    const bedId = Number(idStr);
    if (!Number.isFinite(bedId)) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // Allow null to remove bed from garden
    const gardenX = body.gardenX === null ? null : Number(body.gardenX);
    const gardenY = body.gardenY === null ? null : Number(body.gardenY);

    // Verify bed belongs to user
    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      select: { id: true, userId: true, name: true, widthInches: true, heightInches: true, gardenRotated: true },
    });
    if (!bed) {
      return NextResponse.json({ error: "Bed not found." }, { status: 404 });
    }
    if (bed.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If removing from garden (null values), update and return early
    if (gardenX === null || gardenY === null) {
      const updated = await prisma.bed.update({
        where: { id: bedId },
        data: { gardenX: null, gardenY: null },
      });
      return NextResponse.json(updated);
    }

    if (!Number.isFinite(gardenX) || !Number.isFinite(gardenY)) {
      return NextResponse.json({ error: "gardenX and gardenY must be valid numbers or null." }, { status: 400 });
    }

    // Get the user's garden
    const garden = await prisma.garden.findUnique({ where: { userId } });
    if (!garden) {
      return NextResponse.json({ error: "Garden not set up yet." }, { status: 400 });
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

    // Check for overlaps with OTHER beds belonging to this user
    const others = await prisma.bed.findMany({
      where: {
        userId,
        id: { not: bedId },
        gardenX: { not: null },
        gardenY: { not: null }
      },
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
  } catch (error) {
    console.error("Error updating bed position:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
  }
}
