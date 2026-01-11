import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const garden = await prisma.garden.findUnique({ where: { id: 1 } });
  return NextResponse.json(garden);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const widthInches = Number(body.widthInches);
  const heightInches = Number(body.heightInches);
  const cellInches = body.cellInches == null ? 12 : Number(body.cellInches);

  if (!Number.isFinite(widthInches) || widthInches < 12) {
    return NextResponse.json({ error: "Garden width must be at least 12 inches." }, { status: 400 });
  }
  if (!Number.isFinite(heightInches) || heightInches < 12) {
    return NextResponse.json({ error: "Garden height must be at least 12 inches." }, { status: 400 });
  }
  if (!Number.isFinite(cellInches) || (cellInches !== 6 && cellInches !== 12)) {
    return NextResponse.json({ error: "cellInches must be 6 or 12." }, { status: 400 });
  }

  const garden = await prisma.garden.upsert({
    where: { id: 1 },
    create: { id: 1, widthInches, heightInches, cellInches },
    update: { widthInches, heightInches, cellInches },
  });

  return NextResponse.json(garden);
}
