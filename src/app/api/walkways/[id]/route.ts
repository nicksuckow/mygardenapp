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
    return NextResponse.json({ error: "Unauthorized or failed to delete walkway" }, { status: 401 });
  }
}
