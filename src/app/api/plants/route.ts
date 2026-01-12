// src/app/api/plants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const plants = await prisma.plant.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(plants);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Plant name is required." }, { status: 400 });

  const spacingInches =
    typeof body?.spacingInches === "number" && Number.isFinite(body.spacingInches)
      ? body.spacingInches
      : 12;

  const daysToMaturityMin =
    typeof body?.daysToMaturityMin === "number" && Number.isFinite(body.daysToMaturityMin)
      ? body.daysToMaturityMin
      : null;

  const daysToMaturityMax =
    typeof body?.daysToMaturityMax === "number" && Number.isFinite(body.daysToMaturityMax)
      ? body.daysToMaturityMax
      : null;

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

  const plantingDepthInches = parseFractionToNumber(body?.plantingDepthInches);

  const plant = await prisma.plant.create({
    data: {
      name,
      spacingInches,
      daysToMaturityMin,
      daysToMaturityMax,
      startIndoorsWeeksBeforeFrost,
      transplantWeeksAfterFrost,
      directSowWeeksRelativeToFrost,
      plantingDepthInches,
    },
  });

  return NextResponse.json(plant, { status: 201 });
}
