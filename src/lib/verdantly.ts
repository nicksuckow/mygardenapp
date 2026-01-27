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

  // Trim whitespace from query
  const trimmedQuery = query.trim();

  // Search by name first
  const nameParams = new URLSearchParams({
    q: trimmedQuery,
    page: page.toString(),
  });
  const nameUrl = `${VERDANTLY_API_BASE}/v1/plants/varieties/name?${nameParams.toString()}`;

  // Also filter by subtype to catch varieties
  const filterParams = new URLSearchParams({
    subtype: trimmedQuery,
    page: page.toString(),
  });
  const filterUrl = `${VERDANTLY_API_BASE}/v1/plants/varieties/filter?${filterParams.toString()}`;

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
  let nameData: VerdantlySearchResponse = { data: [], meta: undefined };
  let filterData: VerdantlySearchResponse = { data: [], meta: undefined };

  if (nameResponse.ok) {
    nameData = await nameResponse.json();
  }

  if (filterResponse.ok) {
    filterData = await filterResponse.json();
  }

  // Merge results and deduplicate by id
  const allPlants: VerdantlyPlant[] = [...(nameData.data || []), ...(filterData.data || [])];
  const uniquePlants = Array.from(
    new Map(allPlants.map((plant) => [plant.id, plant])).values()
  );

  // Calculate combined metadata
  const nameTotal = nameData.meta?.totalCount || 0;
  const filterTotal = filterData.meta?.totalCount || 0;
  const combinedTotal = nameTotal + filterTotal;

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

export interface VerdantlyZoneResponse {
  zipCode: string;
  zone: string;
  temperatureRange: {
    min: number;
    max: number;
  };
}

/**
 * Lookup USDA Hardiness Zone by ZIP code using Verdantly API
 * @param zipCode - 5-digit US ZIP code
 */
export async function lookupHardinessZone(zipCode: string): Promise<VerdantlyZoneResponse> {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("RapidAPI key not configured for Verdantly. Add RAPIDAPI_KEY to your .env file");
  }

  const url = `${VERDANTLY_API_BASE}/v1/hardiness-zones/zipcode/${zipCode}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Verdantly zone lookup failed:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Failed to lookup zone: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return data;
}

/**
 * Parse planting instruction text like "6-8 weeks before last frost" into weeks
 * Returns negative for "before", positive for "after"
 */
function parseWeeksFromFrost(text: string | undefined, type: "before" | "after" | "relative"): number | null {
  if (!text) return null;

  const lower = text.toLowerCase();

  // Try to match "X weeks" or "X-Y weeks" pattern
  const weeksMatch = lower.match(/(\d+)(?:\s*-\s*\d+)?\s*weeks?/);

  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);

    if (type === "before") {
      // startIndoors is weeks BEFORE frost, stored as positive
      return weeks;
    } else if (type === "after") {
      // transplant is weeks AFTER frost, stored as positive
      return weeks;
    } else {
      // directSow: negative if before frost, positive if after
      if (lower.includes("before")) return -weeks;
      if (lower.includes("after")) return weeks;
      return weeks; // default to positive if unclear
    }
  }

  // No explicit weeks found - check for frost-relative phrases
  if (type === "after") {
    // For transplant: "after last frost", "once frost has passed", "when frost danger has passed"
    if (
      lower.includes("after last frost") ||
      lower.includes("after frost") ||
      lower.includes("once frost has passed") ||
      lower.includes("when frost danger") ||
      lower.includes("frost free") ||
      lower.includes("frost-free") ||
      lower.includes("no danger of frost")
    ) {
      // Default to 1 week after frost for safety
      return 1;
    }
  }

  if (type === "relative") {
    // For direct sow
    if (lower.includes("after") && (lower.includes("frost") || lower.includes("warm"))) {
      return 1; // 1 week after frost
    }
    if (lower.includes("before") && lower.includes("frost")) {
      return -2; // 2 weeks before frost (conservative)
    }
  }

  return null;
}

/**
 * Parse days to maturity from various text formats
 * e.g., "65-80 days", "70 days to harvest", "matures in 60-75 days"
 */
function parseDaysToMaturity(text: string | undefined): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null };

  const lower = text.toLowerCase();

  // Match patterns like "65-80 days", "60 to 75 days", "70 days"
  const rangeMatch = lower.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*days?/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
    };
  }

  // Single number: "70 days"
  const singleMatch = lower.match(/(\d+)\s*days?/);
  if (singleMatch) {
    const days = parseInt(singleMatch[1], 10);
    return { min: days, max: days + 14 }; // Add 2 weeks for harvest window
  }

  return { min: null, max: null };
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

  // Parse planting instructions into week fields
  const plantingInstr = ci?.plantingInstructions;
  const startIndoorsWeeksBeforeFrost = parseWeeksFromFrost(plantingInstr?.startIndoors, "before");
  let transplantWeeksAfterFrost = parseWeeksFromFrost(plantingInstr?.transplantOutdoors, "after");
  const directSowWeeksRelativeToFrost = parseWeeksFromFrost(plantingInstr?.directSow, "relative");

  // If we have startIndoors but no explicit transplant timing, assume transplant happens
  // around 1-2 weeks after last frost (common for seedlings started indoors)
  if (startIndoorsWeeksBeforeFrost !== null && transplantWeeksAfterFrost === null) {
    transplantWeeksAfterFrost = 1; // Default: transplant 1 week after last frost
  }

  // Try to parse days to maturity from harvesting instructions or description
  let daysToMaturity = parseDaysToMaturity(ci?.harvestingInstructions);

  // If not found, try the description or notes
  if (daysToMaturity.min === null) {
    daysToMaturity = parseDaysToMaturity(verdantly.description);
  }
  if (daysToMaturity.min === null) {
    daysToMaturity = parseDaysToMaturity(notes || "");
  }

  return {
    name: verdantly.name,
    variety: verdantly.subtype || null,
    spacingInches: spacingInches || 12,
    plantingDepthInches: null, // Not provided by Verdantly API
    daysToMaturityMin: daysToMaturity.min,
    daysToMaturityMax: daysToMaturity.max,
    startIndoorsWeeksBeforeFrost,
    transplantWeeksAfterFrost,
    directSowWeeksRelativeToFrost,
    // Full text planting instructions
    startIndoorsInstructions: plantingInstr?.startIndoors || null,
    transplantInstructions: plantingInstr?.transplantOutdoors || null,
    directSowInstructions: plantingInstr?.directSow || null,
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
