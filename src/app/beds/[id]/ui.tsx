"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export default function BedLayoutClient({ bedId }: { bedId: number }) {
  const [bed, setBed] = useState<Bed | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const BASE_PIXELS_PER_INCH = 4;
  const PIXELS_PER_INCH = BASE_PIXELS_PER_INCH * zoom;

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

  const selectedPlant = useMemo(() => {
    if (!selectedPlantId) return null;
    return plants.find((p) => p.id === selectedPlantId) ?? null;
  }, [plants, selectedPlantId]);

  const placements = useMemo(() => {
    return bed?.placements ?? [];
  }, [bed]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    if (!bed) return map;
    for (const p of bed.placements)
      map.set(p.plant.name, (map.get(p.plant.name) ?? 0) + 1);
    return map;
  }, [bed]);

  const isPositionValid = useCallback((x: number, y: number, plantToPlace: Plant): { valid: boolean; reason?: string } => {
    if (!bed) return { valid: false, reason: "Bed not loaded" };

    const w = plantToPlace.spacingInches;
    const h = plantToPlace.spacingInches;
    if (x + w > bed.widthInches || y + h > bed.heightInches) {
      return { valid: false, reason: "Would extend outside bed" };
    }

    const newCenterX = x + w / 2;
    const newCenterY = y + h / 2;

    for (const p of placements) {
      const pw = p.w ?? p.plant.spacingInches;
      const ph = p.h ?? p.plant.spacingInches;
      const existingCenterX = p.x + pw / 2;
      const existingCenterY = p.y + ph / 2;

      const distanceX = Math.abs(newCenterX - existingCenterX);
      const distanceY = Math.abs(newCenterY - existingCenterY);
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      const requiredSpacing = Math.max(plantToPlace.spacingInches, p.plant.spacingInches);

      if (distance < requiredSpacing) {
        return { valid: false, reason: `Too close to ${p.plant.name} (needs ${requiredSpacing}" spacing)` };
      }
    }

    return { valid: true };
  }, [bed, placements]);

  const getInchPosition = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !bed) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const pixelX = (e.clientX - rect.left - panOffset.x) / zoom;
    const pixelY = (e.clientY - rect.top - panOffset.y) / zoom;

    const inchX = Math.floor(pixelX / BASE_PIXELS_PER_INCH);
    const inchY = Math.floor(pixelY / BASE_PIXELS_PER_INCH);

    const clampedX = Math.max(0, Math.min(inchX, bed.widthInches - 1));
    const clampedY = Math.max(0, Math.min(inchY, bed.heightInches - 1));

    return { x: clampedX, y: clampedY };
  }, [bed, zoom, panOffset]);

  const placeAt = useCallback(
    async (x: number, y: number) => {
      setMessage("");

      if (!selectedPlantId || !selectedPlant) {
        setMessage("Create a plant first (Plants page).");
        return;
      }

      const validation = isPositionValid(x, y, selectedPlant);
      if (!validation.valid) {
        setMessage(validation.reason || "Cannot place plant here");
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
    [bedId, isPositionValid, loadBed, selectedPlant, selectedPlantId]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button === 1 || e.shiftKey || e.ctrlKey || e.metaKey) {
        // Middle click or modifier key - start panning
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    },
    [panOffset]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      } else {
        const pos = getInchPosition(e);
        setHoverPos(pos);
      }
    },
    [isPanning, panStart, getInchPosition]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning) return; // Don't place if we were panning
      const pos = getInchPosition(e);
      if (pos) {
        placeAt(pos.x, pos.y);
      }
    },
    [isPanning, getInchPosition, placeAt]
  );

  const clearPlacement = useCallback(
    async (placementId: number) => {
      setMessage("");

      const res = await fetch(`/api/beds/${bedId}/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placementId }),
      });

      const text = await res.text();
      if (!res.ok) {
        setMessage(`Clear failed (${res.status}): ${text}`);
        return;
      }

      await loadBed();
    },
    [bedId, loadBed]
  );

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z * 1.5, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z / 1.5, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      if (delta > 0) {
        setZoom(z => Math.min(z * 1.1, 10));
      } else {
        setZoom(z => Math.max(z / 1.1, 0.5));
      }
    }
  }, []);

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

  const gridCols = Math.max(1, Math.floor(bed.widthInches / bed.cellInches));
  const gridRows = Math.max(1, Math.floor(bed.heightInches / bed.cellInches));

  const canvasWidth = bed.widthInches * BASE_PIXELS_PER_INCH;
  const canvasHeight = bed.heightInches * BASE_PIXELS_PER_INCH;

  const hoverValidation = hoverPos && selectedPlant ? isPositionValid(hoverPos.x, hoverPos.y, selectedPlant) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{bed.name}</h1>
          <p className="text-sm text-gray-600">
            {bed.widthInches}" × {bed.heightInches}" — {bed.cellInches}" reference grid ({gridCols}×{gridRows})
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
                    {p.name} ({p.spacingInches}")
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="rounded border p-2 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-900 font-medium">How to use:</p>
            <ul className="text-xs text-blue-800 mt-1 space-y-0.5 list-disc pl-4">
              <li>Click to place plants (1" precision)</li>
              <li>Shift+Drag or Middle-click+Drag to pan</li>
              <li>Ctrl+Scroll to zoom</li>
              <li>Click a plant to remove it</li>
            </ul>
          </div>

          {message ? <p className="text-sm text-red-600">{message}</p> : null}

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

        {/* Canvas */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Bed layout</p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Zoom: {zoom.toFixed(1)}x</span>
              <div className="flex gap-1">
                <button
                  onClick={handleZoomOut}
                  className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  title="Zoom out"
                >
                  −
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  title="Reset zoom"
                >
                  Reset
                </button>
                <button
                  onClick={handleZoomIn}
                  className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  title="Zoom in"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div
            ref={containerRef}
            className="overflow-auto rounded-lg border bg-white p-2"
            style={{ height: "600px" }}
          >
            <div
              ref={canvasRef}
              className={`relative ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
              style={{
                width: canvasWidth * zoom,
                height: canvasHeight * zoom,
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${bed.cellInches * PIXELS_PER_INCH}px ${bed.cellInches * PIXELS_PER_INCH}px`,
              }}
              onClick={handleCanvasClick}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={() => {
                setHoverPos(null);
                setIsPanning(false);
              }}
              onWheel={handleWheel}
            >
              {/* Existing placements */}
              {placements.map((p) => {
                const w = p.w ?? p.plant.spacingInches;
                const h = p.h ?? p.plant.spacingInches;

                return (
                  <button
                    key={p.id}
                    className="absolute rounded-lg bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-xs font-medium hover:bg-emerald-200 transition-colors"
                    style={{
                      left: p.x * PIXELS_PER_INCH,
                      top: p.y * PIXELS_PER_INCH,
                      width: w * PIXELS_PER_INCH,
                      height: h * PIXELS_PER_INCH,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPlacement(p.id);
                    }}
                    title={`${p.plant.name} at (${p.x}", ${p.y}") - Click to remove`}
                  >
                    <span className="text-center px-1 leading-tight">{p.plant.name}</span>
                  </button>
                );
              })}

              {/* Hover preview */}
              {hoverPos && selectedPlant && !isPanning && (
                <div
                  className={`absolute rounded-lg border-2 pointer-events-none ${
                    hoverValidation?.valid
                      ? "bg-green-100/50 border-green-400"
                      : "bg-red-100/50 border-red-400"
                  }`}
                  style={{
                    left: hoverPos.x * PIXELS_PER_INCH,
                    top: hoverPos.y * PIXELS_PER_INCH,
                    width: selectedPlant.spacingInches * PIXELS_PER_INCH,
                    height: selectedPlant.spacingInches * PIXELS_PER_INCH,
                  }}
                >
                  <div className="flex items-center justify-center h-full text-xs font-medium">
                    ({hoverPos.x}", {hoverPos.y}")
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-600">
            Position: {hoverPos ? `(${hoverPos.x}", ${hoverPos.y}")` : "—"}
            {hoverValidation && !hoverValidation.valid && (
              <span className="ml-2 text-red-600">{hoverValidation.reason}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
