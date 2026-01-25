// Verdantly API integration
// Documentation: https://rapidapi.com/verdantly-team-verdantly-team-default/api/verdantly-gardening-api

const VERDANTLY_API_BASE = "https://verdantly-gardening-api.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "verdantly-gardening-api.p.rapidapi.com";

export interface VerdantlyPlant {
  id: string;
  mappingId: string;
  name: string;
  category: string; // "vegetable", "herb", "fruit"
  type: string; // "tomato", "lettuce", etc.
  subtype?: string;
  description?: string;

  // Growing requirements
  growingRequirements: {
    minGrowingZone?: number;
    maxGrowingZone?: number;
    growingZoneRange?: string; // e.g., "4-10"
    sunlightRequirement?: string; // "Full sun", etc.
    waterRequirement?: string; // "Moderate", etc.
    soilPreference?: string;
    preferredTemperature?: string; // "70-85°F"
    spacingRequirement?: string; // "18-24 inches apart"
    careInstructions?: string;
  };

  // Growth details
  growthDetails: {
    growthPeriod?: string; // "Annual", "Perennial"
    growthType?: string; // "Vine", "Bush"
    matureHeight?: number; // inches
    matureWidth?: number; // inches
  };

  // Lifecycle milestones
  lifecycleMilestones?: {
    avgFirstBloomDate?: string;
    firstHarvestDate?: string;
    lastHarvestDate?: string;
  };

  // Care instructions
  careInstructions?: {
    plantingInstructions?: {
      startIndoors?: string;
      transplantOutdoors?: string;
      directSow?: string;
    };
    pruningInstructions?: string;
    harvestingInstructions?: string;
  };

  // Additional info
  commonUses?: string;
  pestAndDiseaseRisks?: string;
  highlights?: string;
  history?: string;
}

export interface VerdantlySearchResponse {
  data: VerdantlyPlant[];
  meta?: {
    totalCount: number;
    pages: number;
    page: number;
    perPage: number;
  };
  metadata?: {
    totalCount: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

/**
 * Search for plants in Verdantly database
 * Searches both by name and by subtype/variety to get comprehensive results
 * @param query - Search term (common name or variety like "beefsteak")
 * @param page - Page number for pagination (default 1)
 */
export async function searchVerdantlyPlants(
  query: string,
  page: number = 1
): Promise<VerdantlySearchResponse> {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("RapidAPI key not configured for Verdantly. Add RAPIDAPI_KEY to your .env file");
  }

  // Search by name first
  const nameParams = new URLSearchParams({
    q: query,
    page: page.toString(),
  });
  const nameUrl = `${VERDANTLY_API_BASE}/v1/plants/varieties/name?${nameParams.toString()}`;

  // Also filter by subtype to catch varieties
  const filterParams = new URLSearchParams({
    subtype: query,
    page: page.toString(),
  });
  const filterUrl = `${VERDANTLY_API_BASE}/v1/plants/varieties/filter?${filterParams.toString()}`;

  console.log("Verdantly API requests:", {
    nameUrl,
    filterUrl,
    page,
    query,
  });

  // Make both requests in parallel
  const [nameResponse, filterResponse] = await Promise.all([
    fetch(nameUrl, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
        "Accept": "application/json",
      },
    }),
    fetch(filterUrl, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
        "Accept": "application/json",
      },
    }),
  ]);

  // Process both responses
  let nameData = { data: [], meta: null };
  let filterData = { data: [], meta: null };

  if (nameResponse.ok) {
    nameData = await nameResponse.json();
  }

  if (filterResponse.ok) {
    filterData = await filterResponse.json();
  }

  // Merge results and deduplicate by id
  const allPlants = [...(nameData.data || []), ...(filterData.data || [])];
  const uniquePlants = Array.from(
    new Map(allPlants.map((plant) => [plant.id, plant])).values()
  );

  // Calculate combined metadata
  const nameTotal = nameData.meta?.totalCount || 0;
  const filterTotal = filterData.meta?.totalCount || 0;
  const combinedTotal = nameTotal + filterTotal;

  console.log("=== Verdantly API Response ===");
  console.log("Name search results:", nameData.data?.length || 0);
  console.log("Subtype filter results:", filterData.data?.length || 0);
  console.log("Unique combined results:", uniquePlants.length);
  console.log("Combined total count:", combinedTotal);
  console.log("==============================");

  return {
    data: uniquePlants,
    meta: {
      totalCount: combinedTotal,
      pages: Math.ceil(combinedTotal / 10), // Assuming 10 per page
      page: page,
      perPage: 10,
    },
  };
}

/**
 * Convert Verdantly plant data to our Plant model format
 */
export function convertVerdantlyToPlant(verdantly: VerdantlyPlant) {
  const gr = verdantly.growingRequirements;
  const gd = verdantly.growthDetails;
  const lm = verdantly.lifecycleMilestones;
  const ci = verdantly.careInstructions;

  // Parse spacing (e.g., "18-24 inches apart" -> 18)
  let spacingInches: number | null = null;
  if (gr.spacingRequirement) {
    const match = gr.spacingRequirement.match(/(\d+)/);
    if (match) spacingInches = parseFloat(match[1]);
  }

  // Parse temperature range to get min/max in Celsius
  let minTemperatureC: number | null = null;
  let maxTemperatureC: number | null = null;
  if (gr.preferredTemperature) {
    const match = gr.preferredTemperature.match(/(\d+)-(\d+)°F/);
    if (match) {
      minTemperatureC = Math.round(((parseFloat(match[1]) - 32) * 5) / 9);
      maxTemperatureC = Math.round(((parseFloat(match[2]) - 32) * 5) / 9);
    }
  }

  // Convert mature height from inches to cm
  let averageHeightCm: number | null = null;
  if (gd.matureHeight) {
    averageHeightCm = Math.round(gd.matureHeight * 2.54);
  }

  // Map water requirements to 0-10 scale
  let soilHumidity: number | null = null;
  if (gr.waterRequirement) {
    const lower = gr.waterRequirement.toLowerCase();
    if (lower.includes("high") || lower.includes("wet")) soilHumidity = 9;
    else if (lower.includes("moderate") || lower.includes("medium")) soilHumidity = 5;
    else if (lower.includes("low") || lower.includes("dry")) soilHumidity = 2;
  }

  // Map sunlight to 0-10 scale
  let lightRequirement: number | null = null;
  if (gr.sunlightRequirement) {
    const lower = gr.sunlightRequirement.toLowerCase();
    if (lower.includes("full sun")) lightRequirement = 10;
    else if (lower.includes("partial shade") || lower.includes("part shade")) lightRequirement = 6;
    else if (lower.includes("full shade") || lower.includes("shade")) lightRequirement = 3;
  }

  // Build notes with useful information
  const noteParts: string[] = [];
  if (verdantly.description) noteParts.push(verdantly.description);
  if (verdantly.highlights) noteParts.push(`Highlights: ${verdantly.highlights}`);
  if (verdantly.history) noteParts.push(`History: ${verdantly.history}`);
  if (verdantly.commonUses) noteParts.push(`Common uses: ${verdantly.commonUses}`);
  if (gr.careInstructions) noteParts.push(`Care: ${gr.careInstructions}`);

  // Planting instructions
  if (ci?.plantingInstructions) {
    const plantingParts: string[] = [];
    if (ci.plantingInstructions.startIndoors) {
      plantingParts.push(`Start indoors: ${ci.plantingInstructions.startIndoors}`);
    }
    if (ci.plantingInstructions.transplantOutdoors) {
      plantingParts.push(`Transplant: ${ci.plantingInstructions.transplantOutdoors}`);
    }
    if (ci.plantingInstructions.directSow) {
      plantingParts.push(`Direct sow: ${ci.plantingInstructions.directSow}`);
    }
    if (plantingParts.length > 0) {
      noteParts.push(`Planting:\n${plantingParts.join("\n")}`);
    }
  }

  if (ci?.pruningInstructions) noteParts.push(`Pruning: ${ci.pruningInstructions}`);
  if (ci?.harvestingInstructions) noteParts.push(`Harvesting: ${ci.harvestingInstructions}`);
  if (verdantly.pestAndDiseaseRisks) noteParts.push(`Pests/Diseases: ${verdantly.pestAndDiseaseRisks}`);

  const notes = noteParts.length > 0 ? noteParts.join("\n\n") : null;

  // Determine edible (vegetables, fruits, herbs are generally edible)
  const edible = ["vegetable", "fruit", "herb"].includes(verdantly.category.toLowerCase());

  return {
    name: verdantly.name,
    variety: verdantly.subtype || null,
    spacingInches: spacingInches || 12,
    plantingDepthInches: null, // Not provided by Verdantly API
    daysToMaturityMin: null, // Would need to calculate from planting/harvest dates
    daysToMaturityMax: null,
    notes,

    // Core fields
    scientificName: null,
    growthForm: verdantly.type || null,
    growthHabit: gd.growthType || null,
    growthRate: null,
    averageHeightCm,
    minTemperatureC,
    maxTemperatureC,
    lightRequirement,
    soilNutriments: null,
    soilHumidity,
    edible,
    ediblePart: null,

    // Additional fields
    cycle: gd.growthPeriod || null,
    watering: gr.waterRequirement || null,
    sunlight: gr.sunlightRequirement || null,
    floweringSeason: null,
    harvestSeason: lm?.firstHarvestDate || null,
    careLevel: null,
    maintenance: null,
    indoor: false,
    droughtTolerant: gr.waterRequirement?.toLowerCase().includes("low") || false,
    medicinal: false,
    poisonousToHumans: null,
    poisonousToPets: null,
    description: verdantly.description || null,
  };
}
