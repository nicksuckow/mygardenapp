import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDateOrThrow(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value) {
    throw new Error(`${fieldName} is required`);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`${fieldName} is not a valid date: "${value}"`);
  }
  return d;
}

export async function GET() {
  try {
    const settings = await prisma.userSettings.findFirst();
    return NextResponse.json(settings);
  } catch (err: any) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      { error: "GET /api/settings failed", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const lastSpringFrost = parseDateOrThrow(body.lastSpringFrost, "lastSpringFrost");
    const firstFallFrost = parseDateOrThrow(body.firstFallFrost, "firstFallFrost");
    const zone = body.zone ? String(body.zone) : null;

    const existing = await prisma.userSettings.findFirst();

    const saved = existing
      ? await prisma.userSettings.update({
          where: { id: existing.id },
          data: { lastSpringFrost, firstFallFrost, zone },
        })
      : await prisma.userSettings.create({
          data: { lastSpringFrost, firstFallFrost, zone },
        });

    return NextResponse.json(saved);
  } catch (err: any) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json(
      { error: "POST /api/settings failed", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
