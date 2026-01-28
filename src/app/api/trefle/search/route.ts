import { NextResponse } from "next/server";
import { searchTreflePlants } from "@/lib/trefle";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(req: Request) {
  // Rate limit check for external API
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "trefle-search", RATE_LIMITS.externalApi);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  try {
    // Require authentication
    await getCurrentUserId();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const edibleOnly = searchParams.get("edible") === "true";
    const vegetableOnly = searchParams.get("vegetable") === "true";

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

    const filter: { edible?: boolean; vegetable?: boolean } = {};
    if (edibleOnly) filter.edible = true;
    if (vegetableOnly) filter.vegetable = true;

    const results = await searchTreflePlants(query, page, filter);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Trefle search error:", error);

    if (error instanceof Error && error.message.includes("API key not configured")) {
      return NextResponse.json(
        { error: "Trefle API is not configured. Please add TREFLE_API_KEY to your environment variables." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to search plants" },
      { status: 500 }
    );
  }
}
