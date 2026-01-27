import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();

    const x = Number(body.x);
    const y = Number(body.y);
    const width = Number(body.width ?? 1);
    const height = Number(body.height ?? 1);
    const name = body.name ? String(body.name).trim() : null;

    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
      return NextResponse.json({ error: "Invalid dimensions" }, { status: 400 });
    }

    const walkway = await prisma.walkway.create({
      data: {
        userId,
        x,
        y,
        width,
        height,
        name,
      },
    });

    return NextResponse.json(walkway);
  } catch (error) {
    console.error("Error creating walkway:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create walkway" }, { status: 500 });
  }
}
