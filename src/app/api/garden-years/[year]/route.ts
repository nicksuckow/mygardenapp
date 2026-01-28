import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ year: string }> };

export async function GET(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { year: yearStr } = await ctx.params;
    const year = Number(yearStr);

    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const gardenYear = await prisma.gardenYear.findUnique({
      where: { userId_year: { userId, year } },
    });

    if (!gardenYear) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 });
    }

    return NextResponse.json(gardenYear);
  } catch (error) {
    console.error("Error fetching garden year:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch archive" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { year: yearStr } = await ctx.params;
    const year = Number(yearStr);

    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const existing = await prisma.gardenYear.findUnique({
      where: { userId_year: { userId, year } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 });
    }

    await prisma.gardenYear.delete({
      where: { userId_year: { userId, year } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting garden year:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete archive" }, { status: 500 });
  }
}
