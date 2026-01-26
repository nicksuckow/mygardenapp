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
  averageHeightCm: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  lightRequirement: number | null;
  soilNutriments: number | null;
  soilHumidity: number | null;
  edible: boolean;
  ediblePart: string | null;

  // Perenual-specific fields
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

  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PlantDraft | null>(null);

  // Verdantly search modal
  const [showVerdantlyModal, setShowVerdantlyModal] = useState(false);

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

        // ✅ NEW (float)
        plantingDepthInches: plantingDepthInches === "" ? null : Number(plantingDepthInches),
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

      await load();
      setMessage("Added!");
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

        <div className="relative flex items-center gap-3">
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
      </div>

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
              <button
                className={`${ui.btn} ${ui.btnPrimary}`}
                type="button"
                onClick={() => setShowVerdantlyModal(true)}
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Verdantly Database
              </button>
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
                onChange={(e) => setName(e.target.value)}
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
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your plants</h2>

        {plants.length === 0 ? (
          <p className={ui.sub}>No plants yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plants.map((p) => {
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
                          {p.indoor && (
                            <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              Indoor
                            </span>
                          )}
                          {p.medicinal && (
                            <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                              Medicinal
                            </span>
                          )}
                          {p.droughtTolerant && (
                            <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                              Drought tolerant
                            </span>
                          )}
                          {(p.poisonousToHumans === 1 || p.poisonousToPets === 1) && (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              ⚠️ {p.poisonousToHumans === 1 && "Toxic to humans"} {p.poisonousToPets === 1 && "Toxic to pets"}
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
                            {p.averageHeightCm && ` • Height: ${Math.round(p.averageHeightCm)}cm`}
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
                          {(p.growthForm || p.growthRate || p.maintenance) && (
                            <p className="text-slate-600">
                              {[p.growthForm, p.growthRate, p.maintenance].filter(Boolean).join(" • ")}
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
        }}
      />
    </div>
  );
}
