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
    const gateId = Number(id);

    if (!Number.isInteger(gateId) || gateId <= 0) {
      return NextResponse.json({ error: "Invalid gate id" }, { status: 400 });
    }

    // Verify ownership before updating
    const gate = await prisma.gate.findUnique({
      where: { id: gateId },
    });

    if (!gate || gate.userId !== userId) {
      return NextResponse.json({ error: "Gate not found or access denied" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const updates: { x?: number; y?: number; width?: number; side?: string } = {};

    if (typeof body.x === "number" && body.x >= 0) updates.x = body.x;
    if (typeof body.y === "number" && body.y >= 0) updates.y = body.y;
    if (typeof body.width === "number" && body.width >= 1) updates.width = body.width;
    if (typeof body.side === "string" && ["top", "bottom", "left", "right"].includes(body.side)) {
      updates.side = body.side;
    }

    const updated = await prisma.gate.update({
      where: { id: gateId },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating gate:", error);
    return NextResponse.json({ error: "Unauthorized or failed to update gate" }, { status: 401 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const gateId = Number(id);

    if (!Number.isInteger(gateId) || gateId <= 0) {
      return NextResponse.json({ error: "Invalid gate id" }, { status: 400 });
    }

    // Verify ownership before deleting
    const gate = await prisma.gate.findUnique({
      where: { id: gateId },
    });

    if (!gate || gate.userId !== userId) {
      return NextResponse.json({ error: "Gate not found or access denied" }, { status: 404 });
    }

    await prisma.gate.delete({
      where: { id: gateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gate:", error);
    return NextResponse.json({ error: "Unauthorized or failed to delete gate" }, { status: 401 });
  }
}
