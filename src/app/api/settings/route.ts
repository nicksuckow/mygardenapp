import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

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

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();

    const lastSpringFrost = parseDateOrThrow(body.lastSpringFrost, "lastSpringFrost");
    const firstFallFrost = parseDateOrThrow(body.firstFallFrost, "firstFallFrost");
    const zone = body.zone ? String(body.zone) : null;
    const zip = body.zip ? String(body.zip) : null;
    const actualLastSpringFrost = parseOptionalDate(body.actualLastSpringFrost);
    const actualFirstFallFrost = parseOptionalDate(body.actualFirstFallFrost);

    const saved = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, lastSpringFrost, firstFallFrost, zone, zip, actualLastSpringFrost, actualFirstFallFrost },
      update: { lastSpringFrost, firstFallFrost, zone, zip, actualLastSpringFrost, actualFirstFallFrost },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("POST /api/settings error:", error);
    // Check if it's a validation error from parseDateOrThrow
    if (error instanceof Error && error.message.includes("is required")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("not a valid date")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
