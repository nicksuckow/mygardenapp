import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    // Get the original bed with placements
    const originalBed = await prisma.bed.findUnique({
      where: { id, userId },
      include: {
        placements: true,
      },
    });

    if (!originalBed) {
      return NextResponse.json({ error: "Bed not found or access denied" }, { status: 404 });
    }

    // Create the duplicated bed
    const newBed = await prisma.bed.create({
      data: {
        userId,
        name: `${originalBed.name} (Copy)`,
        widthInches: originalBed.widthInches,
        heightInches: originalBed.heightInches,
        cellInches: originalBed.cellInches,
        notes: originalBed.notes,
        // Don't copy garden position - user will place it manually
        gardenX: null,
        gardenY: null,
        gardenRotated: false,
      },
    });

    // Duplicate all placements (without tracking dates - those are specific to the original)
    if (originalBed.placements.length > 0) {
      await prisma.bedPlacement.createMany({
        data: originalBed.placements.map((p) => ({
          bedId: newBed.id,
          plantId: p.plantId,
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h,
          count: p.count,
          // Don't copy dates - start fresh for the new bed
        })),
      });
    }

    // Return the new bed with placements
    const result = await prisma.bed.findUnique({
      where: { id: newBed.id },
      include: {
        placements: {
          include: {
            plant: true,
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error duplicating bed:", error);
    return NextResponse.json({ error: "Failed to duplicate bed" }, { status: 500 });
  }
}
