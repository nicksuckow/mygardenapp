// src/app/api/plants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

// Accepts: 1, "1", "0.5", "1/2", "1 1/2"
function parseFractionToNumber(v: unknown): number | null {
  if (v == null) return null;

  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null;
  }

  if (typeof v !== "string") return null;

  const s = v.trim();
  if (!s) return null;

  // "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (
      Number.isFinite(whole) &&
      Number.isFinite(num) &&
      Number.isFinite(den) &&
      den !== 0
    ) {
      return whole + num / den;
    }
    return null;
  }

  // "1/2"
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) return num / den;
    return null;
  }

  // "0.75" / "2"
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const plants = await prisma.plant.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(plants);
  } catch (error) {
    console.error("Error fetching plants:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch plants" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json().catch(() => ({}));

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Plant name is required." }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Plant name must be 100 characters or less." }, { status: 400 });
    }

    const spacingInches =
      typeof body?.spacingInches === "number" && Number.isFinite(body.spacingInches)
        ? body.spacingInches
        : 12;

    // Validate spacing bounds
    if (spacingInches < 0.25 || spacingInches > 120) {
      return NextResponse.json({ error: "Plant spacing must be between 0.25 and 120 inches." }, { status: 400 });
    }

    const daysToMaturityMin =
      typeof body?.daysToMaturityMin === "number" && Number.isFinite(body.daysToMaturityMin)
        ? body.daysToMaturityMin
        : null;

    const daysToMaturityMax =
      typeof body?.daysToMaturityMax === "number" && Number.isFinite(body.daysToMaturityMax)
        ? body.daysToMaturityMax
        : null;

    // Validate days to maturity bounds
    if (daysToMaturityMin !== null && (daysToMaturityMin < 0 || daysToMaturityMin > 365)) {
      return NextResponse.json({ error: "Days to maturity min must be between 0 and 365." }, { status: 400 });
    }
    if (daysToMaturityMax !== null && (daysToMaturityMax < 0 || daysToMaturityMax > 365)) {
      return NextResponse.json({ error: "Days to maturity max must be between 0 and 365." }, { status: 400 });
    }

    const startIndoorsWeeksBeforeFrost =
      typeof body?.startIndoorsWeeksBeforeFrost === "number" &&
      Number.isFinite(body.startIndoorsWeeksBeforeFrost)
        ? body.startIndoorsWeeksBeforeFrost
        : null;

    const transplantWeeksAfterFrost =
      typeof body?.transplantWeeksAfterFrost === "number" &&
      Number.isFinite(body.transplantWeeksAfterFrost)
        ? body.transplantWeeksAfterFrost
        : null;

    const directSowWeeksRelativeToFrost =
      typeof body?.directSowWeeksRelativeToFrost === "number" &&
      Number.isFinite(body.directSowWeeksRelativeToFrost)
        ? body.directSowWeeksRelativeToFrost
        : null;

    // Validate week bounds
    if (startIndoorsWeeksBeforeFrost !== null && (startIndoorsWeeksBeforeFrost < -52 || startIndoorsWeeksBeforeFrost > 52)) {
      return NextResponse.json({ error: "Start indoors weeks must be between -52 and 52." }, { status: 400 });
    }
    if (transplantWeeksAfterFrost !== null && (transplantWeeksAfterFrost < -52 || transplantWeeksAfterFrost > 52)) {
      return NextResponse.json({ error: "Transplant weeks must be between -52 and 52." }, { status: 400 });
    }
    if (directSowWeeksRelativeToFrost !== null && (directSowWeeksRelativeToFrost < -52 || directSowWeeksRelativeToFrost > 52)) {
      return NextResponse.json({ error: "Direct sow weeks must be between -52 and 52." }, { status: 400 });
    }

    const plantingDepthInches = parseFractionToNumber(body?.plantingDepthInches);

    // Validate planting depth bounds
    if (plantingDepthInches !== null && (plantingDepthInches < 0 || plantingDepthInches > 24)) {
      return NextResponse.json({ error: "Planting depth must be between 0 and 24 inches." }, { status: 400 });
    }

    const hasSeeds = body?.hasSeeds === true;

    const plant = await prisma.plant.create({
      data: {
        userId,
        name,
        spacingInches,
        daysToMaturityMin,
        daysToMaturityMax,
        startIndoorsWeeksBeforeFrost,
        transplantWeeksAfterFrost,
        directSowWeeksRelativeToFrost,
        plantingDepthInches,
        hasSeeds,
      },
    });

    return NextResponse.json(plant, { status: 201 });
  } catch (error) {
    console.error("Error creating plant:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create plant" }, { status: 500 });
  }
}
