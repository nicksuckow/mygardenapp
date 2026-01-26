import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

/**
 * GET /api/placements/[id]
 * Get placement details with plant and bed data
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const placementId = parseInt(id);

    if (isNaN(placementId)) {
      return NextResponse.json(
        { error: "Invalid placement ID" },
        { status: 400 }
      );
    }

    const placement = await prisma.bedPlacement.findUnique({
      where: { id: placementId },
      include: {
        plant: true,
        bed: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    if (!placement || placement.bed.userId !== userId) {
      return NextResponse.json(
        { error: "Placement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(placement);
  } catch (error) {
    console.error("Error fetching placement:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch placement" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/placements/[id]
 * Update placement tracking dates
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const placementId = parseInt(id);

    if (isNaN(placementId)) {
      return NextResponse.json(
        { error: "Invalid placement ID" },
        { status: 400 }
      );
    }

    // Verify ownership
    const placement = await prisma.bedPlacement.findUnique({
      where: { id: placementId },
      include: {
        bed: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!placement || placement.bed.userId !== userId) {
      return NextResponse.json(
        { error: "Placement not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      seedsStartedDate,
      transplantedDate,
      directSowedDate,
      harvestStartedDate,
      harvestEndedDate,
      notes,
      x,
      y,
    } = body;

    // Validate dates if provided
    const updates: {
      seedsStartedDate?: Date | null;
      transplantedDate?: Date | null;
      directSowedDate?: Date | null;
      harvestStartedDate?: Date | null;
      harvestEndedDate?: Date | null;
      notes?: string | null;
      x?: number;
      y?: number;
    } = {};

    if (seedsStartedDate !== undefined) {
      updates.seedsStartedDate = seedsStartedDate ? new Date(seedsStartedDate) : null;
    }
    if (transplantedDate !== undefined) {
      updates.transplantedDate = transplantedDate ? new Date(transplantedDate) : null;
    }
    if (directSowedDate !== undefined) {
      updates.directSowedDate = directSowedDate ? new Date(directSowedDate) : null;
    }
    if (harvestStartedDate !== undefined) {
      updates.harvestStartedDate = harvestStartedDate ? new Date(harvestStartedDate) : null;
    }
    if (harvestEndedDate !== undefined) {
      updates.harvestEndedDate = harvestEndedDate ? new Date(harvestEndedDate) : null;
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }
    if (x !== undefined && typeof x === "number" && x >= 0) {
      updates.x = x;
    }
    if (y !== undefined && typeof y === "number" && y >= 0) {
      updates.y = y;
    }

    const updated = await prisma.bedPlacement.update({
      where: { id: placementId },
      data: updates,
      include: {
        plant: true,
        bed: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating placement:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update placement" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/placements/[id]
 * Delete a placement
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const placementId = parseInt(id);

    if (isNaN(placementId)) {
      return NextResponse.json(
        { error: "Invalid placement ID" },
        { status: 400 }
      );
    }

    // Verify ownership
    const placement = await prisma.bedPlacement.findUnique({
      where: { id: placementId },
      include: {
        bed: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!placement || placement.bed.userId !== userId) {
      return NextResponse.json(
        { error: "Placement not found" },
        { status: 404 }
      );
    }

    await prisma.bedPlacement.delete({
      where: { id: placementId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting placement:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete placement" },
      { status: 500 }
    );
  }
}
