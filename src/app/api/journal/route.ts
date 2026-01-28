import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();

    const url = new URL(req.url);
    const bedId = url.searchParams.get("bedId");
    const tag = url.searchParams.get("tag");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const entries = await prisma.gardenJournal.findMany({
      where: {
        userId,
        ...(bedId ? { bedId: parseInt(bedId, 10) } : {}),
        ...(tag ? { tags: { contains: tag } } : {}),
      },
      orderBy: { entryDate: "desc" },
      take: Math.min(limit, 100),
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json().catch(() => ({}));

    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Journal content is required." }, { status: 400 });
    }

    const entry = await prisma.gardenJournal.create({
      data: {
        userId,
        content,
        title: body.title || null,
        entryDate: body.entryDate ? new Date(body.entryDate) : new Date(),
        weatherNote: body.weatherNote || null,
        temperature: typeof body.temperature === "number" ? body.temperature : null,
        bedId: typeof body.bedId === "number" ? body.bedId : null,
        placementId: typeof body.placementId === "number" ? body.placementId : null,
        photos: body.photos ? JSON.stringify(body.photos) : null,
        tags: body.tags || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
