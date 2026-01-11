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

  async function load() {
    const res = await fetch("/api/plants");
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

  return (
    <div className="space-y-6">
      <div>
      <h1 className={ui.h1}>Plants</h1>
              <p className="text-sm text-gray-600">
          Add plants with timing rules (weeks relative to last frost).
        </p>
      </div>

      <div className="rounded-lg border p-4">
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
            <span className="text-sm font-medium">DTM min</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={dtmMin}
              onChange={(e) =>
                setDtmMin(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={1}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">DTM max</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={dtmMax}
              onChange={(e) =>
                setDtmMax(e.target.value === "" ? "" : Number(e.target.value))
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
              value={startWeeks}
              onChange={(e) =>
                setStartWeeks(e.target.value === "" ? "" : Number(e.target.value))
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
              value={transplantWeeks}
              onChange={(e) =>
                setTransplantWeeks(e.target.value === "" ? "" : Number(e.target.value))
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
              value={directSowWeeks}
              onChange={(e) =>
                setDirectSowWeeks(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. -2 means 2 weeks before last frost"
            />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
            onClick={addPlant}
          >
            Add Plant
          </button>
          {message ? <p className="text-sm">{message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your plants</h2>

        {plants.length === 0 ? (
          <p className="text-sm text-gray-600">No plants yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plants.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-600">{p.spacingInches}"</p>
                </div>

                <div className="mt-2 text-sm text-gray-700">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
