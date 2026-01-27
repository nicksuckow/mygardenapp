import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const walkwayId = Number(id);

    if (!Number.isInteger(walkwayId) || walkwayId <= 0) {
      return NextResponse.json({ error: "Invalid walkway id" }, { status: 400 });
    }

    // Verify ownership before updating
    const walkway = await prisma.walkway.findUnique({
      where: { id: walkwayId },
    });

    if (!walkway || walkway.userId !== userId) {
      return NextResponse.json({ error: "Walkway not found or access denied" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const updates: { x?: number; y?: number; width?: number; height?: number } = {};

    if (typeof body.x === "number" && body.x >= 0) updates.x = body.x;
    if (typeof body.y === "number" && body.y >= 0) updates.y = body.y;
    if (typeof body.width === "number" && body.width >= 1) updates.width = body.width;
    if (typeof body.height === "number" && body.height >= 1) updates.height = body.height;

    const updated = await prisma.walkway.update({
      where: { id: walkwayId },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating walkway:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update walkway" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const walkwayId = Number(id);

    if (!Number.isInteger(walkwayId) || walkwayId <= 0) {
      return NextResponse.json({ error: "Invalid walkway id" }, { status: 400 });
    }

    // Verify ownership before deleting
    const walkway = await prisma.walkway.findUnique({
      where: { id: walkwayId },
    });

    if (!walkway || walkway.userId !== userId) {
      return NextResponse.json({ error: "Walkway not found or access denied" }, { status: 404 });
    }

    await prisma.walkway.delete({
      where: { id: walkwayId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting walkway:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete walkway" }, { status: 500 });
  }
}
