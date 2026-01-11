import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bedId = Number(id);

  if (!Number.isInteger(bedId) || bedId <= 0) {
    return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
  }

  const body = await req.json();
  const placementId = Number(body.placementId);

  if (!Number.isInteger(placementId)) {
    return NextResponse.json({ error: "placementId is required" }, { status: 400 });
  }

  await prisma.bedPlacement.delete({
    where: { id: placementId },
  });

  return NextResponse.json({ ok: true });
}
