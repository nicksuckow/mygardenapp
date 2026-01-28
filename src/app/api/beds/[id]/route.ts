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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch bed" }, { status: 500 });
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

    // Build update data object with supported fields
    const updateData: { name?: string; notes?: string | null; gardenRotated?: boolean; microClimate?: string | null } = {};

    // Handle name update
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "Bed name cannot be empty" }, { status: 400 });
      }
      if (name.length > 100) {
        return NextResponse.json({ error: "Bed name must be 100 characters or less" }, { status: 400 });
      }
      updateData.name = name;
    }

    // Handle notes update
    if (body.notes !== undefined) {
      updateData.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    }

    // Handle gardenRotated update
    if (typeof body.gardenRotated === "boolean") {
      updateData.gardenRotated = body.gardenRotated;
    }

    // Handle microClimate update
    if (body.microClimate !== undefined) {
      // Valid options: full-sun, partial-shade, full-shade, south-facing, north-facing, windy, sheltered, wet, dry
      const validOptions = ["full-sun", "partial-shade", "full-shade", "south-facing", "north-facing", "windy", "sheltered", "wet", "dry"];
      if (body.microClimate === null || body.microClimate === "") {
        updateData.microClimate = null;
      } else if (typeof body.microClimate === "string") {
        // Validate each comma-separated value
        const values = body.microClimate.split(",").map((v: string) => v.trim()).filter(Boolean);
        const invalidValues = values.filter((v: string) => !validOptions.includes(v));
        if (invalidValues.length > 0) {
          return NextResponse.json(
            { error: `Invalid microClimate values: ${invalidValues.join(", ")}. Valid options: ${validOptions.join(", ")}` },
            { status: 400 }
          );
        }
        updateData.microClimate = values.join(",");
      }
    }

    // Require at least one field to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field (name, notes, gardenRotated, or microClimate) is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.bed.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating bed:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update bed" }, { status: 500 });
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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete bed" }, { status: 500 });
  }
}
