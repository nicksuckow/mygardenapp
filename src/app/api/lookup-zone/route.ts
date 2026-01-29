import { NextResponse } from "next/server";
import { lookupHardinessZone } from "@/lib/verdantly";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// USDA Hardiness Zone estimation based on latitude
// This is based on general latitude bands for continental US zones
// Note: Actual zones vary by local factors (elevation, water bodies, urban heat, etc.)
function estimateZoneFromLatitude(lat: number): string {
  // Alaska and far northern regions
  if (lat >= 64) return "1a";
  if (lat >= 60) return "2a";
  if (lat >= 56) return "3a";

  // Northern tier states (Montana, North Dakota, Minnesota, etc.)
  if (lat >= 49) return "3b";
  if (lat >= 47) return "4a";
  if (lat >= 45) return "4b";

  // Northern states (Michigan, Wisconsin, New York, etc.)
  if (lat >= 44) return "5a";
  if (lat >= 42) return "5b";

  // Transition zone (Pennsylvania, Ohio, Indiana, Illinois, Iowa, Nebraska)
  if (lat >= 41) return "6a";
  if (lat >= 39) return "6b";

  // Mid-latitude (Virginia, Kentucky, Missouri, Kansas, Colorado)
  if (lat >= 37.5) return "7a";
  if (lat >= 36) return "7b";

  // Southern tier (North Carolina, Tennessee, Arkansas, Oklahoma, New Mexico)
  if (lat >= 35) return "8a";
  if (lat >= 33) return "8b";

  // Deep South (South Carolina, Georgia, Alabama, Mississippi, Louisiana, Texas)
  if (lat >= 31) return "9a";
  if (lat >= 29) return "9b";

  // Southern Florida, Gulf Coast
  if (lat >= 27) return "10a";
  if (lat >= 25) return "10b";

  // Far South Florida, Keys
  if (lat >= 24) return "11a";
  if (lat >= 18) return "11b";

  // Hawaii and tropical
  return "12a";
}

// Frost date estimates by USDA zone (approximate - varies by location within zone)
const FROST_DATE_ESTIMATES: Record<string, { lastSpring: string; firstFall: string }> = {
  "1a": { lastSpring: "06-15", firstFall: "08-01" },
  "1b": { lastSpring: "06-01", firstFall: "08-15" },
  "2a": { lastSpring: "05-15", firstFall: "09-01" },
  "2b": { lastSpring: "05-15", firstFall: "09-15" },
  "3a": { lastSpring: "05-15", firstFall: "09-15" },
  "3b": { lastSpring: "05-01", firstFall: "10-01" },
  "4a": { lastSpring: "05-15", firstFall: "10-01" },
  "4b": { lastSpring: "05-01", firstFall: "10-15" },
  "5a": { lastSpring: "05-01", firstFall: "10-15" },
  "5b": { lastSpring: "04-15", firstFall: "10-15" },
  "6a": { lastSpring: "04-15", firstFall: "10-15" },
  "6b": { lastSpring: "04-15", firstFall: "10-31" },
  "7a": { lastSpring: "04-15", firstFall: "10-31" },
  "7b": { lastSpring: "04-01", firstFall: "11-15" },
  "8a": { lastSpring: "03-15", firstFall: "11-15" },
  "8b": { lastSpring: "03-01", firstFall: "11-30" },
  "9a": { lastSpring: "02-15", firstFall: "12-01" },
  "9b": { lastSpring: "02-01", firstFall: "12-15" },
  "10a": { lastSpring: "01-30", firstFall: "12-01" },
  "10b": { lastSpring: "01-30", firstFall: "12-15" },
  "11a": { lastSpring: "01-15", firstFall: "12-15" },
  "11b": { lastSpring: "01-15", firstFall: "12-31" },
  "12a": { lastSpring: "01-15", firstFall: "12-31" },
  "12b": { lastSpring: "01-15", firstFall: "12-31" },
  "13a": { lastSpring: "01-15", firstFall: "12-31" },
  "13b": { lastSpring: "01-15", firstFall: "12-31" },
};

export async function GET(req: Request) {
  // Rate limit check for external API
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "lookup-zone", RATE_LIMITS.externalApi);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { searchParams } = new URL(req.url);
    const zipCode = searchParams.get("zip");

    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      return NextResponse.json(
        { error: "Valid 5-digit ZIP code required" },
        { status: 400 }
      );
    }

    // Try Verdantly API first (most accurate)
    try {
      const verdantlyData = await lookupHardinessZone(zipCode);

      if (verdantlyData && verdantlyData.zone) {
        // Get frost date estimates based on zone
        const currentYear = new Date().getFullYear();
        const zone = verdantlyData.zone;
        const frostEstimates = FROST_DATE_ESTIMATES[zone.toLowerCase()] || FROST_DATE_ESTIMATES["6a"];

        return NextResponse.json({
          zone,
          lastSpringFrost: `${currentYear}-${frostEstimates.lastSpring}`,
          firstFallFrost: `${currentYear}-${frostEstimates.firstFall}`,
          source: "verdantly",
        });
      }
    } catch (verdantlyError) {
      console.warn("Verdantly zone lookup failed, falling back to geocoding:", verdantlyError);
      // Fall through to backup method
    }

    // Fallback: Get coordinates from ZIP code using Zippopotam.us and estimate zone
    const geocodeUrl = `https://api.zippopotam.us/us/${zipCode}`;

    const geocodeRes = await fetch(geocodeUrl);
    if (!geocodeRes.ok) {
      return NextResponse.json(
        { error: "ZIP code not found. Please check the ZIP code and try again." },
        { status: 404 }
      );
    }

    const geocodeData = await geocodeRes.json();

    if (!geocodeData || !geocodeData.places || geocodeData.places.length === 0) {
      return NextResponse.json(
        { error: "Could not find location data for this ZIP code" },
        { status: 404 }
      );
    }

    const place = geocodeData.places[0];
    const lat = parseFloat(place.latitude);
    const lon = parseFloat(place.longitude);

    // Determine USDA Plant Hardiness Zone from latitude
    const zone = estimateZoneFromLatitude(lat);

    // Get frost date estimates based on zone
    const currentYear = new Date().getFullYear();
    const frostEstimates = FROST_DATE_ESTIMATES[zone.toLowerCase()] || FROST_DATE_ESTIMATES["6a"];

    return NextResponse.json({
      zone,
      lastSpringFrost: `${currentYear}-${frostEstimates.lastSpring}`,
      firstFallFrost: `${currentYear}-${frostEstimates.firstFall}`,
      coordinates: { lat, lon },
      source: "geocoding",
    });
  } catch (error) {
    console.error("Error in zone lookup:", error);
    return NextResponse.json(
      { error: "Failed to lookup zone information. The zone lookup service may be temporarily unavailable. You can find your zone at planthardiness.ars.usda.gov and enter it manually below." },
      { status: 500 }
    );
  }
}
