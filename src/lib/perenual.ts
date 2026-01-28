// Perenual API integration
// Documentation: https://perenual.com/docs/api

const PERENUAL_API_BASE = "https://perenual.com/api";
const API_KEY = process.env.PERENUAL_API_KEY;

export interface PerenualPlant {
  id: number;
  common_name: string;
  scientific_name: string[];
  other_name?: string[];
  cycle?: string;
  watering?: string;
  sunlight?: string[];
  default_image?: {
    license?: number;
    license_name?: string;
    license_url?: string;
    original_url?: string;
    regular_url?: string;
    medium_url?: string;
    small_url?: string;
    thumbnail?: string;
  } | null;
}

export interface PerenualPlantDetails extends PerenualPlant {
  type?: string;
  dimension?: string;
  attracts?: string[];
  propagation?: string[];
  hardiness?: {
    min?: string;
    max?: string;
  };
  hardiness_location?: {
    full_url?: string;
    full_iframe?: string;
  };
  watering_general_benchmark?: {
    value?: string;
    unit?: string;
  };
  watering_period?: string;
  volume_water_requirement?: {
    value?: number;
    unit?: string;
  };
  depth_water_requirement?: {
    value?: number;
    unit?: string;
  };
  watering_benchmark_value?: {
    value?: number;
    unit?: string;
  };
  plant_anatomy?: Array<{
    part?: string;
    color?: string[];
  }>;
  sunlight?: string[];
  pruning_month?: string[];
  pruning_count?: {
    amount?: number;
    interval?: string;
  };
  seeds?: number;
  attractions?: string[];
  flowering_season?: string;
  flower_color?: string;
  harvest_season?: string;
  leaf?: {
    color?: string[];
    value?: boolean;
  };
  leaf_color?: string[];
  edible_leaf?: boolean;
  edible_fruit?: boolean;
  edible_fruit_taste_profile?: string;
  fruit_nutritional_value?: string;
  growth_rate?: string;
  maintenance?: string;
  medicinal?: boolean;
  poisonous_to_humans?: number;
  poisonous_to_pets?: number;
  drought_tolerant?: boolean;
  salt_tolerant?: boolean;
  thorny?: boolean;
  invasive?: boolean;
  rare?: boolean;
  rare_level?: string;
  tropical?: boolean;
  cuisine?: boolean;
  indoor?: boolean;
  care_level?: string;
  pest_susceptibility?: string[];
  pest_susceptibility_api?: string;
  flowers?: boolean;
  cones?: boolean;
  fruits?: boolean;
  edible_fruit_t?: boolean;
  fruit_color?: string[];
  fruiting_season?: string;
  harvest_method?: string;
  soil?: string[];
  soil_ph?: string;
  origin?: string[];
  description?: string;
}

export interface PerenualSearchResponse {
  data: PerenualPlant[];
  to: number;
  per_page: number;
  current_page: number;
  from: number;
  last_page: number;
  total: number;
}

export interface PerenualDetailsResponse {
  id: number;
  [key: string]: any;
}

/**
 * Search for plants in Perenual database
 * @param query - Search term (common name or scientific name)
 * @param page - Page number (default 1)
 * @param filters - Additional filters
 */
export async function searchPerenualPlants(
  query: string,
  page: number = 1,
  filters?: { edible?: boolean; indoor?: boolean }
): Promise<PerenualSearchResponse> {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("Perenual API key not configured. Get one at https://perenual.com/docs/api");
  }

  const params = new URLSearchParams({
    key: API_KEY,
    q: query,
    page: page.toString(),
  });

  // Perenual uses 'edible=1' for edible plants filter
  if (filters?.edible) {
    params.append("edible", "1");
  }

  if (filters?.indoor) {
    params.append("indoor", "1");
  }

  const url = `${PERENUAL_API_BASE}/species-list?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perenual API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get detailed information about a specific plant
 * @param plantId - Perenual plant ID
 */
export async function getPerenualPlantDetails(plantId: number): Promise<PerenualPlantDetails> {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("Perenual API key not configured. Get one at https://perenual.com/docs/api");
  }

  const url = `${PERENUAL_API_BASE}/species/details/${plantId}?key=${API_KEY}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perenual API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Convert Perenual plant data to our Plant model format
 */
export function convertPerenualToPlant(perenual: PerenualPlantDetails) {
  // Default spacing based on plant type and size
  let spacingInches = 12; // Default

  // Estimate spacing from dimension if available
  if (perenual.dimension) {
    // Dimension might be like "6 to 12 inches"
    const match = perenual.dimension.match(/(\d+)\s*(?:to\s*(\d+))?\s*(?:inches|in)/i);
    if (match) {
      const maxDim = match[2] ? parseInt(match[2]) : parseInt(match[1]);
      spacingInches = Math.max(6, Math.min(maxDim, 48));
    }
  }

  // Get scientific name (Perenual returns array)
  const scientificName = Array.isArray(perenual.scientific_name)
    ? perenual.scientific_name[0]
    : perenual.scientific_name || null;

  // Build notes with useful information (now simplified since we have dedicated fields)
  const notes = [
    perenual.edible_fruit_taste_profile ? `Taste: ${perenual.edible_fruit_taste_profile}` : null,
    perenual.fruit_nutritional_value ? `Nutrition: ${perenual.fruit_nutritional_value}` : null,
    perenual.harvest_method ? `Harvest method: ${perenual.harvest_method}` : null,
  ].filter(Boolean).join("\n") || null;

  // Determine if edible
  const edible = perenual.edible_fruit || perenual.edible_leaf || false;

  // Build edible parts string
  const edibleParts: string[] = [];
  if (perenual.edible_fruit) edibleParts.push("fruit");
  if (perenual.edible_leaf) edibleParts.push("leaves");
  const ediblePart = edibleParts.length > 0 ? edibleParts.join(", ") : null;

  // Get average height in cm (convert from dimension if available)
  let averageHeightCm: number | null = null;
  if (perenual.dimension) {
    const inchMatch = perenual.dimension.match(/(\d+)\s*(?:inches|in)/i);
    const ftMatch = perenual.dimension.match(/(\d+)\s*(?:feet|ft)/i);
    if (ftMatch) {
      averageHeightCm = parseInt(ftMatch[1]) * 30.48; // ft to cm
    } else if (inchMatch) {
      averageHeightCm = parseInt(inchMatch[1]) * 2.54; // in to cm
    }
  }

  return {
    name: perenual.common_name,
    variety: perenual.other_name?.[0] || null,
    spacingInches: Math.max(6, Math.min(spacingInches, 48)),
    plantingDepthInches: null, // Perenual doesn't provide this directly
    daysToMaturityMin: null, // Would need to calculate from cycle/flowering_season
    daysToMaturityMax: null,
    notes,

    // Trefle-compatible fields
    scientificName,
    growthForm: perenual.type || null,
    growthHabit: null, // Not provided by Perenual
    growthRate: perenual.growth_rate || null,
    averageHeightCm,
    minTemperatureC: perenual.hardiness?.min ? parseFloat(perenual.hardiness.min) : null,
    maxTemperatureC: perenual.hardiness?.max ? parseFloat(perenual.hardiness.max) : null,
    lightRequirement: perenual.sunlight?.[0] ? mapSunlightToScale(perenual.sunlight[0]) : null,
    soilNutriments: null, // Not directly provided
    soilHumidity: perenual.watering ? mapWateringToScale(perenual.watering) : null,
    edible,
    ediblePart,

    // Additional Perenual-specific fields
    cycle: perenual.cycle || null,
    watering: perenual.watering || null,
    sunlight: perenual.sunlight?.join(", ") || null,
    floweringSeason: perenual.flowering_season || null,
    harvestSeason: perenual.harvest_season || null,
    careLevel: perenual.care_level || null,
    maintenance: perenual.maintenance || null,
    indoor: perenual.indoor || false,
    droughtTolerant: perenual.drought_tolerant || false,
    medicinal: perenual.medicinal || false,
    poisonousToHumans: perenual.poisonous_to_humans ?? null,
    poisonousToPets: perenual.poisonous_to_pets ?? null,
    description: perenual.description || null,
  };
}

/**
 * Map Perenual sunlight requirements to 0-10 scale
 */
function mapSunlightToScale(sunlight: string): number {
  const lower = sunlight.toLowerCase();
  if (lower.includes("full sun") || lower.includes("full_sun")) return 10;
  if (lower.includes("part shade") || lower.includes("part_shade")) return 6;
  if (lower.includes("full shade") || lower.includes("full_shade")) return 2;
  if (lower.includes("sun")) return 8;
  if (lower.includes("shade")) return 4;
  return 5; // Default medium
}

/**
 * Map Perenual watering requirements to 0-10 humidity scale
 */
function mapWateringToScale(watering: string): number {
  const lower = watering.toLowerCase();
  if (lower.includes("frequent")) return 9;
  if (lower.includes("average")) return 5;
  if (lower.includes("minimum")) return 2;
  if (lower.includes("none")) return 0;
  return 5; // Default medium
}
