// src/app/api/plants/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Supports: "1", "0.5", "1/2", "1 1/2"
function parseFractionInches(v: unknown): number | null {
  if (v == null) return null;

  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null;
  }

  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;

  // number
  const asNum = Number(s);
  if (Number.isFinite(asNum)) return asNum;

  // "a/b"
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    return null;
  }

  // "x a/b"
  const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const a = Number(mixed[2]);
    const b = Number(mixed[3]);
    if (
      Number.isFinite(whole) &&
      Number.isFinite(a) &&
      Number.isFinite(b) &&
      b !== 0
    ) {
      return whole + a / b;
    }
    return null;
  }

  return null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid plant id" }, { status: 400 });
    }

    // Verify ownership
    const plant = await prisma.plant.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!plant || plant.userId !== userId) {
      return NextResponse.json(
        { error: "Plant not found or access denied" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Whitelist allowed fields
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.variety === "string" || body.variety === null) data.variety = body.variety;
    if (typeof body.spacingInches === "number") data.spacingInches = body.spacingInches;

    if (typeof body.daysToMaturityMin === "number" || body.daysToMaturityMin === null)
      data.daysToMaturityMin = body.daysToMaturityMin;
    if (typeof body.daysToMaturityMax === "number" || body.daysToMaturityMax === null)
      data.daysToMaturityMax = body.daysToMaturityMax;

    if (
      typeof body.startIndoorsWeeksBeforeFrost === "number" ||
      body.startIndoorsWeeksBeforeFrost === null
    )
      data.startIndoorsWeeksBeforeFrost = body.startIndoorsWeeksBeforeFrost;

    if (typeof body.transplantWeeksAfterFrost === "number" || body.transplantWeeksAfterFrost === null)
      data.transplantWeeksAfterFrost = body.transplantWeeksAfterFrost;

    if (
      typeof body.directSowWeeksRelativeToFrost === "number" ||
      body.directSowWeeksRelativeToFrost === null
    )
      data.directSowWeeksRelativeToFrost = body.directSowWeeksRelativeToFrost;

    if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;

    // ✅ NEW: planting depth (supports number OR fraction strings)
    if ("plantingDepthInches" in body) {
      const parsed = parseFractionInches(body.plantingDepthInches);
      data.plantingDepthInches = parsed;
    }

    // Seed tracking
    if (typeof body.hasSeeds === "boolean") data.hasSeeds = body.hasSeeds;

    if ("name" in data && data.name === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updated = await prisma.plant.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating plant:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update plant" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid plant id" }, { status: 400 });
    }

    // Verify ownership
    const plant = await prisma.plant.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!plant || plant.userId !== userId) {
      return NextResponse.json(
        { error: "Plant not found or access denied" },
        { status: 404 }
      );
    }

    // Safety: prevent deleting a plant that is placed in any bed.
    const usedCount = await prisma.bedPlacement.count({
      where: { plantId: id },
    });

    if (usedCount > 0) {
      return NextResponse.json(
        { error: "This plant is placed in a bed. Clear it from beds before deleting." },
        { status: 400 }
      );
    }

    await prisma.plant.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting plant:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete plant" }, { status: 500 });
  }
}
