import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid plant id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  // Whitelist allowed fields
  const data: any = {};

  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.spacingInches === "number") data.spacingInches = body.spacingInches;

  if (typeof body.daysToMaturityMin === "number" || body.daysToMaturityMin === null)
    data.daysToMaturityMin = body.daysToMaturityMin;
  if (typeof body.daysToMaturityMax === "number" || body.daysToMaturityMax === null)
    data.daysToMaturityMax = body.daysToMaturityMax;

  if (typeof body.startIndoorsWeeksBeforeFrost === "number" || body.startIndoorsWeeksBeforeFrost === null)
    data.startIndoorsWeeksBeforeFrost = body.startIndoorsWeeksBeforeFrost;
  if (typeof body.transplantWeeksAfterFrost === "number" || body.transplantWeeksAfterFrost === null)
    data.transplantWeeksAfterFrost = body.transplantWeeksAfterFrost;
  if (typeof body.directSowWeeksRelativeToFrost === "number" || body.directSowWeeksRelativeToFrost === null)
    data.directSowWeeksRelativeToFrost = body.directSowWeeksRelativeToFrost;

  if ("name" in data && data.name === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await prisma.plant.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: Ctx) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid plant id" }, { status: 400 });
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
}
