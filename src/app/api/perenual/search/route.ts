import { NextResponse } from "next/server";
import { searchPerenualPlants } from "@/lib/perenual";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    // Require authentication
    await getCurrentUserId();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const edibleOnly = searchParams.get("edible") === "true";
    const indoorOnly = searchParams.get("indoor") === "true";

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const filter: { edible?: boolean; indoor?: boolean } = {};
    if (edibleOnly) filter.edible = true;
    if (indoorOnly) filter.indoor = true;

    const results = await searchPerenualPlants(query, page, filter);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Perenual search error:", error);

    if (error instanceof Error && error.message.includes("API key not configured")) {
      return NextResponse.json(
        { error: "Perenual API is not configured. Please add PERENUAL_API_KEY to your environment variables." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to search plants" },
      { status: 500 }
    );
  }
}
