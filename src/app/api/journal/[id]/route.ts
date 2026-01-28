import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid entry id" }, { status: 400 });
    }

    const entry = await prisma.gardenJournal.findUnique({
      where: { id, userId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid entry id" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.gardenJournal.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    const updateData: Record<string, unknown> = {};

    if (typeof body.content === "string") {
      updateData.content = body.content.trim();
    }
    if (body.title !== undefined) {
      updateData.title = body.title || null;
    }
    if (body.entryDate !== undefined) {
      updateData.entryDate = body.entryDate ? new Date(body.entryDate) : new Date();
    }
    if (body.weatherNote !== undefined) {
      updateData.weatherNote = body.weatherNote || null;
    }
    if (body.temperature !== undefined) {
      updateData.temperature = typeof body.temperature === "number" ? body.temperature : null;
    }
    if (body.photos !== undefined) {
      updateData.photos = body.photos ? JSON.stringify(body.photos) : null;
    }
    if (body.tags !== undefined) {
      updateData.tags = body.tags || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.gardenJournal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating journal entry:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const userId = await getCurrentUserId();
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid entry id" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.gardenJournal.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.gardenJournal.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
