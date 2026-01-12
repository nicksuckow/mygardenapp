"use client";

import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";

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

  // ✅ NEW (supports fractions via Prisma Float)
  plantingDepthInches: number | null;

  notes: string | null;
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

  async function load() {
    try {
      setMessage("");

      // ✅ Absolute URL prevents “string did not match expected pattern” issues in some setups
      const url = new URL("/api/plants", window.location.origin);

      const res = await fetch(url.toString(), { method: "GET" });
      const parsed = await safeJsonFromResponse(res);

      if (!parsed.ok) {
        console.error("LOAD /api/plants failed:", parsed.status, parsed.raw || parsed.data);
        setMessage(`Failed to load plants (${parsed.status}). Check console.`);
        return;
      }

      if (!Array.isArray(parsed.data)) {
        console.error("LOAD /api/plants returned non-array:", parsed.data, parsed.raw);
        setMessage("Failed to load plants (bad response format). Check console.");
        return;
      }

      setPlants(parsed.data);
    } catch (e) {
      console.error("LOAD exception:", e);
      setMessage("Failed to load plants (network/client error). Check console.");
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
        console.error("ADD /api/plants failed:", parsed.status, parsed.raw || parsed.data);
        const err =
          (parsed.data && (parsed.data as any).error) ||
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
      console.error("ADD exception:", e);
      setMessage("Add failed (network/client error). Check console.");
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
      if (!Number.isFinite(draft.spacingInches) || draft.spacingInches < 1) {
        setMessage("Spacing must be a number ≥ 1.");
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
        console.error("SAVE failed:", parsed.status, parsed.raw || parsed.data);
        const err =
          (parsed.data && (parsed.data as any).error) ||
          (parsed.raw ? parsed.raw.slice(0, 180) : "") ||
          "Save failed.";
        setMessage(`${err} (${parsed.status})`);
        return;
      }

      cancelEdit();
      await load();
      setMessage("Saved!");
    } catch (e) {
      console.error("SAVE exception:", e);
      setMessage("Save failed (network/client error). Check console.");
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
        console.error("DELETE failed:", parsed.status, parsed.raw || parsed.data);
        const err =
          (parsed.data && (parsed.data as any).error) ||
          (parsed.raw ? parsed.raw.slice(0, 180) : "") ||
          "Delete failed.";
        setMessage(`${err} (${parsed.status})`);
        return;
      }

      if (editingId === id) cancelEdit();
      await load();
      setMessage("Deleted.");
    } catch (e) {
      console.error("DELETE exception:", e);
      setMessage("Delete failed (network/client error). Check console.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.h1}>Plants</h1>
        <p className={ui.sub}>Add plants with timing rules (weeks relative to last frost).</p>
      </div>

      {/* Add form */}
      <div className={`${ui.card} ${ui.cardPad}`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Name *</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tomato"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Spacing (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={spacingInches}
              onChange={(e) => setSpacingInches(Number(e.target.value))}
              min={1}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Days to Maturity Min</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={dtmMin}
              onChange={(e) => setDtmMin(e.target.value === "" ? "" : Number(e.target.value))}
              min={1}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Days to Maturity Max</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={dtmMax}
              onChange={(e) => setDtmMax(e.target.value === "" ? "" : Number(e.target.value))}
              min={1}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Start indoors (weeks before last frost)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={startWeeks}
              onChange={(e) => setStartWeeks(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Transplant (weeks after last frost)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={transplantWeeks}
              onChange={(e) =>
                setTransplantWeeks(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </label>

          {/* ✅ NOW 2 columns: Direct sow (left) + Planting depth (right) */}
          <label className="grid gap-1">
            <span className="text-sm font-medium">Direct sow (weeks relative to last frost)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={directSowWeeks}
              onChange={(e) =>
                setDirectSowWeeks(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. -2 means 2 weeks before last frost"
            />
          </label>

          <label className="grid gap-1">
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
              placeholder="e.g. 0.5"
            />
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
                          <p className="text-xs text-slate-600">Spacing: {p.spacingInches}"</p>
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

                      <div className="mt-2 text-sm text-slate-700 space-y-1">
                        <p>
                          DTM: {p.daysToMaturityMin ?? "?"}
                          {p.daysToMaturityMax ? `–${p.daysToMaturityMax}` : ""}
                        </p>
                        <p>
                          Start indoors:{" "}
                          {p.startIndoorsWeeksBeforeFrost != null
                            ? `${p.startIndoorsWeeksBeforeFrost}w before frost`
                            : "—"}
                        </p>
                        <p>
                          Transplant:{" "}
                          {p.transplantWeeksAfterFrost != null
                            ? `${p.transplantWeeksAfterFrost}w after frost`
                            : "—"}
                        </p>
                        <p>
                          Direct sow:{" "}
                          {p.directSowWeeksRelativeToFrost != null
                            ? `${p.directSowWeeksRelativeToFrost}w relative`
                            : "—"}
                        </p>

                        <p>
                          Planting depth:{" "}
                          {p.plantingDepthInches != null ? `${fmtInches(p.plantingDepthInches)}"` : "—"}
                        </p>
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
                            min={1}
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
    </div>
  );
}
