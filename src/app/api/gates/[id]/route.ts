import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

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
