import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseOptionalDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) {
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

// GET - fetch all frost date history for current user
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const history = await prisma.frostDateHistory.findMany({
      where: { userId },
      orderBy: { year: "desc" },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("GET /api/frost-history error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch frost history" }, { status: 500 });
  }
}

// POST - create or update frost date record for a specific year
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();

    const year = parseInt(body.year, 10);
    if (isNaN(year) || year < 1900 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const actualLastSpringFrost = parseOptionalDate(body.actualLastSpringFrost);
    const actualFirstFallFrost = parseOptionalDate(body.actualFirstFallFrost);
    const notes = body.notes ? String(body.notes) : null;

    const saved = await prisma.frostDateHistory.upsert({
      where: {
        userId_year: { userId, year },
      },
      create: {
        userId,
        year,
        actualLastSpringFrost,
        actualFirstFallFrost,
        notes,
      },
      update: {
        actualLastSpringFrost,
        actualFirstFallFrost,
        notes,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("POST /api/frost-history error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save frost history" }, { status: 500 });
  }
}

// DELETE - remove frost date record for a specific year
export async function DELETE(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    if (!yearParam) {
      return NextResponse.json({ error: "Year parameter required" }, { status: 400 });
    }

    const year = parseInt(yearParam, 10);
    if (isNaN(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    await prisma.frostDateHistory.delete({
      where: {
        userId_year: { userId, year },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/frost-history error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // If record not found, that's OK
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Failed to delete frost history" }, { status: 500 });
  }
}
