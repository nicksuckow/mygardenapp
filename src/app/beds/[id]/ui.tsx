"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Plant = {
  id: number;
  name: string;
  spacingInches: number;
};

type Placement = {
  id: number;
  x: number;
  y: number;
  w?: number | null;
  h?: number | null;
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

async function readJson<T>(
  res: Response
): Promise<{ ok: true; data: T } | { ok: false; status: number; text: string }> {
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, text };
  return { ok: true, data: (text ? JSON.parse(text) : null) as T };
}

function spacingToCells(spacingInches: number, cellInches: number) {
  return Math.max(1, Math.ceil(spacingInches / cellInches));
}

export default function BedLayoutClient({ bedId }: { bedId: number }) {
  const [bed, setBed] = useState<Bed | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  const loadBed = useCallback(async () => {
    const res = await fetch(`/api/beds/${bedId}`, { cache: "no-store" });
    const parsed = await readJson<Bed | null>(res);
    if (!parsed.ok)
      throw new Error(`Failed to load bed (${parsed.status}): ${parsed.text}`);
    setBed(parsed.data);
  }, [bedId]);

  const loadPlants = useCallback(async () => {
    const res = await fetch(`/api/plants`, { cache: "no-store" });
    const parsed = await readJson<Plant[]>(res);
    if (!parsed.ok)
      throw new Error(`Failed to load plants (${parsed.status}): ${parsed.text}`);

    const data = parsed.data ?? [];
    setPlants(data);

    // Keep selection if still valid; otherwise pick first plant
    setSelectedPlantId((prev) => {
      if (prev != null && data.some((p) => p.id === prev)) return prev;
      return data.length > 0 ? data[0].id : null;
    });
  }, []);

  const refresh = useCallback(async () => {
    setMessage("");
    try {
      await Promise.all([loadBed(), loadPlants()]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load.");
    }
  }, [loadBed, loadPlants]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cols = useMemo(() => {
    if (!bed) return 0;
    return Math.max(1, Math.floor(bed.widthInches / bed.cellInches));
  }, [bed]);

  const rows = useMemo(() => {
    if (!bed) return 0;
    return Math.max(1, Math.floor(bed.heightInches / bed.cellInches));
  }, [bed]);

  const placements = useMemo(() => {
    return bed?.placements ?? [];
  }, [bed]);

  // Footprint-aware: maps every covered cell -> the Placement that occupies it
  const cellMap = useMemo(() => {
    const map = new Map<string, Placement>();
    if (!bed) return map;

    for (const p of bed.placements) {
      const w = p.w ?? 1;
      const h = p.h ?? 1;

      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          map.set(`${p.x + dx},${p.y + dy}`, p);
        }
      }
    }
    return map;
  }, [bed]);

  // Anchor cells (top-left) of each footprint so we only print name once
  const anchorSet = useMemo(() => {
    const s = new Set<string>();
    if (!bed) return s;
    for (const p of bed.placements) s.add(`${p.x},${p.y}`);
    return s;
  }, [bed]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    if (!bed) return map;
    for (const p of bed.placements)
      map.set(p.plant.name, (map.get(p.plant.name) ?? 0) + 1);
    return map;
  }, [bed]);

  const selectedPlant = useMemo(() => {
    if (!selectedPlantId) return null;
    return plants.find((p) => p.id === selectedPlantId) ?? null;
  }, [plants, selectedPlantId]);

  // Use a clear alias name so the blocked preview code reads nicely
  const placingPlant = selectedPlant;

  // This is the footprint size (in grid cells) for the plant you're currently placing
  const placingCells = useMemo(() => {
    if (!bed || !placingPlant) return 1;
    return spacingToCells(placingPlant.spacingInches, bed.cellInches);
  }, [bed, placingPlant]);

  // Keep this for your UI text and messaging (same meaning as before)
  const requiredCells = useMemo(() => {
    if (!bed || !selectedPlant) return 0;
    return spacingToCells(selectedPlant.spacingInches, bed.cellInches);
  }, [bed, selectedPlant]);

  // Blocked cells preview:
  // uses max(placingPlant.spacing, existingPlant.spacing) (in "cells")
  const blockedMap = useMemo(() => {
    if (!bed || !placingPlant) return new Set<string>();

    const blocked = new Set<string>();

    for (const plc of placements) {
      const existingW = plc.w ?? 1;
      const existingH = plc.h ?? 1;

      // Convert the existing plant's spacing to cells
      const existingCells = spacingToCells(plc.plant.spacingInches, bed.cellInches);

      // Use the bigger spacing requirement between the placing plant and the existing plant
      const blockCells = Math.max(placingCells, existingCells);

      // Mark a block region around the existing plant’s anchor.
      // This keeps your same anchor-based behavior, just with a better blockCells value.
      for (let dy = -blockCells + 1; dy < existingH; dy++) {
        for (let dx = -blockCells + 1; dx < existingW; dx++) {
          const cx = plc.x + dx;
          const cy = plc.y + dy;

          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;

          blocked.add(`${cx},${cy}`);
        }
      }
    }

    return blocked;
  }, [bed, placingPlant, placements, placingCells, cols, rows]);
// NEW: why each blocked cell is blocked (cellKey -> reason string)
// why each blocked cell is blocked (cellKey -> reason string)
// matches blockedMap logic: max(placingCells, existingCells)
const blockedReasonMap = useMemo(() => {
  const reasons = new Map<string, string>();
  if (!bed || !placingPlant) return reasons;

  for (const plc of placements) {
    const existingW = plc.w ?? 1;
    const existingH = plc.h ?? 1;

    const existingCells = spacingToCells(plc.plant.spacingInches, bed.cellInches);
    const blockCells = Math.max(placingCells, existingCells);

    for (let dy = -blockCells + 1; dy < existingH; dy++) {
      for (let dx = -blockCells + 1; dx < existingW; dx++) {
        const cx = plc.x + dx;
        const cy = plc.y + dy;

        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;

        const key = `${cx},${cy}`;

        // If multiple plants block the same cell, keep the first reason (stable)
        if (!reasons.has(key)) {
          reasons.set(
            key,
            `Too close to ${plc.plant.name} (anchor at ${plc.x},${plc.y})`
          );
        }
      }
    }
  }

  return reasons;
}, [bed, placingPlant, placements, placingCells, cols, rows]);


  const hoverFootprintKeys = useMemo(() => {
    if (!bed || !placingPlant || !hoverCell) return [];
  
    const keys: string[] = [];
    for (let dy = 0; dy < placingCells; dy++) {
      for (let dx = 0; dx < placingCells; dx++) {
        const cx = hoverCell.x + dx;
        const cy = hoverCell.y + dy;
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
        keys.push(`${cx},${cy}`);
      }
    }
    return keys;
  }, [bed, placingPlant, hoverCell, placingCells, cols, rows]);
  
  const hoverIsBlocked = useMemo(() => {
    if (!bed || !placingPlant || !hoverCell) return false;
  
    // blocked if ANY footprint cell is blocked AND empty
    // (we still allow interacting with placed cells like you currently do)
    for (const key of hoverFootprintKeys) {
      const placed = cellMap.get(key);
      const blocked = blockedMap.has(key);
      if (blocked && !placed) return true;
    }
    return false;
  }, [bed, placingPlant, hoverCell, hoverFootprintKeys, cellMap, blockedMap]);

  const placeAt = useCallback(
    async (x: number, y: number) => {
      setMessage("");

      if (!selectedPlantId || !selectedPlant) {
        setMessage("Create a plant first (Plants page).");
        return;
      }

      const key = `${x},${y}`;
      const blocked = blockedMap.has(key);
      const placed = cellMap.get(key);

      // Block only if empty + blocked (still allow replacing occupied cells)
      if (blocked && !placed) {
        setMessage(
          `Blocked: too close for ${selectedPlant.name} (needs ${requiredCells} cells spacing)`
        );
        return;
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
    },
    [bedId, blockedMap, cellMap, loadBed, requiredCells, selectedPlant, selectedPlantId]
  );

  const clearAt = useCallback(
    async (x: number, y: number) => {
      setMessage("");

      const p = cellMap.get(`${x},${y}`);
      if (!p) return;

      const res = await fetch(`/api/beds/${bedId}/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placementId: p.id }),
      });

      const text = await res.text();
      if (!res.ok) {
        setMessage(`Clear failed (${res.status}): ${text}`);
        return;
      }

      await loadBed();
    },
    [bedId, cellMap, loadBed]
  );

  // --- render ---
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
        {/* Left panel */}
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
              <br />
              {selectedPlant ? (
                <>
                  Spacing preview: <span className="font-mono">{requiredCells}</span> cells
                </>
              ) : null}
            </p>
          </div>

          {message ? <p className="text-sm">{message}</p> : null}

          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Counts in this bed</p>
            {counts.size === 0 ? (
              <p className="text-sm text-gray-600">Nothing placed yet.</p>
            ) : (
              <ul className="mt-2 text-sm list-disc pl-5">
                {Array.from(counts.entries()).map(([name, count]) => (
                  <li key={name}>
                    {name}: {count}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Bed grid</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-gray-200 bg-white" />
              available
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-gray-200 bg-red-50" />
              blocked (spacing)
            </span>
          </div>

          <div
            className="mt-2 grid rounded-lg border bg-white"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: rows }).map((_, y) =>
              Array.from({ length: cols }).map((__, x) => {
                const key = `${x},${y}`;
                const placed = cellMap.get(key);
                const isAnchor = placed ? anchorSet.has(key) : false;
                const blocked = blockedMap.has(key);
                const isGhost = hoverFootprintKeys.includes(key);


                return (
                  <button
                    key={key}
                    onClick={() => placeAt(x, y)}
                    onMouseEnter={() => setHoverCell({ x, y })}
                    onMouseLeave={() => setHoverCell(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      clearAt(x, y);
                    }}
                    disabled={blocked && !placed}
                    className={[
                      "aspect-square border border-gray-200 p-1 text-[10px] leading-tight focus:outline-none focus:ring-2 focus:ring-black",
                      placed
                        ? "bg-white hover:bg-gray-50"
                        : blocked
                        ? "bg-red-50 cursor-not-allowed"
                        : "bg-white hover:bg-gray-50",
                    
                      // ghost footprint outline
                      isGhost
                        ? hoverIsBlocked
                          ? "ring-2 ring-red-400"
                          : "ring-2 ring-green-400"
                        : "",
                    ].join(" ")}
                    title={
                      placed
                        ? "Click to replace. Right-click to clear."
                        : blocked
                        ? `${blockedReasonMap.get(key) ?? "Blocked"} — placing ${selectedPlant?.name ?? "selected plant"} needs ${requiredCells} cells spacing`
                        : "Click to place. Right-click to clear."
                    }                    
                  >
                    {placed ? (
                      isAnchor ? <span className="font-medium">{placed.plant.name}</span> : null
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
