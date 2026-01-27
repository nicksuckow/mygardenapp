import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();

    const x = Number(body.x);
    const y = Number(body.y);
    const side = String(body.side || "bottom");
    const width = Number(body.width ?? 1);
    const name = body.name ? String(body.name).trim() : null;

    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    if (!["top", "right", "bottom", "left"].includes(side)) {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }
    if (!Number.isInteger(width) || width < 1) {
      return NextResponse.json({ error: "Invalid width" }, { status: 400 });
    }

    const gate = await prisma.gate.create({
      data: {
        userId,
        x,
        y,
        side,
        width,
        name,
      },
    });

    return NextResponse.json(gate);
  } catch (error) {
    console.error("Error creating gate:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create gate" }, { status: 500 });
  }
}
