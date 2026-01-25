"use client";

import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";

type Settings = {
  id: number;
  lastSpringFrost: string;
  firstFallFrost: string;
  zone: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState("");
  const [lastSpringFrost, setLastSpringFrost] = useState("");
  const [firstFallFrost, setFirstFallFrost] = useState("");
  const [message, setMessage] = useState("");

  // ZIP code lookup
  const [zipCode, setZipCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const text = await res.text();
  
        if (!res.ok) {
          setMessage(`Failed to load settings (error ${res.status}).`);
          setLoading(false);
          return;
        }

        const data: Settings | null = text ? JSON.parse(text) : null;

        if (data) {
          setZone(data.zone ?? "");
          setLastSpringFrost(data.lastSpringFrost.slice(0, 10));
          setFirstFallFrost(data.firstFallFrost.slice(0, 10));
        } else {
          setLastSpringFrost("2026-04-15");
          setFirstFallFrost("2026-10-15");
        }

        setLoading(false);
      } catch (e) {
        setMessage("Failed to load settings.");
        setLoading(false);
      }
    })();
  }, []);

  async function lookupByZip() {
    setMessage("");

    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      setMessage("Please enter a valid 5-digit ZIP code.");
      return;
    }

    try {
      setLookingUp(true);
      const res = await fetch(`/api/lookup-zone?zip=${zipCode}`);
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Lookup failed. Please try a different ZIP code.");
        return;
      }

      // Auto-fill the fields with the lookup results
      setZone(data.zone);
      setLastSpringFrost(data.lastSpringFrost);
      setFirstFallFrost(data.firstFallFrost);
      setMessage(`Found zone ${data.zone} for ZIP ${zipCode}. Zone and frost dates are estimates based on your location - verify and adjust if needed.`);
    } catch (error) {
      setMessage("Failed to lookup zone information. Please try again.");
    } finally {
      setLookingUp(false);
    }
  }

  async function save() {
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone, lastSpringFrost, firstFallFrost }),
    });

    if (!res.ok) {
      setMessage("Save failed.");
      return;
    }
    setMessage("Saved!");
  }

  if (loading) return <p className="text-sm text-slate-600">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 border border-slate-200 p-6">
        {/* Decorative location pin */}
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-32 h-32 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-shrink-0 bg-gradient-to-br from-slate-400 to-gray-500 text-white p-2.5 rounded-xl shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
              📍 Location Data
            </h1>
            <p className="text-slate-700 text-sm mt-1">
              Frost dates drive seed starting and planting timing. Zone is optional.
            </p>
          </div>
        </div>
      </div>

      <div className={`${ui.card} ${ui.cardPad} space-y-4 sm:max-w-2xl`}>
        <div>
          <h2 className="text-base font-semibold">Growing Zone & Frost Dates</h2>
          <p className="text-sm text-slate-600">Set your location details to get accurate planting schedules</p>
        </div>

        {/* ZIP Code Lookup */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-blue-900">Quick Setup</p>
            <p className="text-xs text-blue-700 mt-1">Enter your ZIP code to automatically fill in your zone and frost dates</p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    lookupByZip();
                  }
                }}
                placeholder="Enter ZIP code (e.g., 90210)"
                maxLength={5}
              />
            </div>
            <button
              className={`${ui.btn} ${ui.btnPrimary} whitespace-nowrap`}
              onClick={lookupByZip}
              disabled={lookingUp}
            >
              {lookingUp ? "Looking up..." : "Auto-fill"}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 mb-3">Or enter manually:</p>
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">USDA Hardiness Zone (optional)</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="e.g., 6a, 7b, 8a"
          />
          <span className="text-xs text-slate-500">Find your zone at planthardiness.ars.usda.gov</span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Last spring frost date</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            type="date"
            value={lastSpringFrost}
            onChange={(e) => setLastSpringFrost(e.target.value)}
          />
          <span className="text-xs text-slate-500">Average date of your area's last frost in spring</span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">First fall frost date</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            type="date"
            value={firstFallFrost}
            onChange={(e) => setFirstFallFrost(e.target.value)}
          />
          <span className="text-xs text-slate-500">Average date of your area's first frost in fall</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={save}
          >
            Save settings
          </button>

          {message ? (
            <div className={`rounded-lg border px-3 py-2 text-sm ${
              message.includes("Saved") || message.includes("Found")
                ? "border-green-200 bg-green-50 text-green-800"
                : message.includes("failed") || message.includes("Failed")
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}>
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
