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
    return Response.json({ error: "Unauthorized or failed to fetch beds" }, { status: 401 });
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
    if (!Number.isFinite(cellInches) || (cellInches !== 6 && cellInches !== 12)) {
      return Response.json({ error: "Cell size must be 6 or 12 inches." }, { status: 400 });
    }

    const bed = await prisma.bed.create({
      data: {
        userId,
        name,
        widthInches,
        heightInches,
        cellInches,
      },
    });

    return Response.json(bed);
  } catch (error) {
    console.error("Error creating bed:", error);
    return Response.json({ error: "Unauthorized or failed to create bed" }, { status: 401 });
  }
}
