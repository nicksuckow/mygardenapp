"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Plant = {
  id: number;
  name: string;
  spacingInches: number;
};

type Placement = {
  id: number;
  x: number;
  y: number;
  plant: Plant;
};

type Bed = {
  id: number;
  name: string;
  widthInches: number;
  heightInches: number;
  cellInches: number;
  placements: Placement[];
};

export default function BedLayoutClient({ bedId }: { bedId: number }) {
  const [bed, setBed] = useState<Bed | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function loadBed() {
    const res = await fetch(`/api/beds/${bedId}`);
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to load bed (${res.status}): ${text}`);
    setBed(text ? JSON.parse(text) : null);
  }

  async function loadPlants() {
    const res = await fetch(`/api/plants`);
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to load plants (${res.status}): ${text}`);
    const data: Plant[] = text ? JSON.parse(text) : [];
    setPlants(data);
    if (data.length > 0 && selectedPlantId == null) setSelectedPlantId(data[0].id);
  }

  async function refresh() {
    setMessage("");
    try {
      await Promise.all([loadBed(), loadPlants()]);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "Failed to load.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bedId]);

  const cols = useMemo(() => {
    if (!bed) return 0;
    return Math.max(1, Math.floor(bed.widthInches / bed.cellInches));
  }, [bed]);

  const rows = useMemo(() => {
    if (!bed) return 0;
    return Math.max(1, Math.floor(bed.heightInches / bed.cellInches));
  }, [bed]);

  const placementMap = useMemo(() => {
    const map = new Map<string, Placement>();
    if (!bed) return map;
    for (const p of bed.placements) map.set(`${p.x},${p.y}`, p);
    return map;
  }, [bed]);

  const selectedPlant = useMemo(() => {
    if (!selectedPlantId) return null;
    return plants.find((p) => p.id === selectedPlantId) ?? null;
  }, [plants, selectedPlantId]);
  
  const requiredCells = useMemo(() => {
    if (!bed || !selectedPlant) return 0;
    return Math.max(1, Math.ceil(selectedPlant.spacingInches / bed.cellInches));
  }, [bed, selectedPlant]);
  
  function isBlockedCell(x: number, y: number) {
    if (!bed || !selectedPlant) return false;
  
    // Check against all placements EXCEPT anything in the same cell (since we can replace)
    for (const plc of bed.placements) {
      if (plc.x === x && plc.y === y) continue;
  
      const dx = Math.abs(plc.x - x);
      const dy = Math.abs(plc.y - y);
  
      // simple square-radius rule (matches server)
      if (dx < requiredCells && dy < requiredCells) return true;
    }
  
    return false;
  }
  
  async function placeAt(x: number, y: number) {
    setMessage("");
    if (!selectedPlantId) {
      setMessage("Create a plant first (Plants page).");
      return;
    }
    if (selectedPlant && bed) {
      if (isBlockedCell(x, y)) {
        setMessage(
          `Blocked: too close for ${selectedPlant.name} (needs ${requiredCells} cells spacing)`
        );
        return;
      }
    }
    const res = await fetch(`/api/beds/${bedId}/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantId: selectedPlantId, x, y }),
    });

    const text = await res.text();

    if (!res.ok) {
      try {
        const j = JSON.parse(text);
        setMessage(j?.error ?? `Place failed (${res.status})`);
      } catch {
        setMessage(`Place failed (${res.status})`);
      }
      return;
    }

    await loadBed();
  }

  async function clearAt(x: number, y: number) {
    setMessage("");

    const res = await fetch(`/api/beds/${bedId}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });

    const text = await res.text();

    if (!res.ok) {
      setMessage(`Clear failed (${res.status}): ${text}`);
      return;
    }

    await loadBed();
  }

  if (!bed) {
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold">Bed</h1>
          <Link className="text-sm underline" href="/beds">
            Back to beds
          </Link>
        </div>
        <p className="text-sm text-gray-600">Loading…</p>
        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{bed.name}</h1>
          <p className="text-sm text-gray-600">
            {bed.widthInches}" × {bed.heightInches}" — grid {bed.cellInches}" ({cols}×{rows})
          </p>
        </div>
        <Link className="text-sm underline" href="/beds">
          Back to beds
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-sm font-medium">Plant selection</p>

          {plants.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">No plants yet.</p>
              <Link className="text-sm underline" href="/plants">
                Go add plants →
              </Link>
            </div>
          ) : (
            <label className="grid gap-1">
              <span className="text-xs text-gray-600">Selected plant</span>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={selectedPlantId ?? ""}
                onChange={(e) => setSelectedPlantId(Number(e.target.value))}
              >
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="rounded border p-2">
            <p className="text-xs text-gray-600">
              Click a cell to place the selected plant.
              <br />
              Right-click a cell to clear it.
            </p>
          </div>

          {message ? <p className="text-sm">{message}</p> : null}
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Bed grid</p>

          <div
            className="mt-2 grid rounded-lg border bg-white"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: rows }).map((_, y) =>
              Array.from({ length: cols }).map((__, x) => {
                const placed = placementMap.get(`${x},${y}`);
const blocked = isBlockedCell(x, y);

return (
  <button
    key={`${x},${y}`}
    onClick={() => placeAt(x, y)}
    onContextMenu={(e) => {
      e.preventDefault();
      clearAt(x, y);
    }}
    disabled={blocked && !placed} // allow right-click clear; allow click replacement only if occupied
    className={[
      "aspect-square border border-gray-200 p-1 text-[10px] leading-tight focus:outline-none focus:ring-2 focus:ring-black",
      placed ? "bg-white" : blocked ? "bg-red-50" : "bg-white",
      placed ? "hover:bg-gray-50" : blocked ? "cursor-not-allowed" : "hover:bg-gray-50",
    ].join(" ")}
    title={
      placed
        ? "Click to replace. Right-click to clear."
        : blocked
        ? `Blocked for ${selectedPlant?.name ?? "selected plant"} (needs ${requiredCells} cells spacing)`
        : "Click to place. Right-click to clear."
    }
  >
    {placed ? (
      <span className="font-medium">{placed.plant.name}</span>
    ) : (
      <span className="text-gray-200">•</span>
    )}
  </button>
);

              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
