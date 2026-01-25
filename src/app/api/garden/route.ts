import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const garden = await prisma.garden.findUnique({
      where: { userId },
    });

    return NextResponse.json(garden);
  } catch (error) {
    console.error("Error fetching garden:", error);
    return NextResponse.json({ error: "Unauthorized or failed to fetch garden" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json().catch(() => ({}));

    const widthInches = Number(body.widthInches);
    const heightInches = Number(body.heightInches);
    const cellInches = body.cellInches == null ? 12 : Number(body.cellInches);

    if (!Number.isFinite(widthInches) || widthInches < 12 || widthInches > 10000) {
      return NextResponse.json({ error: "Garden width must be between 12 and 10000 inches." }, { status: 400 });
    }
    if (!Number.isFinite(heightInches) || heightInches < 12 || heightInches > 10000) {
      return NextResponse.json({ error: "Garden height must be between 12 and 10000 inches." }, { status: 400 });
    }
    if (!Number.isFinite(cellInches) || cellInches < 0.5 || cellInches > 1000) {
      return NextResponse.json({ error: "cellInches must be between 0.5 and 1000 inches." }, { status: 400 });
    }

    const garden = await prisma.garden.upsert({
      where: { userId },
      create: { userId, widthInches, heightInches, cellInches },
      update: { widthInches, heightInches, cellInches },
    });

    return NextResponse.json(garden);
  } catch (error) {
    console.error("Error updating garden:", error);
    return NextResponse.json({ error: "Unauthorized or failed to update garden" }, { status: 401 });
  }
}
