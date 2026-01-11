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
};

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [name, setName] = useState("");
  const [spacingInches, setSpacingInches] = useState(12);
  const [dtmMin, setDtmMin] = useState<number | "">("");
  const [dtmMax, setDtmMax] = useState<number | "">("");
  const [startWeeks, setStartWeeks] = useState<number | "">("");
  const [transplantWeeks, setTransplantWeeks] = useState<number | "">("");
  const [directSowWeeks, setDirectSowWeeks] = useState<number | "">("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PlantDraft | null>(null);

  async function load() {
    const res = await fetch("/api/plants", { cache: "no-store" });
    const data = await res.json();
    setPlants(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addPlant() {
    setMessage("");
    if (!name.trim()) {
      setMessage("Plant name is required.");
      return;
    }

    const res = await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        spacingInches,
        daysToMaturityMin: dtmMin === "" ? null : dtmMin,
        daysToMaturityMax: dtmMax === "" ? null : dtmMax,
        startIndoorsWeeksBeforeFrost: startWeeks === "" ? null : startWeeks,
        transplantWeeksAfterFrost: transplantWeeks === "" ? null : transplantWeeks,
        directSowWeeksRelativeToFrost: directSowWeeks === "" ? null : directSowWeeks,
      }),
    });

    if (!res.ok) {
      setMessage("Failed to add plant.");
      return;
    }

    setName("");
    setSpacingInches(12);
    setDtmMin("");
    setDtmMax("");
    setStartWeeks("");
    setTransplantWeeks("");
    setDirectSowWeeks("");
    await load();
    setMessage("Added!");
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
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: number) {
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

    const res = await fetch(`/api/plants/${id}`, {
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
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      try {
        const j = JSON.parse(text);
        setMessage(j?.error ?? `Save failed (${res.status})`);
      } catch {
        setMessage(`Save failed (${res.status})`);
      }
      return;
    }

    cancelEdit();
    await load();
    setMessage("Saved!");
  }

  async function deletePlant(id: number) {
    setMessage("");
    const ok = confirm("Delete this plant? This cannot be undone.");
    if (!ok) return;

    const res = await fetch(`/api/plants/${id}`, { method: "DELETE" });
    const text = await res.text();

    if (!res.ok) {
      try {
        const j = JSON.parse(text);
        setMessage(j?.error ?? `Delete failed (${res.status})`);
      } catch {
        setMessage(`Delete failed (${res.status})`);
      }
      return;
    }

    if (editingId === id) cancelEdit();
    await load();
    setMessage("Deleted.");
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

          <label className="grid gap-1 sm:col-span-2">
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
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={addPlant}>
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
                            onClick={() => startEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            className={`${ui.btn} ${ui.btnDanger} py-1`}
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
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">Edit plant</p>
                        <div className="flex gap-2">
                          <button
                            className={`${ui.btn} ${ui.btnPrimary} py-1`}
                            onClick={() => saveEdit(p.id)}
                          >
                            Save
                          </button>
                          <button
                            className={`${ui.btn} ${ui.btnSecondary} py-1`}
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
                              setDraft((d) =>
                                d ? { ...d, name: e.target.value } : d
                              )
                            }
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Spacing (inches)</span>
                          <input
                            className="rounded border px-3 py-2 text-sm"
                            type="number"
                            min={1}
                            value={draft?.spacingInches ?? 1}
                            onChange={(e) =>
                              setDraft((d) =>
                                d ? { ...d, spacingInches: Number(e.target.value) } : d
                              )
                            }
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
                            min={1}
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
                            min={1}
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

                        <label className="grid gap-1 sm:col-span-2">
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
                      </div>

                      <div className="text-xs text-slate-500">
                        Tip: If you’re not sure, it’s okay to leave timing fields blank.
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
