import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const bedId = Number(id);

    if (!Number.isInteger(bedId) || bedId <= 0) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    // Verify bed ownership
    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      select: { userId: true },
    });

    if (!bed || bed.userId !== userId) {
      return NextResponse.json({ error: "Bed not found or access denied" }, { status: 404 });
    }

    const body = await req.json();
    const placementId = Number(body.placementId);

    if (!Number.isInteger(placementId)) {
      return NextResponse.json({ error: "placementId is required" }, { status: 400 });
    }

    // Verify the placement belongs to this bed before deleting
    const placement = await prisma.bedPlacement.findUnique({
      where: { id: placementId },
    });

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 });
    }

    if (placement.bedId !== bedId) {
      return NextResponse.json({ error: "Placement does not belong to this bed" }, { status: 403 });
    }

    await prisma.bedPlacement.delete({
      where: { id: placementId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting placement:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete placement" }, { status: 500 });
  }
}
