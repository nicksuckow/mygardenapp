"use client";

import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";
import VerdantlySearchModal from "@/components/VerdantlySearchModal";

type Plant = {
  id: number;
  name: string;
  variety: string | null;
  spacingInches: number;
  daysToMaturityMin: number | null;
  daysToMaturityMax: number | null;
  startIndoorsWeeksBeforeFrost: number | null;
  transplantWeeksAfterFrost: number | null;
  directSowWeeksRelativeToFrost: number | null;
  // Full text planting instructions
  startIndoorsInstructions: string | null;
  transplantInstructions: string | null;
  directSowInstructions: string | null;

  // ✅ NEW (supports fractions via Prisma Float)
  plantingDepthInches: number | null;

  notes: string | null;

  // Trefle fields
  scientificName: string | null;
  growthForm: string | null;
  growthHabit: string | null;
  growthRate: string | null;
  averageHeightInches: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  lightRequirement: number | null;
  soilNutriments: number | null;
  soilHumidity: number | null;
  edible: boolean;
  ediblePart: string | null;

  // Growing condition fields
  cycle: string | null;
  watering: string | null;
  sunlight: string | null;
  floweringSeason: string | null;
  harvestSeason: string | null;
  careLevel: string | null;
  maintenance: string | null;
  indoor: boolean;
  droughtTolerant: boolean;
  medicinal: boolean;
  poisonousToHumans: number | null;
  poisonousToPets: number | null;
  description: string | null;

  // Pollinator and water zone fields
  attractsPollinators: boolean;
  pollinatorTypes: string | null;
  waterZone: string | null;
  sunlightZone: string | null;

  // Succession planting
  successionEnabled: boolean;
  successionIntervalDays: number | null;
  successionMaxCount: number | null;
};

type PlantDraft = {
  name: string;
  spacingInches: number;
  daysToMaturityMin: number | null;
  daysToMaturityMax: number | null;
  startIndoorsWeeksBeforeFrost: number | null;
  transplantWeeksAfterFrost: number | null;
  directSowWeeksRelativeToFrost: number | null;

  // ✅ NEW
  plantingDepthInches: number | null;

  // Pollinator and water zone fields
  attractsPollinators: boolean;
  pollinatorTypes: string | null;
  waterZone: string | null;
  sunlightZone: string | null;

  // Succession planting
  successionEnabled: boolean;
  successionIntervalDays: number | null;
  successionMaxCount: number | null;
};

function fmtInches(v: number) {
  // trims trailing zeros (0.50 -> 0.5, 1.00 -> 1)
  return Number(v.toFixed(2)).toString();
}

async function safeJsonFromResponse(res: Response) {
  const text = await res.text();
  if (!text) return { ok: res.ok, status: res.status, data: null, raw: "" };

  try {
    const data = JSON.parse(text);
    return { ok: res.ok, status: res.status, data, raw: text };
  } catch {
    // Not JSON (often HTML error page)
    return { ok: res.ok, status: res.status, data: null, raw: text };
  }
}

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [name, setName] = useState("");
  const [spacingInches, setSpacingInches] = useState(12);
  const [dtmMin, setDtmMin] = useState<number | "">("");
  const [dtmMax, setDtmMax] = useState<number | "">("");
  const [startWeeks, setStartWeeks] = useState<number | "">("");
  const [transplantWeeks, setTransplantWeeks] = useState<number | "">("");
  const [directSowWeeks, setDirectSowWeeks] = useState<number | "">("");

  // ✅ NEW
  const [plantingDepthInches, setPlantingDepthInches] = useState<number | "">("");

  // Seed tracking checkbox
  const [hasSeeds, setHasSeeds] = useState(false);

  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PlantDraft | null>(null);

  // Verdantly search modal
  const [showVerdantlyModal, setShowVerdantlyModal] = useState(false);

  // Recalculate timing state
  const [recalculating, setRecalculating] = useState(false);

  // Backfill state
  const [backfilling, setBackfilling] = useState(false);
  const [backfillStats, setBackfillStats] = useState<{
    total: number;
    needsBackfill: number;
  } | null>(null);
  const [backfillResults, setBackfillResults] = useState<{
    summary: {
      totalPlants: number;
      alreadyComplete: number;
      noNewData: number;
      updated: number;
      notFound: number;
      errors: number;
    };
    results: Array<{
      id: number;
      name: string;
      status: "updated" | "not_found" | "error";
      fieldsUpdated?: string[];
      error?: string;
      debug?: string;
    }>;
  } | null>(null);
  const [showBackfillDetails, setShowBackfillDetails] = useState(false);
  const [backfillDismissed, setBackfillDismissed] = useState(false);

  // Search and sort for plant list
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "spacing" | "dtm" | "recent">("name");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");

  // Auto-capitalize each word as user types
  function toTitleCase(text: string): string {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // Filter and sort plants
  const filteredPlants = plants
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.variety && p.variety.toLowerCase().includes(q)) ||
        (p.scientificName && p.scientificName.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "spacing":
          return (a.spacingInches ?? 0) - (b.spacingInches ?? 0);
        case "dtm":
          return (a.daysToMaturityMin ?? 999) - (b.daysToMaturityMin ?? 999);
        case "recent":
          return b.id - a.id; // Higher ID = more recently added
        default:
          return 0;
      }
    });

  async function load() {
    try {
      setMessage("");

      // ✅ Absolute URL prevents “string did not match expected pattern” issues in some setups
      const url = new URL("/api/plants", window.location.origin);

      const res = await fetch(url.toString(), { method: "GET" });
      const parsed = await safeJsonFromResponse(res);

      if (!parsed.ok) {
        setMessage(`Failed to load plants (${parsed.status}).`);
        return;
      }

      if (!Array.isArray(parsed.data)) {
        setMessage("Failed to load plants (bad response format).");
        return;
      }

      setPlants(parsed.data);
    } catch (e) {
      setMessage("Failed to load plants (network error).");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function recalculateTiming() {
    try {
      setRecalculating(true);
      setMessage("");

      const url = new URL("/api/plants/recalculate", window.location.origin);
      const res = await fetch(url.toString(), { method: "POST" });
      const parsed = await safeJsonFromResponse(res);

      if (!parsed.ok) {
        setMessage(`Recalculate failed (${parsed.status})`);
        return;
      }

      const result = parsed.data as { message: string; updated: number; details: { name: string; changes: string[] }[] };
      setMessage(result.message);

      // Reload plants to show updated data
      await load();
    } catch (e) {
      setMessage("Recalculate failed (network error).");
    } finally {
      setRecalculating(false);
    }
  }

  async function checkBackfillStatus() {
    try {
      const res = await fetch("/api/plants/backfill");
      const data = await res.json();
      if (res.ok) {
        setBackfillStats({ total: data.total, needsBackfill: data.needsBackfill });
      }
    } catch {
      // Silently fail
    }
  }

  async function runBackfill() {
    try {
      setBackfilling(true);
      setBackfillResults(null);
      setMessage("Backfilling plant data from Verdantly... This may take a moment.");

      const res = await fetch("/api/plants/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Backfill failed");
        return;
      }

      const { summary, results } = data;
      setBackfillResults({ summary, results });
      setShowBackfillDetails(true);

      if (summary.updated > 0) {
        setMessage(`Backfill complete! ${summary.updated} plant${summary.updated > 1 ? "s" : ""} updated with new data.`);
      } else if (summary.notFound > 0) {
        setMessage(`Backfill complete. No matches found in database for ${summary.notFound} plant${summary.notFound > 1 ? "s" : ""}.`);
      } else {
        setMessage("All plants already have complete data.");
      }

      // Dismiss the backfill alert after running (unless there were errors to retry)
      if (summary.errors === 0) {
        setBackfillDismissed(true);
        localStorage.setItem("backfillDismissed", "true");
      }

      // Reload plants and update stats
      await load();
    } catch (e) {
      setMessage("Backfill failed (network error).");
    } finally {
      setBackfilling(false);
    }
  }

  // Load backfill dismissed state from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem("backfillDismissed");
    if (dismissed === "true") {
      setBackfillDismissed(true);
    }
  }, []);

  // Check backfill status after initial plant load (unless dismissed)
  const [hasCheckedBackfill, setHasCheckedBackfill] = useState(false);
  useEffect(() => {
    if (plants.length > 0 && !hasCheckedBackfill && !backfillDismissed) {
      checkBackfillStatus();
      setHasCheckedBackfill(true);
    }
  }, [plants.length, hasCheckedBackfill, backfillDismissed]);

  async function addPlant() {
    try {
      setMessage("");

      if (!name.trim()) {
        setMessage("Plant name is required.");
        return;
      }

      const payload = {
        name,
        spacingInches: Number(spacingInches),
        daysToMaturityMin: dtmMin === "" ? null : Number(dtmMin),
        daysToMaturityMax: dtmMax === "" ? null : Number(dtmMax),
        startIndoorsWeeksBeforeFrost: startWeeks === "" ? null : Number(startWeeks),
        transplantWeeksAfterFrost: transplantWeeks === "" ? null : Number(transplantWeeks),
        directSowWeeksRelativeToFrost: directSowWeeks === "" ? null : Number(directSowWeeks),
        plantingDepthInches: plantingDepthInches === "" ? null : Number(plantingDepthInches),
        hasSeeds,
      };

      const url = new URL("/api/plants", window.location.origin);

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsed = await safeJsonFromResponse(res);

      if (!parsed.ok) {
        const err =
          (parsed.data && (parsed.data as Record<string, unknown>).error) ||
          (parsed.raw ? parsed.raw.slice(0, 180) : "") ||
          "Failed to add plant.";
        setMessage(`${err} (${parsed.status})`);
        return;
      }

      // reset
      setName("");
      setSpacingInches(12);
      setDtmMin("");
      setDtmMax("");
      setStartWeeks("");
      setTransplantWeeks("");
      setDirectSowWeeks("");
      setPlantingDepthInches("");
      setHasSeeds(false);

      await load();
      setMessage("Added!");

      // Clear backfill dismissed state when adding a new plant
      // so the alert can show again if the new plant needs data
      setBackfillDismissed(false);
      localStorage.removeItem("backfillDismissed");
      setHasCheckedBackfill(false); // Re-check backfill status
    } catch (e) {
      setMessage("Add failed (network error).");
    }
  }

  function startEdit(p: Plant) {
    setMessage("");
    setEditingId(p.id);
    setDraft({
      name: p.name ?? "",
      spacingInches: p.spacingInches ?? 1,
      daysToMaturityMin: p.daysToMaturityMin ?? null,
      daysToMaturityMax: p.daysToMaturityMax ?? null,
      startIndoorsWeeksBeforeFrost: p.startIndoorsWeeksBeforeFrost ?? null,
      transplantWeeksAfterFrost: p.transplantWeeksAfterFrost ?? null,
      directSowWeeksRelativeToFrost: p.directSowWeeksRelativeToFrost ?? null,

      // ✅ NEW
      plantingDepthInches: p.plantingDepthInches ?? null,

      // Pollinator and water zone fields
      attractsPollinators: p.attractsPollinators ?? false,
      pollinatorTypes: p.pollinatorTypes ?? null,
      waterZone: p.waterZone ?? null,
      sunlightZone: p.sunlightZone ?? null,

      // Succession planting
      successionEnabled: p.successionEnabled ?? false,
      successionIntervalDays: p.successionIntervalDays ?? null,
      successionMaxCount: p.successionMaxCount ?? null,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: number) {
    try {
      setMessage("");

      if (!draft) return;

      if (!draft.name.trim()) {
        setMessage("Plant name is required.");
        return;
      }
      if (!Number.isFinite(draft.spacingInches) || draft.spacingInches < 0.5) {
        setMessage("Spacing must be a number ≥ 0.5 inches.");
        return;
      }

      const url = new URL(`/api/plants/${id}`, window.location.origin);

      const res = await fetch(url.toString(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          spacingInches: draft.spacingInches,
          daysToMaturityMin: draft.daysToMaturityMin,
          daysToMaturityMax: draft.daysToMaturityMax,
          startIndoorsWeeksBeforeFrost: draft.startIndoorsWeeksBeforeFrost,
          transplantWeeksAfterFrost: draft.transplantWeeksAfterFrost,
          directSowWeeksRelativeToFrost: draft.directSowWeeksRelativeToFrost,

          // ✅ NEW
          plantingDepthInches: draft.plantingDepthInches,

          // Pollinator and water zone fields
          attractsPollinators: draft.attractsPollinators,
          pollinatorTypes: draft.pollinatorTypes,
          waterZone: draft.waterZone,

          // Succession planting
          successionEnabled: draft.successionEnabled,
          successionIntervalDays: draft.successionIntervalDays,
          successionMaxCount: draft.successionMaxCount,
        }),
      });

      const parsed = await safeJsonFromResponse(res);

      if (!parsed.ok) {
        const err =
          (parsed.data && (parsed.data as Record<string, unknown>).error) ||
          (parsed.raw ? parsed.raw.slice(0, 180) : "") ||
          "Save failed.";
        setMessage(`${err} (${parsed.status})`);
        return;
      }

      cancelEdit();
      await load();
      setMessage("Saved!");
    } catch (e) {
      setMessage("Save failed (network error).");
    }
  }

  async function deletePlant(id: number) {
    try {
      setMessage("");
      const ok = confirm("Delete this plant? This cannot be undone.");
      if (!ok) return;

      const url = new URL(`/api/plants/${id}`, window.location.origin);

      const res = await fetch(url.toString(), { method: "DELETE" });
      const parsed = await safeJsonFromResponse(res);

      if (!parsed.ok) {
        const err =
          (parsed.data && (parsed.data as Record<string, unknown>).error) ||
          (parsed.raw ? parsed.raw.slice(0, 180) : "") ||
          "Delete failed.";
        setMessage(`${err} (${parsed.status})`);
        return;
      }

      if (editingId === id) cancelEdit();
      await load();
      setMessage("Deleted.");
    } catch (e) {
      setMessage("Delete failed (network error).");
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-100 p-6">
        {/* Decorative plant in corner */}
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-32 h-32 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22V11M12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11M12 11C12 8.79086 13.7909 7 16 7C18.2091 7 20 8.79086 20 11" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-gradient-to-br from-green-400 to-emerald-500 text-white p-2.5 rounded-xl shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V11M12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11M12 11C12 8.79086 13.7909 7 16 7C18.2091 7 20 8.79086 20 11" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                🌿 Plants
              </h1>
              <p className="text-emerald-800 text-sm mt-1">
                Add plants with timing rules (weeks relative to last frost).
              </p>
            </div>
          </div>

{/* Recalculate button - hidden for now, uncomment to re-enable
          <button
            className={`${ui.btn} ${ui.btnSecondary} text-xs`}
            onClick={recalculateTiming}
            disabled={recalculating}
            title="Re-parse timing data from plant instructions"
          >
            {recalculating ? "Updating..." : "🔄 Recalculate Timing"}
          </button>
*/}
        </div>
      </div>

      {/* Backfill Results */}
      {backfillResults && showBackfillDetails && (
        <div className="rounded-lg border-2 border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Backfill Results</h3>
            <button
              onClick={() => setShowBackfillDetails(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {backfillResults.summary.updated > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {backfillResults.summary.updated} updated
              </span>
            )}
            {backfillResults.summary.alreadyComplete > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {backfillResults.summary.alreadyComplete} already complete
              </span>
            )}
            {backfillResults.summary.noNewData > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {backfillResults.summary.noNewData} no data available
              </span>
            )}
            {backfillResults.summary.notFound > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                {backfillResults.summary.notFound} not found
              </span>
            )}
            {backfillResults.summary.errors > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {backfillResults.summary.errors} errors
              </span>
            )}
          </div>

          {/* Detailed results - only shows updated, not_found, and errors */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {backfillResults.results.map((result) => (
                <div
                  key={result.id}
                  className={`text-sm p-2 rounded ${
                    result.status === "updated"
                      ? "bg-green-50 border border-green-200"
                      : result.status === "error"
                      ? "bg-red-50 border border-red-200"
                      : "bg-amber-50 border border-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.status === "updated" && (
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {result.status === "not_found" && (
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {result.status === "error" && (
                      <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  {result.status === "updated" && (
                    <div className="text-xs text-green-700 mt-1 ml-6">
                      {result.fieldsUpdated && <p>Updated: {result.fieldsUpdated.join(", ")}</p>}
                      {result.debug && <p className="text-green-600 mt-0.5 font-mono text-[10px]">{result.debug}</p>}
                    </div>
                  )}
                  {result.status === "not_found" && (
                    <div className="text-xs text-amber-700 mt-1 ml-6">
                      <p>No match found in Verdantly database</p>
                      {result.debug && (
                        <p className="text-amber-600 mt-0.5 font-mono text-[10px]">{result.debug}</p>
                      )}
                    </div>
                  )}
                  {result.status === "error" && result.error && (
                    <p className="text-xs text-red-700 mt-1 ml-6">
                      {result.error}
                    </p>
                  )}
                </div>
              ))}
            {backfillResults.results.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                All plants already have complete data - nothing to update.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add form */}
      <div className={`${ui.card} ${ui.cardPad} space-y-4`}>
        <div>
          <h2 className="text-base font-semibold">Add a New Plant</h2>
          <p className="text-sm text-slate-600">Search the Verdantly database first, or manually enter plant details below</p>
        </div>

        {/* Verdantly Search - Primary Action */}
        <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-emerald-900 mb-1">Search Plant Database</h3>
              <p className="text-sm text-emerald-800 mb-3">
                Find pre-filled plant data including timing, spacing, and growing requirements
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`${ui.btn} ${ui.btnPrimary}`}
                  type="button"
                  onClick={() => setShowVerdantlyModal(true)}
                >
                  <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Verdantly
                </button>
                {backfillStats && backfillStats.needsBackfill > 0 && !backfillDismissed && (
                  <button
                    className={`${ui.btn} bg-amber-600 hover:bg-amber-700 text-white`}
                    type="button"
                    onClick={runBackfill}
                    disabled={backfilling}
                    title={`${backfillStats.needsBackfill} plants have incomplete data`}
                  >
                    {backfilling ? (
                      <>
                        <svg className="animate-spin w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Backfilling...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Auto-Fill ({backfillStats.needsBackfill})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Or divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or enter manually</span>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Basic Information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Name *</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(toTitleCase(e.target.value))}
                placeholder="e.g., Tomato, Lettuce"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Spacing (inches)</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="number"
                value={spacingInches}
                onChange={(e) => setSpacingInches(Number(e.target.value))}
                min={0.5}
                step={0.5}
              />
              <span className="text-xs text-slate-500">Distance between plants in your bed</span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Planting Depth (inches)</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="number"
                value={plantingDepthInches}
                onChange={(e) =>
                  setPlantingDepthInches(e.target.value === "" ? "" : Number(e.target.value))
                }
                min={0}
                step={0.25}
                placeholder="e.g., 0.5 or 1"
              />
              <span className="text-xs text-slate-500">How deep to plant seeds or transplants</span>
            </label>
          </div>
        </div>

        {/* Timing Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Timing & Maturity</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Days to Maturity Min</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="number"
                value={dtmMin}
                onChange={(e) => setDtmMin(e.target.value === "" ? "" : Number(e.target.value))}
                min={1}
                placeholder="e.g., 60"
              />
              <span className="text-xs text-slate-500">Earliest days from planting to harvest</span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Days to Maturity Max</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="number"
                value={dtmMax}
                onChange={(e) => setDtmMax(e.target.value === "" ? "" : Number(e.target.value))}
                min={1}
                placeholder="e.g., 80"
              />
              <span className="text-xs text-slate-500">Latest days from planting to harvest</span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Start indoors (weeks before last frost)</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="number"
                value={startWeeks}
                onChange={(e) => setStartWeeks(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g., 6"
              />
              <span className="text-xs text-slate-500">When to start seeds indoors before frost date</span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Transplant (weeks after last frost)</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="number"
                value={transplantWeeks}
                onChange={(e) =>
                  setTransplantWeeks(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g., 2"
              />
              <span className="text-xs text-slate-500">When to transplant outside after frost date</span>
            </label>

            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Direct sow (weeks relative to last frost)</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="number"
                value={directSowWeeks}
                onChange={(e) =>
                  setDirectSowWeeks(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g., -2 for 2 weeks before frost, or 1 for 1 week after"
              />
              <span className="text-xs text-slate-500">
                Negative = weeks before frost, Positive = weeks after frost
              </span>
            </label>
          </div>

          {/* Validation warnings */}
          {dtmMin !== "" && dtmMax !== "" && Number(dtmMax) < Number(dtmMin) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Warning: Maximum days to maturity should be greater than or equal to minimum
            </div>
          )}
        </div>

        {/* Seed Inventory Checkbox */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSeeds}
              onChange={(e) => setHasSeeds(e.target.checked)}
              className="mt-1 rounded border-amber-300"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-amber-900">I already have seeds for this plant</span>
              <p className="text-xs text-amber-700 mt-0.5">
                Track this in your seed inventory
              </p>
            </div>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button className={`${ui.btn} ${ui.btnPrimary}`} type="button" onClick={addPlant}>
            Add Plant
          </button>

          {message ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </div>
          ) : null}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your plants</h2>
            {plants.length > 0 && (
              <p className="text-xs text-slate-500">
                {filteredPlants.length === plants.length
                  ? `${plants.length} plant${plants.length !== 1 ? "s" : ""}`
                  : `Showing ${filteredPlants.length} of ${plants.length}`}
              </p>
            )}
          </div>

          {plants.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search plants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 pl-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="name">Sort: A-Z</option>
                <option value="spacing">Sort: Spacing</option>
                <option value="dtm">Sort: Days to Maturity</option>
                <option value="recent">Sort: Recently Added</option>
              </select>

              {/* View Toggle */}
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-2.5 py-1 rounded-md text-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-2.5 py-1 rounded-md text-sm transition-colors ${
                    viewMode === "cards"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Card view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {plants.length === 0 ? (
          <p className={ui.sub}>No plants yet.</p>
        ) : filteredPlants.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-slate-600">No plants match "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              Clear search
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* Compact List View */
          <div className={`${ui.card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Plant</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">Spacing</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">DTM</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Start Indoors</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlants.map((p) => {
                    const isEditing = editingId === p.id;

                    if (isEditing) {
                      return (
                        <tr key={p.id} className="bg-amber-50">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-amber-800">Editing {p.name}</span>
                                <div className="flex gap-2">
                                  <button
                                    className={`${ui.btn} ${ui.btnPrimary} py-1 text-xs`}
                                    onClick={() => saveEdit(p.id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className={`${ui.btn} ${ui.btnSecondary} py-1 text-xs`}
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-4">
                                <label className="grid gap-1">
                                  <span className="text-xs font-medium">Name</span>
                                  <input
                                    className="rounded border px-2 py-1 text-sm"
                                    value={draft?.name ?? ""}
                                    onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                                  />
                                </label>
                                <label className="grid gap-1">
                                  <span className="text-xs font-medium">Spacing (in)</span>
                                  <input
                                    className="rounded border px-2 py-1 text-sm"
                                    type="number"
                                    value={draft?.spacingInches ?? 12}
                                    onChange={(e) => setDraft((d) => d ? { ...d, spacingInches: Number(e.target.value) } : d)}
                                  />
                                </label>
                                <label className="grid gap-1">
                                  <span className="text-xs font-medium">DTM Min</span>
                                  <input
                                    className="rounded border px-2 py-1 text-sm"
                                    type="number"
                                    value={draft?.daysToMaturityMin ?? ""}
                                    onChange={(e) => setDraft((d) => d ? { ...d, daysToMaturityMin: e.target.value === "" ? null : Number(e.target.value) } : d)}
                                  />
                                </label>
                                <label className="grid gap-1">
                                  <span className="text-xs font-medium">DTM Max</span>
                                  <input
                                    className="rounded border px-2 py-1 text-sm"
                                    type="number"
                                    value={draft?.daysToMaturityMax ?? ""}
                                    onChange={(e) => setDraft((d) => d ? { ...d, daysToMaturityMax: e.target.value === "" ? null : Number(e.target.value) } : d)}
                                  />
                                </label>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{p.name}</p>
                            {p.variety && <p className="text-xs text-slate-500">{p.variety}</p>}
                            {/* Mobile-only stats */}
                            <div className="sm:hidden mt-1 flex gap-2 text-xs text-slate-500">
                              <span>{p.spacingInches}"</span>
                              {p.daysToMaturityMin && (
                                <span>• {p.daysToMaturityMin}{p.daysToMaturityMax ? `-${p.daysToMaturityMax}` : ""} days</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="text-slate-700">{p.spacingInches}"</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          {p.daysToMaturityMin ? (
                            <span className="text-slate-700">
                              {p.daysToMaturityMin}{p.daysToMaturityMax ? `–${p.daysToMaturityMax}` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          {p.startIndoorsWeeksBeforeFrost ? (
                            <span className="text-slate-700">{p.startIndoorsWeeksBeforeFrost}w before</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              className="px-2 py-1 text-xs text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              onClick={() => startEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-2 py-1 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              onClick={() => deletePlant(p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredPlants.map((p) => {
              const isEditing = editingId === p.id;

              return (
                <div key={p.id} className={`${ui.card} p-3`}>
                  {!isEditing ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.variety && (
                            <p className="text-xs text-slate-600">{p.variety}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            className={`${ui.btn} ${ui.btnSecondary} py-1`}
                            type="button"
                            onClick={() => startEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            className={`${ui.btn} ${ui.btnDanger} py-1`}
                            type="button"
                            onClick={() => deletePlant(p.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 space-y-2">
                        {/* Scientific Name */}
                        {p.scientificName && (
                          <p className="text-xs italic text-slate-600">{p.scientificName}</p>
                        )}

                        {/* Badges for key properties */}
                        <div className="flex flex-wrap gap-1">
                          {p.cycle && (
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {p.cycle}
                            </span>
                          )}
                          {p.edible && (
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Edible{p.ediblePart ? `: ${p.ediblePart}` : ""}
                            </span>
                          )}
                          {p.careLevel && (
                            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                              {p.careLevel} care
                            </span>
                          )}
                          {p.droughtTolerant && (
                            <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                              Drought tolerant
                            </span>
                          )}
                          {p.attractsPollinators && (
                            <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              🐝 Pollinators{p.pollinatorTypes ? `: ${p.pollinatorTypes}` : ""}
                            </span>
                          )}
                          {p.waterZone && (
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                              p.waterZone === "high"
                                ? "bg-blue-100 text-blue-700"
                                : p.waterZone === "medium"
                                ? "bg-cyan-100 text-cyan-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              💧 {p.waterZone} water
                            </span>
                          )}
                          {p.sunlightZone && (
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                              p.sunlightZone === "full"
                                ? "bg-amber-100 text-amber-700"
                                : p.sunlightZone === "partial"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              ☀️ {p.sunlightZone} sun
                            </span>
                          )}
                          {p.averageHeightInches && (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              📏 {Math.round(p.averageHeightInches)}&quot; tall
                            </span>
                          )}
                          {(p.poisonousToHumans === 1 || p.poisonousToPets === 1) && (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              ⚠️ {p.poisonousToHumans === 1 && "Toxic to humans"} {p.poisonousToPets === 1 && "Toxic to pets"}
                            </span>
                          )}
                          {p.successionEnabled && (
                            <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                              🔄 Succession{p.successionIntervalDays ? ` (${p.successionIntervalDays}d)` : ""}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {p.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                        )}

                        {/* Growing Info */}
                        <div className="text-xs text-slate-700 space-y-1">
                          <p>
                            Spacing: {p.spacingInches}"
                            {p.averageHeightInches && ` • Height: ${Math.round(p.averageHeightInches)}"`}
                            {p.plantingDepthInches != null && ` • Depth: ${fmtInches(p.plantingDepthInches)}"`}
                          </p>
                          {(p.watering || p.sunlight) && (
                            <p>
                              {p.watering && `💧 ${p.watering}`}
                              {p.watering && p.sunlight && " • "}
                              {p.sunlight && `☀️ ${p.sunlight}`}
                            </p>
                          )}
                          {(p.floweringSeason || p.harvestSeason) && (
                            <p>
                              {p.floweringSeason && `🌸 Flowers: ${p.floweringSeason}`}
                              {p.floweringSeason && p.harvestSeason && " • "}
                              {p.harvestSeason && `🌾 Harvest: ${p.harvestSeason}`}
                            </p>
                          )}
                          {(p.growthForm || p.growthHabit || p.growthRate || p.maintenance) && (
                            <p className="text-slate-600">
                              {[p.growthForm, p.growthHabit, p.growthRate, p.maintenance].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </div>

                        {/* Expandable Details */}
                        <details className="text-xs">
                          <summary className="cursor-pointer text-slate-600 hover:text-slate-900 font-medium">
                            More details
                          </summary>
                          <div className="mt-2 ml-2 space-y-1 text-slate-700">
                            <p>
                              DTM: {p.daysToMaturityMin ?? "?"}
                              {p.daysToMaturityMax ? `–${p.daysToMaturityMax}` : ""} days
                            </p>
                            {(p.minTemperatureC != null || p.maxTemperatureC != null) && (
                              <p>
                                Temp: {p.minTemperatureC != null ? `${Math.round(p.minTemperatureC * 9/5 + 32)}°F` : "?"}
                                {" – "}
                                {p.maxTemperatureC != null ? `${Math.round(p.maxTemperatureC * 9/5 + 32)}°F` : "?"}
                              </p>
                            )}
                            {(p.lightRequirement != null || p.soilHumidity != null) && (
                              <p>
                                {p.lightRequirement != null && `Light: ${p.lightRequirement}/10 `}
                                {p.lightRequirement != null && p.soilHumidity != null && "• "}
                                {p.soilHumidity != null && `Moisture: ${p.soilHumidity}/10`}
                              </p>
                            )}
                            <details className="mt-1">
                              <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
                                Planting schedule
                              </summary>
                              <div className="mt-1 ml-2 space-y-1">
                                <p>
                                  <span className="font-medium">Start indoors:</span>{" "}
                                  {p.startIndoorsInstructions ||
                                    (p.startIndoorsWeeksBeforeFrost != null
                                      ? `${p.startIndoorsWeeksBeforeFrost}w before frost`
                                      : "—")}
                                </p>
                                <p>
                                  <span className="font-medium">Transplant:</span>{" "}
                                  {p.transplantInstructions ||
                                    (p.transplantWeeksAfterFrost != null
                                      ? `${p.transplantWeeksAfterFrost}w after frost`
                                      : "—")}
                                </p>
                                <p>
                                  <span className="font-medium">Direct sow:</span>{" "}
                                  {p.directSowInstructions ||
                                    (p.directSowWeeksRelativeToFrost != null
                                      ? `${p.directSowWeeksRelativeToFrost}w relative`
                                      : "—")}
                                </p>
                              </div>
                            </details>
                            {p.notes && (
                              <p className="mt-1 text-slate-600 whitespace-pre-line">{p.notes}</p>
                            )}
                          </div>
                        </details>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">Edit plant</p>
                        <div className="flex gap-2">
                          <button
                            className={`${ui.btn} ${ui.btnPrimary} py-1`}
                            type="button"
                            onClick={() => saveEdit(p.id)}
                          >
                            Save
                          </button>
                          <button
                            className={`${ui.btn} ${ui.btnSecondary} py-1`}
                            type="button"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Name *</span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            value={draft?.name ?? ""}
                            onChange={(e) =>
                              setDraft((d) => (d ? { ...d, name: e.target.value } : d))
                            }
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Spacing (inches)</span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            type="number"
                            value={draft?.spacingInches ?? 12}
                            onChange={(e) =>
                              setDraft((d) =>
                                d ? { ...d, spacingInches: Number(e.target.value) } : d
                              )
                            }
                            min={0.5}
                            step={0.5}
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Days to Maturity Min</span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            type="number"
                            value={draft?.daysToMaturityMin ?? ""}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      daysToMaturityMin:
                                        e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : d
                              )
                            }
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Days to Maturity Max</span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            type="number"
                            value={draft?.daysToMaturityMax ?? ""}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      daysToMaturityMax:
                                        e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : d
                              )
                            }
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">
                            Start indoors (weeks before last frost)
                          </span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            type="number"
                            value={draft?.startIndoorsWeeksBeforeFrost ?? ""}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      startIndoorsWeeksBeforeFrost:
                                        e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : d
                              )
                            }
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">
                            Transplant (weeks after last frost)
                          </span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            type="number"
                            value={draft?.transplantWeeksAfterFrost ?? ""}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      transplantWeeksAfterFrost:
                                        e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : d
                              )
                            }
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">
                            Direct sow (weeks relative to last frost)
                          </span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            type="number"
                            value={draft?.directSowWeeksRelativeToFrost ?? ""}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      directSowWeeksRelativeToFrost:
                                        e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : d
                              )
                            }
                            placeholder="e.g. -2 means 2 weeks before last frost"
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Planting Depth (inches)</span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            type="number"
                            value={draft?.plantingDepthInches ?? ""}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      plantingDepthInches:
                                        e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : d
                              )
                            }
                            min={0}
                            step={0.25}
                            placeholder="e.g. 0.5"
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Water Needs</span>
                          <select
                            className="rounded border px-3 py-2 text-sm"
                            value={draft?.waterZone ?? ""}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? { ...d, waterZone: e.target.value || null }
                                  : d
                              )
                            }
                          >
                            <option value="">Not set</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>

                        <label className="flex items-center gap-2 sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={draft?.attractsPollinators ?? false}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? { ...d, attractsPollinators: e.target.checked }
                                  : d
                              )
                            }
                            className="rounded border-slate-300"
                          />
                          <span className="text-sm font-medium">🐝 Attracts pollinators</span>
                        </label>

                        {draft?.attractsPollinators && (
                          <label className="grid gap-1 sm:col-span-2">
                            <span className="text-sm font-medium">Pollinator Types</span>
                            <input
                              className="rounded border px-3 py-2 text-sm"
                              type="text"
                              value={draft?.pollinatorTypes ?? ""}
                              onChange={(e) =>
                                setDraft((d) =>
                                  d
                                    ? { ...d, pollinatorTypes: e.target.value || null }
                                    : d
                                )
                              }
                              placeholder="e.g. bees, butterflies, hummingbirds"
                            />
                          </label>
                        )}
                      </div>

                      {/* Succession Planting Section */}
                      <div className="pt-3 border-t border-slate-200 mt-3">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                          🔄 Succession Planting
                        </h4>
                        <label className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            checked={draft?.successionEnabled ?? false}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? { ...d, successionEnabled: e.target.checked }
                                  : d
                              )
                            }
                            className="rounded border-slate-300"
                          />
                          <span className="text-sm">Enable succession planting</span>
                        </label>

                        {draft?.successionEnabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <label className="grid gap-1">
                              <span className="text-xs text-slate-600">Days between plantings</span>
                              <input
                                type="number"
                                min="7"
                                max="60"
                                value={draft?.successionIntervalDays ?? ""}
                                onChange={(e) =>
                                  setDraft((d) =>
                                    d
                                      ? {
                                          ...d,
                                          successionIntervalDays:
                                            e.target.value === "" ? null : Number(e.target.value),
                                        }
                                      : d
                                  )
                                }
                                className="rounded border px-3 py-2 text-sm"
                                placeholder="e.g. 14"
                              />
                            </label>
                            <label className="grid gap-1">
                              <span className="text-xs text-slate-600">Max successions</span>
                              <input
                                type="number"
                                min="2"
                                max="12"
                                value={draft?.successionMaxCount ?? ""}
                                onChange={(e) =>
                                  setDraft((d) =>
                                    d
                                      ? {
                                          ...d,
                                          successionMaxCount:
                                            e.target.value === "" ? null : Number(e.target.value),
                                        }
                                      : d
                                  )
                                }
                                className="rounded border px-3 py-2 text-sm"
                                placeholder="e.g. 6"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verdantly Search Modal */}
      <VerdantlySearchModal
        isOpen={showVerdantlyModal}
        onClose={() => setShowVerdantlyModal(false)}
        onImport={() => {
          load();
          setMessage("Plant imported from Verdantly!");
          // Clear backfill dismissed state when importing a new plant
          setBackfillDismissed(false);
          localStorage.removeItem("backfillDismissed");
          setHasCheckedBackfill(false);
        }}
      />
    </div>
  );
}
