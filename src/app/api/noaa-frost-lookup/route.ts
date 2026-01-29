import { NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOAA_API_BASE = "https://www.ncei.noaa.gov/cdo-web/api/v2";
const FREEZE_THRESHOLD_F = 32; // 32°F = 0°C

// State abbreviation to FIPS code mapping
const STATE_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09", DE: "10",
  FL: "12", GA: "13", HI: "15", ID: "16", IL: "17", IN: "18", IA: "19", KS: "20",
  KY: "21", LA: "22", ME: "23", MD: "24", MA: "25", MI: "26", MN: "27", MS: "28",
  MO: "29", MT: "30", NE: "31", NV: "32", NH: "33", NJ: "34", NM: "35", NY: "36",
  NC: "37", ND: "38", OH: "39", OK: "40", OR: "41", PA: "42", RI: "44", SC: "45",
  SD: "46", TN: "47", TX: "48", UT: "49", VT: "50", VA: "51", WA: "53", WV: "54",
  WI: "55", WY: "56", DC: "11", PR: "72", VI: "78",
};

interface NOAADataRecord {
  date: string;
  datatype: string;
  station: string;
  value: number;
}

interface NOAAResponse {
  metadata?: { resultset: { count: number } };
  results?: NOAADataRecord[];
}

interface StationResult {
  id: string;
  name: string;
  mindate: string;
  maxdate: string;
  latitude?: number;
  longitude?: number;
}

interface StationsResponse {
  results?: StationResult[];
}

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius: number): number {
  return celsius * 9/5 + 32;
}

// Calculate distance between two lat/lon points (in miles)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Extract state abbreviation from station name (e.g., "DES MOINES, IA US" -> "IA")
function extractStateFromName(name: string): string | null {
  const match = name.match(/,\s*([A-Z]{2})\s+US$/);
  return match ? match[1] : null;
}

// Find stations near a ZIP code
async function findStationsNearZip(zip: string, token: string): Promise<StationResult[]> {
  const url = `${NOAA_API_BASE}/stations?locationid=ZIP:${zip}&datasetid=GHCND&datatypeid=TMIN&limit=10`;

  const res = await fetch(url, {
    headers: { token },
  });

  if (!res.ok) {
    throw new Error(`Failed to find stations: ${res.status}`);
  }

  const data: StationsResponse = await res.json();
  return data.results || [];
}

// Find stations in a state with data for a specific year
async function findStationsInState(
  stateFips: string,
  year: number,
  token: string
): Promise<StationResult[]> {
  const url = `${NOAA_API_BASE}/stations?locationid=FIPS:${stateFips}&datasetid=GHCND&datatypeid=TMIN&limit=100&sortfield=maxdate&sortorder=desc`;

  const res = await fetch(url, {
    headers: { token },
  });

  if (!res.ok) {
    return [];
  }

  const data: StationsResponse = await res.json();
  const stations = data.results || [];

  // Filter to stations that have data for the requested year
  return stations.filter(station => {
    const maxYear = parseInt(station.maxdate?.slice(0, 4) || "0", 10);
    const minYear = parseInt(station.mindate?.slice(0, 4) || "9999", 10);
    return year >= minYear && year <= maxYear;
  });
}

// Fetch TMIN data for a station and date range
async function fetchTminData(
  stationId: string,
  startDate: string,
  endDate: string,
  token: string
): Promise<NOAADataRecord[]> {
  const url = `${NOAA_API_BASE}/data?datasetid=GHCND&stationid=${stationId}&datatypeid=TMIN&startdate=${startDate}&enddate=${endDate}&units=metric&limit=1000`;

  const res = await fetch(url, {
    headers: { token },
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to fetch temperature data: ${res.status}`);
  }

  const data: NOAAResponse = await res.json();
  return data.results || [];
}

// Find frost dates from temperature data
function findFrostDates(records: NOAADataRecord[], year: number): {
  lastSpringFrost: string | null;
  firstFallFrost: string | null;
} {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const midYear = `${year}-07-01`;

  let lastSpringFrost: string | null = null;
  let firstFallFrost: string | null = null;

  for (const record of sorted) {
    const tempF = celsiusToFahrenheit(record.value);
    const date = record.date.slice(0, 10);

    if (tempF <= FREEZE_THRESHOLD_F) {
      if (date < midYear) {
        lastSpringFrost = date;
      } else if (!firstFallFrost) {
        firstFallFrost = date;
      }
    }
  }

  return { lastSpringFrost, firstFallFrost };
}

export async function GET(req: Request) {
  // Rate limit check for external API
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "noaa-frost-lookup", RATE_LIMITS.externalApi);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  try {
    const token = process.env.NOAA_CDO_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "NOAA API token not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const zip = searchParams.get("zip");
    const yearParam = searchParams.get("year");

    if (!zip || !/^\d{5}$/.test(zip)) {
      return NextResponse.json(
        { error: "Valid 5-digit ZIP code required" },
        { status: 400 }
      );
    }

    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear() - 1;
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      return NextResponse.json(
        { error: "Invalid year" },
        { status: 400 }
      );
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Step 1: Find weather stations near the ZIP code
    const localStations = await findStationsNearZip(zip, token);

    if (localStations.length === 0) {
      return NextResponse.json(
        { error: "No weather stations found near this ZIP code." },
        { status: 404 }
      );
    }

    // Step 2: Try local stations first
    let referenceStation: StationResult | null = null;
    let stateAbbr: string | null = null;

    for (const station of localStations) {
      const stationMinYear = parseInt(station.mindate?.slice(0, 4) || "9999", 10);
      const stationMaxYear = parseInt(station.maxdate?.slice(0, 4) || "0", 10);

      // Save reference info for fallback
      if (!referenceStation) {
        referenceStation = station;
        stateAbbr = extractStateFromName(station.name);
      }

      if (year < stationMinYear || year > stationMaxYear) {
        continue;
      }

      try {
        const records = await fetchTminData(station.id, startDate, endDate, token);

        if (records.length > 0) {
          const frostDates = findFrostDates(records, year);

          return NextResponse.json({
            year,
            zip,
            station: {
              id: station.id,
              name: station.name,
            },
            recordCount: records.length,
            lastSpringFrost: frostDates.lastSpringFrost,
            firstFallFrost: frostDates.firstFallFrost,
            isNearbyStation: false,
          });
        }
      } catch {
        // Try next station
      }
    }

    // Step 3: Local stations don't have data - try finding a nearby station in the same state
    if (stateAbbr && STATE_FIPS[stateAbbr] && referenceStation) {
      const stateFips = STATE_FIPS[stateAbbr];
      const stateStations = await findStationsInState(stateFips, year, token);

      if (stateStations.length > 0 && referenceStation.latitude && referenceStation.longitude) {
        // Sort by distance from the original ZIP's coordinates
        const refLat = referenceStation.latitude;
        const refLon = referenceStation.longitude;

        const stationsWithDistance = stateStations
          .filter(s => s.latitude && s.longitude)
          .map(s => ({
            station: s,
            distance: calculateDistance(refLat, refLon, s.latitude!, s.longitude!),
          }))
          .sort((a, b) => a.distance - b.distance);

        // Try the closest stations
        for (const { station, distance } of stationsWithDistance.slice(0, 5)) {
          try {
            const records = await fetchTminData(station.id, startDate, endDate, token);

            if (records.length > 0) {
              const frostDates = findFrostDates(records, year);

              return NextResponse.json({
                year,
                zip,
                station: {
                  id: station.id,
                  name: station.name,
                },
                recordCount: records.length,
                lastSpringFrost: frostDates.lastSpringFrost,
                firstFallFrost: frostDates.firstFallFrost,
                isNearbyStation: true,
                distanceMiles: Math.round(distance),
              });
            }
          } catch {
            // Try next station
          }
        }
      }

      // If we couldn't get coordinates, just try the first few state stations
      for (const station of stateStations.slice(0, 5)) {
        try {
          const records = await fetchTminData(station.id, startDate, endDate, token);

          if (records.length > 0) {
            const frostDates = findFrostDates(records, year);

            return NextResponse.json({
              year,
              zip,
              station: {
                id: station.id,
                name: station.name,
              },
              recordCount: records.length,
              lastSpringFrost: frostDates.lastSpringFrost,
              firstFallFrost: frostDates.firstFallFrost,
              isNearbyStation: true,
            });
          }
        } catch {
          // Try next station
        }
      }
    }

    return NextResponse.json(
      { error: "No temperature data available for this location and year." },
      { status: 404 }
    );

  } catch (error) {
    console.error("NOAA frost lookup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
