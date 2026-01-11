import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const gardenRotated =
    typeof body.gardenRotated === "boolean" ? body.gardenRotated : null;

  if (gardenRotated == null) {
    return NextResponse.json(
      { error: "gardenRotated boolean is required." },
      { status: 400 }
    );
  }

  const updated = await prisma.bed.update({
    where: { id },
    data: { gardenRotated },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: Ctx) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
  }

  // Safety: prevent deleting beds that still have plants placed
  const placementsCount = await prisma.bedPlacement.count({
    where: { bedId: id },
  });

  if (placementsCount > 0) {
    return NextResponse.json(
      { error: "This bed still has plants placed. Clear the bed before deleting it." },
      { status: 400 }
    );
  }

  await prisma.bed.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
