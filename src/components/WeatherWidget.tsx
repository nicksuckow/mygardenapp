"use client";

import { useEffect, useState } from "react";

type WeatherData = {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
    precipitation: number;
  };
  forecast: {
    date: string;
    dayName: string;
    high: number;
    low: number;
    weatherCode: number;
    description: string;
    icon: string;
    precipitationChance: number;
    precipitationAmount: number;
  }[];
  alerts: {
    frost: boolean;
    freeze: boolean;
  };
  location: {
    latitude: number;
    longitude: number;
  };
};

// Simple weather icons using emoji
function WeatherIcon({ icon, className = "" }: { icon: string; className?: string }) {
  const iconMap: Record<string, string> = {
    sun: "\u2600\uFE0F",
    "cloud-sun": "\u26C5",
    cloud: "\u2601\uFE0F",
    fog: "\ud83c\udf2b\uFE0F",
    "cloud-rain": "\ud83c\udf27\uFE0F",
    "cloud-showers-heavy": "\ud83c\udf27\uFE0F",
    "cloud-sun-rain": "\ud83c\udf26\uFE0F",
    icicles: "\ud83e\uddca",
    snowflake: "\u2744\uFE0F",
    bolt: "\u26A1",
    question: "\u2753",
  };

  return <span className={className}>{iconMap[icon] || iconMap.question}</span>;
}

export default function WeatherWidget({ compact = false }: { compact?: boolean }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Try to get user's location
        let lat: number | undefined;
        let lon: number | undefined;

        if ("geolocation" in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 300000, // Cache for 5 minutes
              });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          } catch {
            // Geolocation failed, will use defaults
          }
        }

        const url = new URL("/api/weather", window.location.origin);
        if (lat && lon) {
          url.searchParams.set("lat", lat.toString());
          url.searchParams.set("lon", lon.toString());
        }

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch weather");
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load weather");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-24 mb-2" />
        <div className="h-8 bg-slate-200 rounded w-16" />
      </div>
    );
  }

  if (error || !weather) {
    return null; // Silently hide if weather fails to load
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <WeatherIcon icon={weather.current.icon} className="text-lg" />
        <span className="font-medium">{weather.current.temperature}°F</span>
        {(weather.alerts.frost || weather.alerts.freeze) && (
          <span className="text-amber-600 text-xs font-medium">
            {weather.alerts.freeze ? "Freeze!" : "Frost!"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-sky-50 overflow-hidden">
      {/* Frost/Freeze Alert */}
      {(weather.alerts.frost || weather.alerts.freeze) && (
        <div className={`px-4 py-2 text-sm font-medium ${
          weather.alerts.freeze
            ? "bg-red-100 text-red-800 border-b border-red-200"
            : "bg-amber-100 text-amber-800 border-b border-amber-200"
        }`}>
          {weather.alerts.freeze
            ? "\u26A0\uFE0F Freeze Warning: Temperatures below 32°F expected"
            : "\u26A0\uFE0F Frost Advisory: Temperatures near freezing expected"}
        </div>
      )}

      <div className="p-4">
        {/* Current Conditions */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <WeatherIcon icon={weather.current.icon} className="text-3xl" />
              <div>
                <p className="text-3xl font-bold text-slate-800">{weather.current.temperature}°F</p>
                <p className="text-sm text-slate-600">{weather.current.description}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-slate-500">
              <span>Feels like {weather.current.feelsLike}°F</span>
              <span>Humidity {weather.current.humidity}%</span>
              <span>Wind {weather.current.windSpeed} mph</span>
            </div>
          </div>
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {showForecast ? "Hide" : "7-day"}
          </button>
        </div>

        {/* Forecast */}
        {showForecast && (
          <div className="mt-4 pt-4 border-t border-blue-100">
            <div className="grid grid-cols-7 gap-1">
              {weather.forecast.map((day) => (
                <div key={day.date} className="text-center">
                  <p className="text-xs font-medium text-slate-600">{day.dayName}</p>
                  <WeatherIcon icon={day.icon} className="text-lg" />
                  <p className="text-xs">
                    <span className="font-medium text-slate-800">{day.high}°</span>
                    <span className="text-slate-400">/{day.low}°</span>
                  </p>
                  {day.precipitationChance > 20 && (
                    <p className="text-xs text-blue-500">{day.precipitationChance}%</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
