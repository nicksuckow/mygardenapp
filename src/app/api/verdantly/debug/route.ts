import { NextResponse } from "next/server";
import { searchVerdantlyPlants } from "@/lib/verdantly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/verdantly/debug?q=tomato
 * Debug endpoint to test Verdantly API directly
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "tomato";

    console.log(`[Debug] Testing Verdantly search for: "${query}"`);

    const results = await searchVerdantlyPlants(query);

    return NextResponse.json({
      query,
      resultCount: results.data?.length || 0,
      meta: results.meta,
      // Show first 3 results with key fields
      sampleResults: results.data?.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        subtype: p.subtype,
        category: p.category,
        waterRequirement: p.growingRequirements?.waterRequirement,
        waterRequirements: p.growingRequirements?.waterRequirements,
        topLevelWaterRequirements: p.waterRequirements,
      })),
      // Raw first result for full inspection
      rawFirstResult: results.data?.[0] || null,
    });
  } catch (error) {
    console.error("[Debug] Verdantly test error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
