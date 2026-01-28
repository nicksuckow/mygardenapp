import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const seedId = parseInt(id, 10);

    const seed = await prisma.seedInventory.findFirst({
      where: { id: seedId, userId },
      include: {
        plant: {
          select: { id: true, name: true, variety: true },
        },
      },
    });

    if (!seed) {
      return NextResponse.json({ error: "Seed not found" }, { status: 404 });
    }

    return NextResponse.json(seed);
  } catch (error) {
    console.error("Error fetching seed:", error);
    return NextResponse.json(
      { error: "Unauthorized or failed to fetch seed" },
      { status: 401 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const seedId = parseInt(id, 10);
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.seedInventory.findFirst({
      where: { id: seedId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Seed not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.variety !== undefined) updateData.variety = body.variety;
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.seedCount !== undefined) updateData.seedCount = body.seedCount;
    if (body.purchaseDate !== undefined) {
      updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    }
    if (body.expirationDate !== undefined) {
      updateData.expirationDate = body.expirationDate ? new Date(body.expirationDate) : null;
    }
    if (body.lotNumber !== undefined) updateData.lotNumber = body.lotNumber;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.sowingInstructions !== undefined) updateData.sowingInstructions = body.sowingInstructions;
    if (body.daysToGermination !== undefined) updateData.daysToGermination = body.daysToGermination;
    if (body.germinationRate !== undefined) updateData.germinationRate = body.germinationRate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.plantId !== undefined) updateData.plantId = body.plantId;

    const updated = await prisma.seedInventory.update({
      where: { id: seedId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating seed:", error);
    return NextResponse.json(
      { error: "Failed to update seed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const seedId = parseInt(id, 10);

    // Verify ownership
    const existing = await prisma.seedInventory.findFirst({
      where: { id: seedId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Seed not found" }, { status: 404 });
    }

    await prisma.seedInventory.delete({
      where: { id: seedId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting seed:", error);
    return NextResponse.json(
      { error: "Failed to delete seed" },
      { status: 500 }
    );
  }
}
