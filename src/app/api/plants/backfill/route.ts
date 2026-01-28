// src/app/api/plants/backfill/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { searchVerdantlyPlants, getVerdantlyPlantById, convertVerdantlyToPlant, type VerdantlyPlant } from "@/lib/verdantly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fields we want to backfill if missing
const BACKFILL_FIELDS = [
  "daysToMaturityMin",
  "daysToMaturityMax",
  "scientificName",
  "cycle",
  "watering",
  "waterZone", // "low", "medium", "high" for UI badges
  "sunlight",
  "sunlightZone", // "full", "partial", "shade" for micro climate matching
  "averageHeightInches",
  "growthRate",
  "careLevel",
  "maintenance",
  "floweringSeason",
  "harvestSeason",
  "edible",
  "ediblePart",
  "droughtTolerant",
  "indoor",
  "medicinal",
  "poisonousToHumans",
  "poisonousToPets",
  "description",
  "minTemperatureC",
  "maxTemperatureC",
  "lightRequirement",
  "soilHumidity",
  "growthForm",
  "growthHabit",
] as const;

type BackfillField = (typeof BACKFILL_FIELDS)[number];

/**
 * GET /api/plants/backfill
 * Returns plants that have missing data and could be backfilled
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const plants = await prisma.plant.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    // Find plants with missing data that haven't been checked yet
    // If a plant has a verdantlyId, we've already tried to get data from Verdantly
    // and any remaining missing fields mean Verdantly doesn't have that data
    const plantsNeedingBackfill = plants.filter((plant) => {
      // Skip plants that have already been looked up in Verdantly
      if (plant.verdantlyId) return false;

      // Check if any of the backfill fields are missing
      return BACKFILL_FIELDS.some((field) => {
        const value = plant[field as keyof typeof plant];
        return value === null || value === undefined;
      });
    });

    // Count missing fields per plant
    const plantStats = plantsNeedingBackfill.map((plant) => {
      const missingFields = BACKFILL_FIELDS.filter((field) => {
        const value = plant[field as keyof typeof plant];
        return value === null || value === undefined;
      });

      return {
        id: plant.id,
        name: plant.name,
        variety: plant.variety,
        missingFieldCount: missingFields.length,
        missingFields,
        hasWatering: plant.watering !== null,
        hasSunlight: plant.sunlight !== null,
        hasHeight: plant.averageHeightInches !== null,
        hasCycle: plant.cycle !== null,
      };
    });

    return NextResponse.json({
      total: plants.length,
      needsBackfill: plantsNeedingBackfill.length,
      plants: plantStats,
    });
  } catch (error) {
    console.error("Error checking backfill status:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to check backfill status" }, { status: 500 });
  }
}

/**
 * POST /api/plants/backfill
 * Backfill missing data for plants using Verdantly API
 * Body: { plantIds?: number[], all?: boolean }
 */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json().catch(() => ({}));
    const { plantIds, all } = body;

    // Get plants to backfill
    let plants;
    if (all) {
      plants = await prisma.plant.findMany({
        where: { userId },
      });
    } else if (Array.isArray(plantIds) && plantIds.length > 0) {
      plants = await prisma.plant.findMany({
        where: {
          userId,
          id: { in: plantIds },
        },
      });
    } else {
      return NextResponse.json(
        { error: "Provide plantIds array or all: true" },
        { status: 400 }
      );
    }

    const results: Array<{
      id: number;
      name: string;
      status: "updated" | "not_found" | "skipped" | "error";
      fieldsUpdated?: string[];
      error?: string;
      debug?: string; // Debug info for troubleshooting
    }> = [];

    // Track plants that don't need to be shown in results
    let alreadyComplete = 0;  // All backfill fields already have values
    let noNewData = 0;        // Found in Verdantly but no new data available

    // Process each plant
    for (const plant of plants) {
      // Check which fields are missing
      const missingFields = BACKFILL_FIELDS.filter((field) => {
        const value = plant[field as keyof typeof plant];
        return value === null || value === undefined;
      });

      // Debug: Show what fields we're looking to fill and current values for key fields
      console.log(`[Backfill] Plant "${plant.name}" - Missing ${missingFields.length} fields. Current values: watering="${plant.watering}", cycle="${plant.cycle}", sunlight="${plant.sunlight}"`);

      // Skip if no fields need backfill (don't add to results - just count)
      if (missingFields.length === 0) {
        alreadyComplete++;
        continue;
      }

      try {
        let bestMatch: VerdantlyPlant | null = null;

        // First, try direct lookup by Verdantly ID if we have one
        if (plant.verdantlyId) {
          console.log(`[Backfill] Looking up plant by ID: ${plant.verdantlyId}`);
          bestMatch = await getVerdantlyPlantById(plant.verdantlyId);
          if (bestMatch) {
            console.log(`[Backfill] Found by ID: ${bestMatch.name}`);
          }
        }

        // If no ID or ID lookup failed, fall back to search with fuzzy matching
        if (!bestMatch) {
          console.log(`[Backfill] Searching for plant: "${plant.name}" (variety: "${plant.variety || 'none'}")`);

          // Try searching by name first
          let searchResults = await searchVerdantlyPlants(plant.name);
          console.log(`[Backfill] Search by name "${plant.name}" returned ${searchResults.data?.length || 0} results`);

          // If no results and we have a variety, try searching by variety
          if ((!searchResults.data || searchResults.data.length === 0) && plant.variety) {
            searchResults = await searchVerdantlyPlants(plant.variety);
            console.log(`[Backfill] Search by variety "${plant.variety}" returned ${searchResults.data?.length || 0} results`);
          }

          // Also try combined name + variety search
          if ((!searchResults.data || searchResults.data.length === 0) && plant.variety) {
            const combined = `${plant.name} ${plant.variety}`;
            searchResults = await searchVerdantlyPlants(combined);
            console.log(`[Backfill] Search by combined "${combined}" returned ${searchResults.data?.length || 0} results`);
          }

          // Try just the first word of the name (e.g., "Tomato" from "Tomato - Beefsteak")
          if (!searchResults.data || searchResults.data.length === 0) {
            const firstWord = plant.name.split(/[\s\-,]+/)[0];
            if (firstWord && firstWord.length >= 3 && firstWord.toLowerCase() !== plant.name.toLowerCase()) {
              searchResults = await searchVerdantlyPlants(firstWord);
              console.log(`[Backfill] Search by first word "${firstWord}" returned ${searchResults.data?.length || 0} results`);
            }
          }

          if (!searchResults.data || searchResults.data.length === 0) {
            console.log(`[Backfill] No results found for "${plant.name}"`);
            results.push({
              id: plant.id,
              name: plant.name,
              status: "not_found",
              debug: `Searched: name="${plant.name}", variety="${plant.variety || 'none'}" - API returned 0 results`,
            });
            continue;
          }

          // Improved fuzzy matching - score each result
          const plantNameLower = plant.name.toLowerCase();
          const plantVarietyLower = plant.variety?.toLowerCase() || "";
          // Also extract first word as potential type (e.g., "Tomato" from "Tomato - Beefsteak")
          const plantTypeLower = plant.name.split(/[\s\-,]+/)[0]?.toLowerCase() || "";

          bestMatch = searchResults.data[0];
          let bestScore = 0;

          console.log(`[Backfill] Scoring ${searchResults.data.length} results for "${plant.name}"`);

          for (const result of searchResults.data) {
            let score = 0;
            const resultNameLower = result.name.toLowerCase();
            const resultSubtypeLower = result.subtype?.toLowerCase() || "";
            const resultTypeLower = result.type?.toLowerCase() || "";

            // Exact name match is best
            if (resultNameLower === plantNameLower) {
              score += 100;
            }
            // Partial name match
            else if (resultNameLower.includes(plantNameLower) || plantNameLower.includes(resultNameLower)) {
              score += 50;
            }

            // Type match (e.g., result.type = "tomato" matches plant name "Tomato")
            if (resultTypeLower && plantTypeLower) {
              if (resultTypeLower === plantTypeLower) {
                score += 60; // Type matches our plant type
              } else if (plantNameLower.includes(resultTypeLower) || resultTypeLower.includes(plantTypeLower)) {
                score += 30; // Partial type match
              }
            }

            // Variety/subtype matches
            if (plantVarietyLower && resultSubtypeLower) {
              if (resultSubtypeLower === plantVarietyLower) {
                score += 80; // Exact variety match
              } else if (resultSubtypeLower.includes(plantVarietyLower) || plantVarietyLower.includes(resultSubtypeLower)) {
                score += 40; // Partial variety match
              }
            }

            // Check if our variety matches their subtype even without explicit variety
            if (!plantVarietyLower && resultSubtypeLower && plantNameLower.includes(resultSubtypeLower)) {
              score += 30;
            }

            // Category match (vegetable, herb, fruit)
            if (result.category && plantNameLower.includes(result.category.toLowerCase())) {
              score += 10;
            }

            if (score > bestScore) {
              bestScore = score;
              bestMatch = result;
              console.log(`[Backfill] New best match: "${result.name}" (type: ${result.type}, subtype: ${result.subtype}) score: ${score}`);
            }
          }

          console.log(`[Backfill] Best match for "${plant.name}": "${bestMatch?.name}" with score ${bestScore}`);

          // If score is too low, still use the first result but log warning
          // Verdantly results are usually relevant, so we'll accept any result
          if (bestScore === 0 && searchResults.data.length > 0) {
            // Use first result if no scoring match (API returned something relevant)
            bestMatch = searchResults.data[0];
            console.log(`[Backfill] Using first result as fallback: "${bestMatch.name}"`);
          }
        }

        // Convert Verdantly data to our format
        const verdantlyData = convertVerdantlyToPlant(bestMatch!);

        // Debug: Log what Verdantly returned for key fields
        console.log(`[Backfill] Verdantly data for "${bestMatch!.name}":`, {
          watering: verdantlyData.watering,
          waterZone: verdantlyData.waterZone,
          sunlight: verdantlyData.sunlight,
          sunlightZone: verdantlyData.sunlightZone,
          averageHeightInches: verdantlyData.averageHeightInches,
          cycle: verdantlyData.cycle,
          description: verdantlyData.description ? "present" : "null",
        });

        // Build update object with only missing fields
        const updates: Record<string, unknown> = {};
        const fieldsUpdated: string[] = [];

        // Always save the verdantlyId if we don't have one (for future lookups)
        if (!plant.verdantlyId && bestMatch!.id) {
          updates.verdantlyId = bestMatch!.id;
          fieldsUpdated.push("verdantlyId");
        }

        for (const field of missingFields) {
          const newValue = verdantlyData[field as keyof typeof verdantlyData];
          if (newValue !== null && newValue !== undefined) {
            updates[field] = newValue;
            fieldsUpdated.push(field);
          }
        }

        if (Object.keys(updates).length > 0) {
          await prisma.plant.update({
            where: { id: plant.id },
            data: updates,
          });

          results.push({
            id: plant.id,
            name: plant.name,
            status: "updated",
            fieldsUpdated,
            debug: `Matched to: "${bestMatch!.name}" (id: ${bestMatch!.id})`,
          });
        } else {
          // Plant was found in Verdantly but Verdantly doesn't have the data we need
          // Don't include in results - just count it
          console.log(`[Backfill] Found "${bestMatch!.name}" but Verdantly has no new data for missing fields`);
          noNewData++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (err) {
        results.push({
          id: plant.id,
          name: plant.name,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const notFound = results.filter((r) => r.status === "not_found").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      summary: {
        totalPlants: results.length + alreadyComplete + noNewData,
        alreadyComplete, // Plants with all fields filled
        noNewData,       // Found in Verdantly but no new data available
        updated,
        notFound,
        errors,
      },
      results, // Only includes: updated, not_found, errors
    });
  } catch (error) {
    console.error("Error backfilling plant data:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("RapidAPI key not configured")) {
      return NextResponse.json(
        { error: "Verdantly API is not configured. Please add RAPIDAPI_KEY to your environment variables." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to backfill plant data" }, { status: 500 });
  }
}
