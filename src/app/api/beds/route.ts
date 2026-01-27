import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const beds = await prisma.bed.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(beds);
  } catch (error) {
    console.error("Error fetching beds:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ error: "Failed to fetch beds" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();

    // Validate and sanitize bed name
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return Response.json({ error: "Bed name is required." }, { status: 400 });
    }
    if (name.length > 100) {
      return Response.json({ error: "Bed name must be 100 characters or less." }, { status: 400 });
    }

    // Validate dimensions with bounds checking
    const widthInches = Number(body.widthInches ?? 96);
    const heightInches = Number(body.heightInches ?? 48);
    const cellInches = Number(body.cellInches ?? 12);

    if (!Number.isFinite(widthInches) || widthInches < 6 || widthInches > 10000) {
      return Response.json({ error: "Bed width must be between 6 and 10000 inches." }, { status: 400 });
    }
    if (!Number.isFinite(heightInches) || heightInches < 6 || heightInches > 10000) {
      return Response.json({ error: "Bed height must be between 6 and 10000 inches." }, { status: 400 });
    }
    if (!Number.isFinite(cellInches) || cellInches < 0.5 || cellInches > 1000) {
      return Response.json({ error: "Cell size must be between 0.5 and 1000 inches." }, { status: 400 });
    }

    // Handle optional notes
    const notes = typeof body?.notes === "string" ? body.notes.trim() || null : null;

    const bed = await prisma.bed.create({
      data: {
        userId,
        name,
        widthInches,
        heightInches,
        cellInches,
        notes,
      },
    });

    return Response.json(bed);
  } catch (error) {
    console.error("Error creating bed:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ error: "Failed to create bed" }, { status: 500 });
  }
}
