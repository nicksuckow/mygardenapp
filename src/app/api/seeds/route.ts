import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const seeds = await prisma.seedInventory.findMany({
      where: { userId },
      include: {
        plant: {
          select: { id: true, name: true, variety: true },
        },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(seeds);
  } catch (error) {
    console.error("Error fetching seeds:", error);
    return NextResponse.json(
      { error: "Unauthorized or failed to fetch seeds" },
      { status: 401 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json().catch(() => ({}));

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Seed name is required." },
        { status: 400 }
      );
    }

    const seed = await prisma.seedInventory.create({
      data: {
        userId,
        name,
        variety: body.variety || null,
        brand: body.brand || null,
        quantity: typeof body.quantity === "number" ? body.quantity : 1,
        seedCount: typeof body.seedCount === "number" ? body.seedCount : null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        lotNumber: body.lotNumber || null,
        notes: body.notes || null,
        sowingInstructions: body.sowingInstructions || null,
        daysToGermination: typeof body.daysToGermination === "number" ? body.daysToGermination : null,
        germinationRate: typeof body.germinationRate === "number" ? body.germinationRate : null,
        status: body.status || "available",
        plantId: typeof body.plantId === "number" ? body.plantId : null,
      },
    });

    return NextResponse.json(seed, { status: 201 });
  } catch (error) {
    console.error("Error creating seed:", error);
    return NextResponse.json(
      { error: "Failed to create seed inventory item" },
      { status: 500 }
    );
  }
}
