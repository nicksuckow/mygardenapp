"use client";

import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";

type Settings = {
  id: number;
  lastSpringFrost: string;
  firstFallFrost: string;
  zone: string | null;
  zip: string | null;
};

type FrostHistoryRecord = {
  id: number;
  year: number;
  actualLastSpringFrost: string | null;
  actualFirstFallFrost: string | null;
  notes: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState("");
  const [lastSpringFrost, setLastSpringFrost] = useState("");
  const [firstFallFrost, setFirstFallFrost] = useState("");
  const [expectedMessage, setExpectedMessage] = useState("");

  // ZIP code lookup
  const [zipCode, setZipCode] = useState("");
  const [savedZip, setSavedZip] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  // Frost date history
  const [frostHistory, setFrostHistory] = useState<FrostHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // NOAA historical lookup
  const [noaaLookupZip, setNoaaLookupZip] = useState("");
  const [noaaLookupYear, setNoaaLookupYear] = useState(new Date().getFullYear() - 1);
  const [noaaLookupLoading, setNoaaLookupLoading] = useState(false);
  const [noaaLookupResult, setNoaaLookupResult] = useState<{
    lastSpringFrost: string | null;
    firstFallFrost: string | null;
    station: { id: string; name: string };
    recordCount: number;
    isNearbyStation?: boolean;
    distanceMiles?: number;
  } | null>(null);
  const [noaaLookupError, setNoaaLookupError] = useState("");

  // Auto-fetch multiple years
  const [autoFetchProgress, setAutoFetchProgress] = useState<{ current: number; total: number } | null>(null);
  const [autoFetchComplete, setAutoFetchComplete] = useState(false);

  // Track if expected dates are calculated from NOAA averages
  const [averageYearsCount, setAverageYearsCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Load settings
        const res = await fetch("/api/settings");
        const text = await res.text();

        if (!res.ok) {
          setExpectedMessage(`Failed to load settings (error ${res.status}).`);
          setLoading(false);
          return;
        }

        const data: Settings | null = text ? JSON.parse(text) : null;
        let hasSavedZip = false;

        if (data) {
          setZone(data.zone ?? "");
          // Load saved ZIP
          if (data.zip) {
            setZipCode(data.zip);
            setSavedZip(data.zip);
            setNoaaLookupZip(data.zip);
            hasSavedZip = true;
          }
          // Set initial frost dates from saved settings
          setLastSpringFrost(data.lastSpringFrost.slice(0, 10));
          setFirstFallFrost(data.firstFallFrost.slice(0, 10));
        } else {
          setLastSpringFrost("2026-04-15");
          setFirstFallFrost("2026-10-15");
        }

        // If we have a saved ZIP, load frost history and calculate averages
        if (hasSavedZip) {
          const historyRes = await fetch("/api/frost-history");
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setFrostHistory(historyData);
            // Calculate and apply averages from saved history
            if (historyData.length > 0) {
              const currentYear = new Date().getFullYear();
              const springRecords = historyData.filter((h: FrostHistoryRecord) => h.actualLastSpringFrost);
              const fallRecords = historyData.filter((h: FrostHistoryRecord) => h.actualFirstFallFrost);

              if (springRecords.length > 0 || fallRecords.length > 0) {
                if (springRecords.length > 0) {
                  const springDays = springRecords.map((h: FrostHistoryRecord) => {
                    const d = new Date(h.actualLastSpringFrost!);
                    const startOfYear = new Date(d.getFullYear(), 0, 0);
                    return Math.floor((d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
                  });
                  const avgSpringDay = Math.round(springDays.reduce((a: number, b: number) => a + b, 0) / springDays.length);
                  const springDate = new Date(currentYear, 0, avgSpringDay);
                  setLastSpringFrost(springDate.toISOString().slice(0, 10));
                }

                if (fallRecords.length > 0) {
                  const fallDays = fallRecords.map((h: FrostHistoryRecord) => {
                    const d = new Date(h.actualFirstFallFrost!);
                    const startOfYear = new Date(d.getFullYear(), 0, 0);
                    return Math.floor((d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
                  });
                  const avgFallDay = Math.round(fallDays.reduce((a: number, b: number) => a + b, 0) / fallDays.length);
                  const fallDate = new Date(currentYear, 0, avgFallDay);
                  setFirstFallFrost(fallDate.toISOString().slice(0, 10));
                }

                setAverageYearsCount(Math.max(springRecords.length, fallRecords.length));
              }
            }
          }
        }

        setLoading(false);
      } catch {
        setExpectedMessage("Failed to load settings.");
        setLoading(false);
      }
    })();
  }, []);

  // Calculate average frost dates from history and update expected dates
  function calculateAndApplyAverageFrostDates(history: FrostHistoryRecord[]) {
    const currentYear = new Date().getFullYear();

    const springRecords = history.filter(h => h.actualLastSpringFrost);
    const fallRecords = history.filter(h => h.actualFirstFallFrost);

    if (springRecords.length === 0 && fallRecords.length === 0) {
      setAverageYearsCount(null);
      return;
    }

    if (springRecords.length > 0) {
      const springDays = springRecords.map(h => {
        const d = new Date(h.actualLastSpringFrost!);
        const startOfYear = new Date(d.getFullYear(), 0, 0);
        return Math.floor((d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      });
      const avgSpringDay = Math.round(springDays.reduce((a, b) => a + b, 0) / springDays.length);
      const springDate = new Date(currentYear, 0, avgSpringDay);
      setLastSpringFrost(springDate.toISOString().slice(0, 10));
    }

    if (fallRecords.length > 0) {
      const fallDays = fallRecords.map(h => {
        const d = new Date(h.actualFirstFallFrost!);
        const startOfYear = new Date(d.getFullYear(), 0, 0);
        return Math.floor((d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      });
      const avgFallDay = Math.round(fallDays.reduce((a, b) => a + b, 0) / fallDays.length);
      const fallDate = new Date(currentYear, 0, avgFallDay);
      setFirstFallFrost(fallDate.toISOString().slice(0, 10));
    }

    setAverageYearsCount(Math.max(springRecords.length, fallRecords.length));
  }

  async function loadFrostHistory() {
    try {
      setHistoryLoading(true);
      const res = await fetch("/api/frost-history");
      if (res.ok) {
        const data = await res.json();
        setFrostHistory(data);
        return data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load frost history:", e);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }

  async function deleteHistoryYear(year: number) {
    try {
      await fetch(`/api/frost-history?year=${year}`, { method: "DELETE" });
      const newHistory = frostHistory.filter(h => h.year !== year);
      setFrostHistory(newHistory);
      if (newHistory.length > 0) {
        calculateAndApplyAverageFrostDates(newHistory);
      } else {
        setAverageYearsCount(null);
      }
    } catch (e) {
      console.error("Failed to delete history:", e);
    }
  }

  // NOAA historical frost lookup
  async function lookupNoaaFrost() {
    setNoaaLookupError("");
    setNoaaLookupResult(null);

    if (!noaaLookupZip || !/^\d{5}$/.test(noaaLookupZip)) {
      setNoaaLookupError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    try {
      setNoaaLookupLoading(true);
      const res = await fetch(`/api/noaa-frost-lookup?zip=${noaaLookupZip}&year=${noaaLookupYear}`);
      const data = await res.json();

      if (!res.ok) {
        setNoaaLookupError(data.error || "Lookup failed. Try a different ZIP or year.");
        return;
      }

      setNoaaLookupResult({
        lastSpringFrost: data.lastSpringFrost,
        firstFallFrost: data.firstFallFrost,
        station: data.station,
        recordCount: data.recordCount,
        isNearbyStation: data.isNearbyStation,
        distanceMiles: data.distanceMiles,
      });
    } catch {
      setNoaaLookupError("Lookup failed. Please try again.");
    } finally {
      setNoaaLookupLoading(false);
    }
  }

  // Save NOAA lookup result to history
  async function saveNoaaResultToHistory() {
    if (!noaaLookupResult) return;

    try {
      await fetch("/api/frost-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: noaaLookupYear,
          actualLastSpringFrost: noaaLookupResult.lastSpringFrost || null,
          actualFirstFallFrost: noaaLookupResult.firstFallFrost || null,
          notes: `Data from NOAA station: ${noaaLookupResult.station.name}`,
        }),
      });
      const historyData = await loadFrostHistory();
      calculateAndApplyAverageFrostDates(historyData);
      setNoaaLookupResult(null);
      setNoaaLookupError("");
    } catch {
      setNoaaLookupError("Failed to save to history.");
    }
  }

  // Auto-fetch up to 10 years of NOAA data
  async function autoFetchNoaaHistory(zip: string, existingYears: number[]) {
    const currentYear = new Date().getFullYear();
    const yearsToFetch: number[] = [];

    for (let year = currentYear - 1; year >= currentYear - 15 && yearsToFetch.length < 10; year--) {
      if (!existingYears.includes(year)) {
        yearsToFetch.push(year);
      }
    }

    if (yearsToFetch.length === 0) {
      setAutoFetchComplete(true);
      return;
    }

    setAutoFetchProgress({ current: 0, total: yearsToFetch.length });
    let successCount = 0;

    for (let i = 0; i < yearsToFetch.length; i++) {
      const year = yearsToFetch[i];
      setAutoFetchProgress({ current: i + 1, total: yearsToFetch.length });

      try {
        const res = await fetch(`/api/noaa-frost-lookup?zip=${zip}&year=${year}`);
        if (res.ok) {
          const data = await res.json();

          if (data.lastSpringFrost || data.firstFallFrost) {
            await fetch("/api/frost-history", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                year,
                actualLastSpringFrost: data.lastSpringFrost || null,
                actualFirstFallFrost: data.firstFallFrost || null,
                notes: `Data from NOAA station: ${data.station.name}${data.isNearbyStation ? ` (nearby, ~${data.distanceMiles || "?"}mi)` : ""}`,
              }),
            });
            successCount++;
          }
        }
      } catch {
        // Continue with next year on error
      }

      if (i < yearsToFetch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setAutoFetchProgress(null);
    setAutoFetchComplete(true);

    // Refresh history and calculate averages
    const historyData = await loadFrostHistory();
    if (historyData.length > 0) {
      calculateAndApplyAverageFrostDates(historyData);
    }
  }

  async function lookupByZip() {
    setExpectedMessage("");

    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      setExpectedMessage("Please enter a valid 5-digit ZIP code.");
      return;
    }

    try {
      setLookingUp(true);
      const res = await fetch(`/api/lookup-zone?zip=${zipCode}`);
      const data = await res.json();

      if (!res.ok) {
        setExpectedMessage(data.error || "Lookup failed. Please try a different ZIP code.");
        return;
      }

      setZone(data.zone);
      setLastSpringFrost(data.lastSpringFrost);
      setFirstFallFrost(data.firstFallFrost);
      setExpectedMessage(`Found zone ${data.zone} for ZIP ${zipCode}. Verify and adjust if needed.`);
    } catch {
      setExpectedMessage("Failed to lookup zone information. Please try again.");
    } finally {
      setLookingUp(false);
    }
  }

  async function saveExpected() {
    setExpectedMessage("");

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zone,
        zip: zipCode || null,
        lastSpringFrost,
        firstFallFrost,
      }),
    });

    if (!res.ok) {
      const responseText = await res.text();
      const errorData = responseText ? JSON.parse(responseText) : {};
      setExpectedMessage(`Save failed: ${errorData.error || res.status}`);
      return;
    }

    // Update saved zip and NOAA lookup zip
    if (zipCode) {
      setSavedZip(zipCode);
      setNoaaLookupZip(zipCode);
      setAutoFetchComplete(false);
      setAutoFetchProgress(null);

      // Load existing history then fetch more
      const historyData = await loadFrostHistory();
      const existingYears = historyData.map((h: FrostHistoryRecord) => h.year);
      if (historyData.length > 0) {
        calculateAndApplyAverageFrostDates(historyData);
      }

      // Start auto-fetch
      autoFetchNoaaHistory(zipCode, existingYears);
    }
    setExpectedMessage("Saved!");
  }

  if (loading) return <p className="text-sm text-slate-600">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 border border-slate-200 p-6">
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
              Location Data
            </h1>
            <p className="text-slate-700 text-sm mt-1">
              Frost dates drive seed starting and planting timing. Zone is optional.
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Expected Frost Dates */}
        <div className={`${ui.card} ${ui.cardPad} space-y-4`}>
          <div>
            <h2 className="text-base font-semibold">Expected Frost Dates</h2>
            <p className="text-sm text-slate-600">Regional averages used for scheduling</p>
          </div>

          {/* Saved ZIP Display */}
          {savedZip && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-green-100 text-green-700 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Your Location</p>
                  <p className="text-lg font-bold text-green-900">ZIP {savedZip}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSavedZip("");
                  setZipCode("");
                }}
                className="text-xs text-green-600 hover:text-green-800 hover:bg-green-100 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
          )}

          {/* ZIP Code Lookup - only show when no ZIP is saved */}
          {!savedZip && (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-blue-900">Quick Setup</p>
                  <p className="text-xs text-blue-700 mt-1">Enter your ZIP code to auto-fill zone and frost dates</p>
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
                      placeholder="ZIP code (e.g., 90210)"
                      maxLength={5}
                    />
                  </div>
                  <button
                    className={`${ui.btn} ${ui.btnPrimary} whitespace-nowrap`}
                    onClick={lookupByZip}
                    disabled={lookingUp}
                  >
                    {lookingUp ? "..." : "Auto-fill"}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500 mb-3">Or enter manually:</p>
              </div>
            </>
          )}

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">USDA Hardiness Zone (optional)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="e.g., 6a, 7b, 8a"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Last spring frost date</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="date"
              value={lastSpringFrost}
              onChange={(e) => {
                setLastSpringFrost(e.target.value);
                setAverageYearsCount(null);
              }}
            />
            {averageYearsCount ? (
              <span className="text-xs text-cyan-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Average over {averageYearsCount} year{averageYearsCount > 1 ? "s" : ""} from NOAA
              </span>
            ) : (
              <span className="text-xs text-slate-500">Average date of last frost in spring</span>
            )}
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">First fall frost date</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="date"
              value={firstFallFrost}
              onChange={(e) => {
                setFirstFallFrost(e.target.value);
                setAverageYearsCount(null);
              }}
            />
            {averageYearsCount ? (
              <span className="text-xs text-cyan-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Average over {averageYearsCount} year{averageYearsCount > 1 ? "s" : ""} from NOAA
              </span>
            ) : (
              <span className="text-xs text-slate-500">Average date of first frost in fall</span>
            )}
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              className={`${ui.btn} ${ui.btnPrimary}`}
              onClick={saveExpected}
            >
              Save
            </button>
            {expectedMessage && (
              <div className={`rounded-lg border px-3 py-2 text-sm ${
                expectedMessage.includes("Saved") || expectedMessage.includes("Found")
                  ? "border-green-200 bg-green-50 text-green-800"
                  : expectedMessage.includes("failed") || expectedMessage.includes("Failed")
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}>
                {expectedMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: NOAA Historical Data */}
        <div className={`${ui.card} ${ui.cardPad} space-y-4`}>
          <div>
            <h2 className="text-base font-semibold">NOAA Historical Data</h2>
            <p className="text-sm text-slate-600">Frost dates from nearby weather stations</p>
          </div>

          {/* Auto-fetch progress */}
          {autoFetchProgress && (
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-cyan-600 border-t-transparent rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cyan-800">
                  Loading historical data from NOAA...
                </p>
                <p className="text-xs text-cyan-600">
                  Year {autoFetchProgress.current} of {autoFetchProgress.total}
                </p>
              </div>
            </div>
          )}

          {autoFetchComplete && !autoFetchProgress && frostHistory.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-800">Historical frost data loaded from NOAA</p>
            </div>
          )}

          {/* NOAA Lookup Section */}
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-cyan-900 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Lookup Historical Frost Dates
              </p>
              <p className="text-xs text-cyan-700 mt-1">Search NOAA weather records for actual frost dates</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                className="flex-1 min-w-[100px] rounded border px-3 py-2 text-sm"
                value={noaaLookupZip}
                onChange={(e) => setNoaaLookupZip(e.target.value)}
                placeholder="ZIP code"
                maxLength={5}
              />
              <select
                className="rounded border px-3 py-2 text-sm bg-white"
                value={noaaLookupYear}
                onChange={(e) => setNoaaLookupYear(parseInt(e.target.value, 10))}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 1 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                className={`${ui.btn} ${ui.btnPrimary} whitespace-nowrap`}
                onClick={lookupNoaaFrost}
                disabled={noaaLookupLoading}
              >
                {noaaLookupLoading ? "Searching..." : "Search Year"}
              </button>
              <button
                className={`${ui.btn} bg-cyan-600 hover:bg-cyan-700 text-white whitespace-nowrap`}
                onClick={() => {
                  if (noaaLookupZip && /^\d{5}$/.test(noaaLookupZip)) {
                    const existingYears = frostHistory.map(h => h.year);
                    autoFetchNoaaHistory(noaaLookupZip, existingYears);
                  } else {
                    setNoaaLookupError("Please enter a valid 5-digit ZIP code.");
                  }
                }}
                disabled={!!autoFetchProgress}
              >
                {autoFetchProgress ? "Fetching..." : "Fetch All Years"}
              </button>
            </div>

            {noaaLookupError && (
              <p className="text-sm text-rose-600">{noaaLookupError}</p>
            )}

            {noaaLookupResult && (
              <div className="rounded-lg border border-cyan-300 bg-white p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-cyan-900">
                    Results for {noaaLookupYear}
                  </p>
                  <p className="text-xs text-cyan-600">
                    {noaaLookupResult.recordCount} days of data
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Last Spring Frost</p>
                    {noaaLookupResult.lastSpringFrost ? (
                      <p className="font-medium text-slate-800">
                        {new Date(noaaLookupResult.lastSpringFrost + "T12:00:00").toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric'
                        })}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">No freeze recorded</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">First Fall Frost</p>
                    {noaaLookupResult.firstFallFrost ? (
                      <p className="font-medium text-slate-800">
                        {new Date(noaaLookupResult.firstFallFrost + "T12:00:00").toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric'
                        })}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">No freeze recorded</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Station: {noaaLookupResult.station.name}
                  {noaaLookupResult.isNearbyStation && (
                    <span className="ml-1 text-amber-600">
                      (nearby station{noaaLookupResult.distanceMiles ? `, ~${noaaLookupResult.distanceMiles} mi away` : ""})
                    </span>
                  )}
                </p>

                <button
                  className={`${ui.btn} bg-cyan-600 hover:bg-cyan-700 text-white text-sm`}
                  onClick={saveNoaaResultToHistory}
                >
                  Save to History
                </button>
              </div>
            )}
          </div>

          {/* History List */}
          {historyLoading ? (
            <p className="text-sm text-slate-500">Loading history...</p>
          ) : frostHistory.length === 0 ? (
            <div className="text-center py-6">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-sm text-slate-500">No frost date history yet</p>
              <p className="text-xs text-slate-400 mt-1">Enter your ZIP and save to fetch NOAA data</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {frostHistory.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-slate-700 w-12">{record.year}</span>
                    <div className="text-sm">
                      <span className="text-slate-500">Spring:</span>{" "}
                      <span className="font-medium">
                        {record.actualLastSpringFrost
                          ? new Date(record.actualLastSpringFrost).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : "—"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Fall:</span>{" "}
                      <span className="font-medium">
                        {record.actualFirstFallFrost
                          ? new Date(record.actualFirstFallFrost).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHistoryYear(record.year)}
                    className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
