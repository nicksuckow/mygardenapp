"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ui } from "@/lib/uiStyles";

type Garden = {
  id: 1;
  widthInches: number;
  heightInches: number;
  cellInches: number;
};

type Bed = {
  id: number;
  name: string;
  widthInches: number;
  heightInches: number;
  cellInches: number;
  gardenX: number | null;
  gardenY: number | null;
  gardenRotated: boolean;
};

type PlanPlacement = {
  id: number;
  x: number;
  y: number;
  w: number | null;
  h: number | null;
  bed: { id: number; name: string };
  plant: { id: number; name: string };
};

// Header height reserved for dots offset (still a small top margin)
const BED_HEADER_PX = 22;

function toInt(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bedSizeInGardenCells(bed: Bed, gardenCellInches: number) {
  const wIn = bed.gardenRotated ? bed.heightInches : bed.widthInches;
  const hIn = bed.gardenRotated ? bed.widthInches : bed.heightInches;

  return {
    w: Math.max(1, Math.ceil(wIn / gardenCellInches)),
    h: Math.max(1, Math.ceil(hIn / gardenCellInches)),
  };
}

// Convert placement x/y (in inches) into % position INSIDE bed rectangle
function dotPosPct(bed: Bed, p: PlanPlacement) {
  // x, y are now in inches, not grid cells
  const w = p.w ?? 12; // footprint width in inches
  const h = p.h ?? 12; // footprint height in inches

  // Calculate center of plant in inches
  let cx = p.x + w / 2;
  let cy = p.y + h / 2;

  let bedWidth = bed.widthInches;
  let bedHeight = bed.heightInches;

  // If bed is rotated in garden view, rotate dot positions too (90° clockwise)
  if (bed.gardenRotated) {
    // Rotate coordinates: (x,y) -> (y, width-x)
    const newCx = cy;
    const newCy = bedWidth - cx;

    cx = newCx;
    cy = newCy;

    // Swap dimensions when rotated
    bedWidth = bed.heightInches;
    bedHeight = bed.widthInches;
  }

  // Convert to percentage of bed dimensions
  const leftPct = (cx / bedWidth) * 100;
  const topPct = (cy / bedHeight) * 100;

  // Clamp to avoid weird values
  const safeLeft = Math.max(0, Math.min(leftPct, 100));
  const safeTop = Math.max(0, Math.min(topPct, 100));

  return {
    left: `${safeLeft}%`,
    top: `${safeTop}%`,
  };
}

export default function GardenPage() {
  const [garden, setGarden] = useState<Garden | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [placements, setPlacements] = useState<PlanPlacement[]>([]);
  const [message, setMessage] = useState("");

  // setup inputs
  const [gWidth, setGWidth] = useState(240);
  const [gHeight, setGHeight] = useState(240);
  const [gCell, setGCell] = useState(12);

  const gardenGridCols = Math.max(1, Math.floor(gWidth / gCell));
  const gardenGridRows = Math.max(1, Math.floor(gHeight / gCell));

  // selection state
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);

  // drag state
  const CELL_PX = 28;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [dragBedId, setDragBedId] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);

  // ✅ dot tooltip state
  const [dotTip, setDotTip] = useState<{
    bedId: number;
    placementId: number;
    label: string;
    x: number; // px within bed block
    y: number; // px within bed block
  } | null>(null);

  async function load() {
    setMessage("");
    const [gRes, bRes, pRes] = await Promise.all([
      fetch("/api/garden", { cache: "no-store" }),
      fetch("/api/beds", { cache: "no-store" }),
      fetch("/api/plan", { cache: "no-store" }),
    ]);

    const gText = await gRes.text();
    const gJson = gText ? (JSON.parse(gText) as Garden | null) : null;

    const bJson = (await bRes.json()) as Bed[];
    const pJson = (await pRes.json()) as PlanPlacement[];

    setGarden(gJson);
    setBeds(Array.isArray(bJson) ? bJson : []);
    setPlacements(Array.isArray(pJson) ? pJson : []);

    if (gJson) {
      setGWidth(gJson.widthInches);
      setGHeight(gJson.heightInches);
      setGCell(gJson.cellInches);
    }

    setSelectedBedId((prev) => {
      if (prev != null && Array.isArray(bJson) && bJson.some((b) => b.id === prev)) return prev;
      return Array.isArray(bJson) && bJson[0] ? bJson[0].id : null;
    });
  }

  useEffect(() => {
    load();
  }, []);

  const selectedBed = useMemo(
    () => beds.find((b) => b.id === selectedBedId) ?? null,
    [beds, selectedBedId]
  );

  const cols = useMemo(() => {
    if (!garden) return 0;
    return Math.max(1, Math.floor(garden.widthInches / garden.cellInches));
  }, [garden]);

  const rows = useMemo(() => {
    if (!garden) return 0;
    return Math.max(1, Math.floor(garden.heightInches / garden.cellInches));
  }, [garden]);

  const placedBeds = useMemo(
    () => beds.filter((b) => b.gardenX != null && b.gardenY != null),
    [beds]
  );

  const plantCountByBed = useMemo(() => {
    const map = new Map<number, number>();
    for (const plc of placements) {
      const bedId = plc?.bed?.id;
      if (typeof bedId !== "number") continue;
      map.set(bedId, (map.get(bedId) ?? 0) + 1);
    }
    return map;
  }, [placements]);

  const placementsByBed = useMemo(() => {
    const map = new Map<number, PlanPlacement[]>();
    for (const plc of placements) {
      const bedId = plc?.bed?.id;
      if (typeof bedId !== "number") continue;
      const arr = map.get(bedId) ?? [];
      arr.push(plc);
      map.set(bedId, arr);
    }
    return map;
  }, [placements]);

  async function saveGarden() {
    setMessage("");
    const res = await fetch("/api/garden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widthInches: gWidth, heightInches: gHeight, cellInches: gCell }),
    });

    const text = await res.text();
    if (!res.ok) {
      try {
        setMessage(JSON.parse(text)?.error ?? "Failed to save garden.");
      } catch {
        setMessage("Failed to save garden.");
      }
      return;
    }

    await load();
    setMessage("Garden saved.");
  }

  async function setBedPosition(bedId: number, x: number, y: number) {
    setMessage("");

    if (!garden) {
      setMessage("Set up your garden dimensions first.");
      return;
    }

    const res = await fetch(`/api/beds/${bedId}/position`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gardenX: x, gardenY: y }),
    });

    const text = await res.text();
    if (!res.ok) {
      try {
        setMessage(JSON.parse(text)?.error ?? `Place failed (${res.status})`);
      } catch {
        setMessage(`Place failed (${res.status})`);
      }
      return;
    }

    await load();
  }

  async function rotateBed(bedId: number, nextRotated: boolean) {
    setMessage("");
    const res = await fetch(`/api/beds/${bedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gardenRotated: nextRotated }),
    });

    const text = await res.text();
    if (!res.ok) {
      try {
        setMessage(JSON.parse(text)?.error ?? `Rotate failed (${res.status})`);
      } catch {
        setMessage(`Rotate failed (${res.status})`);
      }
      return;
    }

    await load();
  }

  // Convert mouse/pointer position to grid cell
  function pointerToCell(clientX: number, clientY: number) {
    const el = gridRef.current;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const x = Math.floor(px / CELL_PX);
    const y = Math.floor(py / CELL_PX);

    if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
    return { x, y };
  }

  // Start dragging a bed
  function startDrag(bedId: number) {
    setDragBedId(bedId);
    setSelectedBedId(bedId);
    setDragPreview(null);
  }

  // While dragging
  function onGridPointerMove(e: React.PointerEvent) {
    if (!dragBedId) return;
    const cell = pointerToCell(e.clientX, e.clientY);
    setDragPreview(cell);
  }

  // Drop
  async function onGridPointerUp(e: React.PointerEvent) {
    if (!dragBedId) return;
    const cell = pointerToCell(e.clientX, e.clientY);
    setDragBedId(null);
    setDragPreview(null);

    if (!cell) return;
    await setBedPosition(dragBedId, cell.x, cell.y);
  }

  // Click-to-place (when not dragging)
  function onGridClick(x: number, y: number) {
    if (!selectedBed) {
      setMessage("Pick a bed first.");
      return;
    }
    setBedPosition(selectedBed.id, x, y);
  }

  const previewBed = useMemo(() => {
    if (!garden || !dragBedId) return null;
    const bed = beds.find((b) => b.id === dragBedId) ?? null;
    if (!bed) return null;
    const size = bedSizeInGardenCells(bed, garden.cellInches);
    return { bed, size };
  }, [garden, dragBedId, beds]);

  return (
    <div className="space-y-6">
      <div className={`${ui.card} ${ui.cardPad}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={ui.h1}>Garden</h1>
            <p className={ui.sub}>
              Place beds on the garden grid. Drag beds to move them. Rotate a bed if it fits better.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={`${ui.btn} ${ui.btnSecondary}`} href="/beds">
              Manage beds
            </Link>
            <Link className={`${ui.btn} ${ui.btnSecondary}`} href="/schedule">
              Schedule
            </Link>
          </div>
        </div>

        {message ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {message}
          </div>
        ) : null}
      </div>

      {/* Setup */}
      <div className={`${ui.card} ${ui.cardPad} space-y-4`}>
        <div>
          <p className="text-base font-semibold">Garden dimensions</p>
          <p className="text-sm text-slate-600">Define your overall garden space where beds will be placed</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Width (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              min={12}
              value={gWidth}
              onChange={(e) => setGWidth(toInt(e.target.value, 240))}
            />
            <span className="text-xs text-slate-500">Total garden width</span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Height (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              min={12}
              value={gHeight}
              onChange={(e) => setGHeight(toInt(e.target.value, 240))}
            />
            <span className="text-xs text-slate-500">Total garden height</span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Grid cell size (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              min={1}
              step={0.5}
              value={gCell}
              onChange={(e) => setGCell(toInt(e.target.value, 12))}
            />
            <span className="text-xs text-slate-500">Cell size for bed placement</span>
          </label>
        </div>

        {gardenGridCols > 0 && gardenGridRows > 0 ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-900">Grid Preview</p>
            <p className="text-sm text-blue-700">
              Garden grid: <span className="font-semibold">{gardenGridCols} × {gardenGridRows}</span> cells
              ({gardenGridCols * gardenGridRows} cells total for bed placement)
            </p>
          </div>
        ) : null}

        <button className={`${ui.btn} ${ui.btnPrimary} w-fit`} onClick={saveGarden}>
          Save garden
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Left panel */}
        <div className={`${ui.card} ${ui.cardPad} space-y-4`}>
          <div>
            <p className="text-base font-semibold">Bed Management</p>
            <p className="text-xs text-slate-600 mt-0.5">Click grid cells or drag beds to position them</p>
          </div>

          {beds.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">No beds created yet.</p>
              <Link className={`${ui.btn} ${ui.btnPrimary} w-full text-center`} href="/beds">
                Create your first bed →
              </Link>
            </div>
          ) : (
            <>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Selected bed to place</span>
                <select
                  className="rounded border px-3 py-2 text-sm"
                  value={selectedBedId ?? ""}
                  onChange={(e) => setSelectedBedId(toInt(e.target.value, 0) || null)}
                >
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">Choose which bed to place or move</span>
              </label>

              {selectedBed && garden ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{selectedBed.name}</div>
                      <div className="text-xs text-emerald-700 space-y-0.5 mt-1">
                        <p>Size: {selectedBed.widthInches}" × {selectedBed.heightInches}"</p>
                        <p>Status: {selectedBed.gardenRotated ? "Rotated 90°" : "Normal orientation"}</p>
                        <p>Plants: {(plantCountByBed.get(selectedBed.id) ?? 0)} placed</p>
                      </div>
                    </div>

                    <button
                      className={`${ui.btn} ${ui.btnSecondary} py-1.5 px-3 text-xs`}
                      onClick={() => rotateBed(selectedBed.id, !selectedBed.gardenRotated)}
                      title="Rotate bed 90 degrees (swap width/height)"
                    >
                      ↻ Rotate
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium">Placed beds ({placedBeds.length})</p>
                {placedBeds.length === 0 ? (
                  <p className="text-sm text-slate-600">Click a grid cell below to place the selected bed.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {placedBeds.map((b) => (
                      <button
                        key={b.id}
                        className={[
                          "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                          selectedBedId === b.id
                            ? "border-emerald-400 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50",
                        ].join(" ")}
                        onClick={() => setSelectedBedId(b.id)}
                        title="Click to select this bed"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium">{b.name}</span>
                          <span className="text-xs text-slate-600">
                            {(plantCountByBed.get(b.id) ?? 0)} plants
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Position: ({b.gardenX}, {b.gardenY}) • {b.gardenRotated ? "rotated" : "normal"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Garden canvas */}
        <div className={`${ui.card} ${ui.cardPad}`}>
          <div className="space-y-1">
            <p className="text-base font-semibold">Garden Layout</p>
            {garden ? (
              <p className="text-xs text-slate-600">
                {cols} × {rows} grid ({garden.widthInches}" × {garden.heightInches}" @ {garden.cellInches}" cells)
              </p>
            ) : null}
          </div>

          {!garden ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-700">Set garden dimensions above and click "Save garden" to get started.</p>
            </div>
          ) : (
            <div className="mt-3 overflow-auto rounded-xl border bg-white p-3">
              <div
                ref={gridRef}
                className="relative touch-none select-none"
                style={{ width: cols * CELL_PX, height: rows * CELL_PX }}
                onPointerMove={onGridPointerMove}
                onPointerUp={onGridPointerUp}
              >
                {/* grid buttons (click-to-place) */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
                    gridTemplateRows: `repeat(${rows}, ${CELL_PX}px)`,
                  }}
                >
                  {Array.from({ length: rows }).map((_, y) =>
                    Array.from({ length: cols }).map((__, x) => (
                      <button
                        key={`${x},${y}`}
                        className="h-7 w-7 border border-slate-100 hover:bg-slate-50"
                        title={selectedBed ? `Place/move "${selectedBed.name}" here` : "Select a bed"}
                        onClick={() => onGridClick(x, y)}
                      />
                    ))
                  )}
                </div>

                {/* overlay: placed beds */}
                <div
                  className="absolute inset-0 grid pointer-events-none"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
                    gridTemplateRows: `repeat(${rows}, ${CELL_PX}px)`,
                  }}
                >
                  {placedBeds.map((b) => {
                    const x = b.gardenX ?? 0;
                    const y = b.gardenY ?? 0;
                    const size = bedSizeInGardenCells(b, garden.cellInches);
                    const isSelected = b.id === selectedBedId;
                    const plantCount = plantCountByBed.get(b.id) ?? 0;
                    const bedPlacements = placementsByBed.get(b.id) ?? [];

                    const showTip =
                      dotTip && dotTip.bedId === b.id
                        ? {
                            left: dotTip.x,
                            top: dotTip.y,
                            label: dotTip.label,
                            placementId: dotTip.placementId,
                          }
                        : null;

                    return (
                      <div
                        key={b.id}
                        className={[
                          "relative h-full rounded-lg border shadow-sm p-1 cursor-grab active:cursor-grabbing pointer-events-auto overflow-hidden",
                          isSelected
                            ? "border-emerald-500 bg-emerald-100"
                            : "border-slate-300 bg-slate-100",
                        ].join(" ")}
                        style={{
                          gridColumnStart: x + 1,
                          gridRowStart: y + 1,
                          gridColumnEnd: x + 1 + size.w,
                          gridRowEnd: y + 1 + size.h,
                        }}
                        title="Drag to move. Click to select."
                        onPointerDown={(e) => {
                          e.preventDefault();
                          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                          startDrag(b.id);
                        }}
                        onClick={() => setSelectedBedId(b.id)}
                        onPointerLeave={() => setDotTip((t) => (t?.bedId === b.id ? null : t))}
                      >
                        {/* Dots (hoverable) */}
                        <div
                          className="absolute inset-x-0 z-10"
                          style={{ top: BED_HEADER_PX + 1, bottom: 0 }}
                        >
                          {bedPlacements.map((p) => {
                            const pos = dotPosPct(b, p);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                className="absolute h-2 w-2 rounded-full bg-emerald-600 opacity-80 hover:scale-110"
                                style={{
                                  left: pos.left,
                                  top: pos.top,
                                  transform: "translate(-50%, -50%)",
                                }}
                                onPointerEnter={(ev) => {
                                  ev.stopPropagation();
                                  const rect = (
                                    ev.currentTarget.offsetParent as HTMLElement | null
                                  )?.getBoundingClientRect();
                                  const dotRect = ev.currentTarget.getBoundingClientRect();
                                  if (!rect) return;

                                  // tooltip position relative to the bed block
                                  const xPx = dotRect.left - rect.left + dotRect.width / 2;
                                  const yPx = dotRect.top - rect.top;

                                  setDotTip({
                                    bedId: b.id,
                                    placementId: p.id,
                                    label: p.plant.name,
                                    x: xPx,
                                    y: yPx,
                                  });
                                }}
                                onPointerLeave={(ev) => {
                                  ev.stopPropagation();
                                  setDotTip((t) =>
                                    t && t.bedId === b.id && t.placementId === p.id ? null : t
                                  );
                                }}
                                onClick={(ev) => {
                                  // don't select bed / start drag when clicking dots
                                  ev.preventDefault();
                                  ev.stopPropagation();
                                }}
                                title={p.plant.name} // fallback native tooltip
                              />
                            );
                          })}

                          {/* Custom tooltip */}
                          {showTip ? (
                            <div
                              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 shadow"
                              style={{
                                left: showTip.left,
                                top: showTip.top,
                              }}
                            >
                              {showTip.label}
                            </div>
                          ) : null}
                        </div>

                        {/* Compact label (top-right) */}
                        <div className="absolute right-1 top-1 z-20 inline-flex items-center gap-1 rounded-md bg-white px-1 py-0.5 shadow-sm">
                          <button
                            className="rounded border bg-white px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-slate-50"
                            onPointerDown={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                            }}
                            onClick={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                              rotateBed(b.id, !b.gardenRotated);
                            }}
                            title="Rotate"
                          >
                            ↻
                          </button>

                          <div className="min-w-0">
                            <div className="max-w-[140px] truncate text-[10px] font-semibold leading-tight text-slate-900">
                              {b.name}
                            </div>
                            <div className="text-[9px] text-slate-700 leading-tight">
                              {plantCount} • {b.gardenRotated ? "rotated" : "normal"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* drag preview outline */}
                {dragBedId && previewBed && dragPreview ? (
                  <div
                    className="absolute rounded-lg border-2 border-emerald-400 bg-emerald-100/40 pointer-events-none"
                    style={{
                      left: dragPreview.x * CELL_PX,
                      top: dragPreview.y * CELL_PX,
                      width: previewBed.size.w * CELL_PX,
                      height: previewBed.size.h * CELL_PX,
                    }}
                  />
                ) : null}
              </div>

              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-medium text-slate-700">How to use:</p>
                <ul className="text-xs text-slate-600 space-y-0.5 list-disc pl-4">
                  <li>Click any grid cell to place or move the selected bed</li>
                  <li>Drag bed blocks to reposition them in the garden</li>
                  <li>Hover over green dots to see which plants are placed</li>
                  <li>Use the "Rotate" button to change bed orientation</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
