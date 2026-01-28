import { NextResponse } from "next/server";
import { searchVerdantlyPlants } from "@/lib/verdantly";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Metadata can have various field names depending on API version
interface ApiMetadata {
  totalCount?: number;
  total_count?: number;
  total?: number;
  pages?: number;
  totalPages?: number;
  total_pages?: number;
  page?: number;
  currentPage?: number;
  current_page?: number;
  perPage?: number;
  per_page?: number;
  pageSize?: number;
  page_size?: number;
}

/**
 * GET /api/verdantly/search
 * Search for plants in Verdantly database
 * Query params: q (search term), page (page number)
 */
export async function GET(req: Request) {
  // Rate limit check for external API
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "verdantly-search", RATE_LIMITS.externalApi);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q") || "";
    const query = rawQuery.trim(); // Remove leading/trailing whitespace
    const page = parseInt(searchParams.get("page") || "1");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const response = await searchVerdantlyPlants(query, page);

    // Handle different possible response structures
    if (Array.isArray(response)) {
      // If response is just an array of plants
      return NextResponse.json({
        results: response,
        total: response.length,
        page: 1,
        pages: 1,
      });
    }

    // If response has a data property
    if (response.data && Array.isArray(response.data)) {
      // Verdantly API uses 'meta' not 'metadata'
      const metadata = (response.meta || response.metadata) as ApiMetadata | undefined;

      // Use the exact field names from Verdantly API
      const totalCount = metadata?.totalCount || metadata?.total_count || metadata?.total || response.data.length;
      const totalPages = metadata?.pages || metadata?.totalPages || metadata?.total_pages || 1;
      const currentPage = metadata?.page || metadata?.currentPage || metadata?.current_page || page;
      const perPage = metadata?.perPage || metadata?.per_page || metadata?.pageSize || metadata?.page_size || response.data.length;

      return NextResponse.json({
        results: response.data,
        total: totalCount,
        page: currentPage,
        pages: totalPages,
        perPage: perPage,
      });
    }

    // Fallback for any other structure
    return NextResponse.json({
      results: [],
      total: 0,
      page: 1,
      pages: 1,
    });
  } catch (error) {
    console.error("Error searching Verdantly:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to search plants";

    // Check if it's an API key error
    if (errorMessage.includes("RapidAPI key not configured")) {
      return NextResponse.json(
        {
          error: "API key not configured. Please add RAPIDAPI_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
