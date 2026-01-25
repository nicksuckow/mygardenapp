// Trefle API integration
// Documentation: https://docs.trefle.io/

const TREFLE_API_BASE = "https://trefle.io/api/v1";
const API_KEY = process.env.TREFLE_API_KEY;

export interface TreflePlant {
  id: number;
  common_name: string | null;
  scientific_name: string;
  slug: string;
  year: number | null;
  family_common_name: string | null;
  genus: string;
  image_url: string | null;
  // Edible plants specific
  edible?: boolean;
  edible_part?: string[] | null;
  vegetable?: boolean;
}

export interface TreflePlantDetails extends TreflePlant {
  // Growth characteristics
  specifications?: {
    growth_months?: number[] | null;
    bloom_months?: number[] | null;
    fruit_months?: number[] | null;
    growth_form?: string | null;
    growth_habit?: string | null;
    growth_rate?: string | null;
    average_height?: {
      cm: number | null;
    } | null;
    maximum_height?: {
      cm: number | null;
    } | null;
    minimum_precipitation?: {
      mm: number | null;
    } | null;
    maximum_precipitation?: {
      mm: number | null;
    } | null;
    minimum_root_depth?: {
      cm: number | null;
    } | null;
    minimum_temperature?: {
      deg_c: number | null;
    } | null;
    maximum_temperature?: {
      deg_c: number | null;
    } | null;
    soil_nutriments?: number | null;
    soil_salinity?: number | null;
    soil_texture?: number | null;
    soil_humidity?: number | null;
    light?: number | null;
    atmospheric_humidity?: number | null;
  };
  // Distribution and growth
  distributions?: {
    native?: string[];
    introduced?: string[];
  };
  // Other properties
  main_species_id?: number | null;
  observations?: string | null;
  sources?: any[];
}

export interface TrefleSearchResponse {
  data: TreflePlant[];
  links: {
    self: string;
    first: string;
    last: string;
    next?: string;
  };
  meta: {
    total: number;
  };
}

export interface TrefleDetailsResponse {
  data: TreflePlantDetails;
}

/**
 * Search for plants in Trefle database
 * @param query - Search term (common name or scientific name)
 * @param page - Page number (default 1)
 * @param filter - Additional filters (e.g., edible=true, vegetable=true)
 */
export async function searchTreflePlants(
  query: string,
  page: number = 1,
  filter?: { edible?: boolean; vegetable?: boolean }
): Promise<TrefleSearchResponse> {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("Trefle API key not configured. Get one at https://trefle.io/users/sign_up");
  }

  const params = new URLSearchParams({
    token: API_KEY,
    q: query,
    page: page.toString(),
  });

  if (filter?.edible) params.append("filter[edible]", "true");
  if (filter?.vegetable) params.append("filter[vegetable]", "true");

  const url = `${TREFLE_API_BASE}/plants/search?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Trefle API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get detailed information about a specific plant
 * @param plantId - Trefle plant ID
 */
export async function getTreflePlantDetails(plantId: number): Promise<TrefleDetailsResponse> {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("Trefle API key not configured. Get one at https://trefle.io/users/sign_up");
  }

  const url = `${TREFLE_API_BASE}/plants/${plantId}?token=${API_KEY}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Trefle API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Convert Trefle plant data to our Plant model format
 */
export function convertTrefleToPlant(trefle: TreflePlantDetails) {
  // Convert root depth from cm to inches
  const rootDepthCm = trefle.specifications?.minimum_root_depth?.cm;
  const plantingDepthInches = rootDepthCm ? rootDepthCm * 0.393701 : null;

  // Try to determine spacing from height (rough estimate)
  const heightCm = trefle.specifications?.average_height?.cm ||
                   trefle.specifications?.maximum_height?.cm;
  // Default spacing is roughly 1/2 to 2/3 of height, convert to inches
  const spacingInches = heightCm
    ? Math.round((heightCm * 0.5 * 0.393701) / 6) * 6 // Round to nearest 6 inches
    : 12; // Default 12 inches

  return {
    name: trefle.common_name || trefle.scientific_name,
    variety: trefle.common_name ? null : trefle.genus, // Use genus if no common name
    spacingInches: Math.max(6, Math.min(spacingInches, 48)), // Clamp between 6-48 inches
    plantingDepthInches: plantingDepthInches ? Math.min(plantingDepthInches, 24) : null,
    // Growth months could be used to calculate days to maturity
    // This is a rough estimate - you may want to adjust
    daysToMaturityMin: trefle.specifications?.growth_months?.length
      ? trefle.specifications.growth_months.length * 30
      : null,
    daysToMaturityMax: null,
    notes: [
      trefle.family_common_name ? `Family: ${trefle.family_common_name}` : null,
    ].filter(Boolean).join("\n"),

    // New Trefle fields
    scientificName: trefle.scientific_name,
    growthForm: trefle.specifications?.growth_form || null,
    growthHabit: trefle.specifications?.growth_habit || null,
    growthRate: trefle.specifications?.growth_rate || null,
    averageHeightCm: trefle.specifications?.average_height?.cm || null,
    minTemperatureC: trefle.specifications?.minimum_temperature?.deg_c || null,
    maxTemperatureC: trefle.specifications?.maximum_temperature?.deg_c || null,
    lightRequirement: trefle.specifications?.light || null,
    soilNutriments: trefle.specifications?.soil_nutriments || null,
    soilHumidity: trefle.specifications?.soil_humidity || null,
    edible: trefle.edible || false,
    ediblePart: trefle.edible_part?.join(", ") || null,
  };
}
