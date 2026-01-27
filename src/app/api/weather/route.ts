import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";

// Open-Meteo API (free, no key required)
// Weather codes: https://open-meteo.com/en/docs#weathervariables
const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear sky", icon: "sun" },
  1: { description: "Mainly clear", icon: "sun" },
  2: { description: "Partly cloudy", icon: "cloud-sun" },
  3: { description: "Overcast", icon: "cloud" },
  45: { description: "Fog", icon: "fog" },
  48: { description: "Depositing rime fog", icon: "fog" },
  51: { description: "Light drizzle", icon: "cloud-rain" },
  53: { description: "Moderate drizzle", icon: "cloud-rain" },
  55: { description: "Dense drizzle", icon: "cloud-rain" },
  61: { description: "Slight rain", icon: "cloud-rain" },
  63: { description: "Moderate rain", icon: "cloud-rain" },
  65: { description: "Heavy rain", icon: "cloud-showers-heavy" },
  66: { description: "Light freezing rain", icon: "icicles" },
  67: { description: "Heavy freezing rain", icon: "icicles" },
  71: { description: "Slight snow", icon: "snowflake" },
  73: { description: "Moderate snow", icon: "snowflake" },
  75: { description: "Heavy snow", icon: "snowflake" },
  77: { description: "Snow grains", icon: "snowflake" },
  80: { description: "Slight rain showers", icon: "cloud-sun-rain" },
  81: { description: "Moderate rain showers", icon: "cloud-rain" },
  82: { description: "Violent rain showers", icon: "cloud-showers-heavy" },
  85: { description: "Slight snow showers", icon: "snowflake" },
  86: { description: "Heavy snow showers", icon: "snowflake" },
  95: { description: "Thunderstorm", icon: "bolt" },
  96: { description: "Thunderstorm with slight hail", icon: "bolt" },
  99: { description: "Thunderstorm with heavy hail", icon: "bolt" },
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
};

// Default coordinates (will be overridden by user settings or geolocation)
const DEFAULT_LAT = 40.7128; // New York
const DEFAULT_LON = -74.006;

export async function GET(req: Request) {
  try {
    await getCurrentUserId();

    // Get coordinates from query params or use defaults
    const url = new URL(req.url);
    let lat = parseFloat(url.searchParams.get("lat") || "");
    let lon = parseFloat(url.searchParams.get("lon") || "");

    // If no coordinates provided, try to get from user settings/zone
    if (isNaN(lat) || isNaN(lon)) {
      // Use defaults for now - in a real app, we'd geocode the user's zone
      lat = DEFAULT_LAT;
      lon = DEFAULT_LON;
    }

    // Fetch current weather and 7-day forecast from Open-Meteo
    const meteoUrl = new URL("https://api.open-meteo.com/v1/forecast");
    meteoUrl.searchParams.set("latitude", lat.toString());
    meteoUrl.searchParams.set("longitude", lon.toString());
    meteoUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation");
    meteoUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max");
    meteoUrl.searchParams.set("temperature_unit", "fahrenheit");
    meteoUrl.searchParams.set("wind_speed_unit", "mph");
    meteoUrl.searchParams.set("precipitation_unit", "inch");
    meteoUrl.searchParams.set("timezone", "auto");

    const response = await fetch(meteoUrl.toString());
    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data: OpenMeteoResponse = await response.json();

    // Parse current conditions
    const weatherInfo = WEATHER_CODES[data.current.weather_code] || { description: "Unknown", icon: "question" };

    // Check for frost warning (temp below 36F in next 3 days)
    const frostWarning = data.daily.temperature_2m_min.slice(0, 3).some(temp => temp <= 36);

    // Check for freeze warning (temp below 32F)
    const freezeWarning = data.daily.temperature_2m_min.slice(0, 3).some(temp => temp <= 32);

    // Format forecast
    const forecast = data.daily.time.slice(0, 7).map((date, idx) => ({
      date,
      dayName: new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
      high: Math.round(data.daily.temperature_2m_max[idx]),
      low: Math.round(data.daily.temperature_2m_min[idx]),
      weatherCode: data.daily.weather_code[idx],
      description: WEATHER_CODES[data.daily.weather_code[idx]]?.description || "Unknown",
      icon: WEATHER_CODES[data.daily.weather_code[idx]]?.icon || "question",
      precipitationChance: data.daily.precipitation_probability_max[idx],
      precipitationAmount: Math.round(data.daily.precipitation_sum[idx] * 100) / 100,
    }));

    return NextResponse.json({
      current: {
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        precipitation: data.current.precipitation,
      },
      forecast,
      alerts: {
        frost: frostWarning,
        freeze: freezeWarning,
      },
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  } catch (error) {
    console.error("Error fetching weather:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
