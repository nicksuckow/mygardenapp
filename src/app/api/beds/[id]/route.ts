import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    const bed = await prisma.bed.findUnique({
      where: { id, userId },
      include: {
        placements: {
          include: {
            plant: true,
          },
        },
      },
    });

    if (!bed) {
      return NextResponse.json({ error: "Bed not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(bed);
  } catch (error) {
    console.error("Error fetching bed:", error);
    return NextResponse.json({ error: "Unauthorized or failed to fetch bed" }, { status: 401 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    // Verify ownership
    const bed = await prisma.bed.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!bed || bed.userId !== userId) {
      return NextResponse.json({ error: "Bed not found or access denied" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const gardenRotated =
      typeof body.gardenRotated === "boolean" ? body.gardenRotated : null;

    if (gardenRotated == null) {
      return NextResponse.json(
        { error: "gardenRotated boolean is required." },
        { status: 400 }
      );
    }

    const updated = await prisma.bed.update({
      where: { id },
      data: { gardenRotated },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating bed:", error);
    return NextResponse.json({ error: "Unauthorized or failed to update bed" }, { status: 401 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    // Verify ownership
    const bed = await prisma.bed.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!bed || bed.userId !== userId) {
      return NextResponse.json({ error: "Bed not found or access denied" }, { status: 404 });
    }

    // Safety: prevent deleting beds that still have plants placed
    const placementsCount = await prisma.bedPlacement.count({
      where: { bedId: id },
    });

    if (placementsCount > 0) {
      return NextResponse.json(
        { error: "This bed still has plants placed. Clear the bed before deleting it." },
        { status: 400 }
      );
    }

    await prisma.bed.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting bed:", error);
    return NextResponse.json({ error: "Unauthorized or failed to delete bed" }, { status: 401 });
  }
}
