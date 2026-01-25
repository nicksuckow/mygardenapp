"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ui } from "@/lib/uiStyles";
import { inchesToFeetInches } from "@/lib/dimensions";
import PlantInfoModal from "@/components/PlantInfoModal";
import { type FullPlantData } from "@/components/PlantInfoPanel";

type Walkway = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string | null;
};

type Gate = {
  id: number;
  x: number;
  y: number;
  side: string;
  width: number;
  name: string | null;
};

type Garden = {
  id: 1;
  widthInches: number;
  heightInches: number;
  cellInches: number;
  walkways?: Walkway[];
  gates?: Gate[];
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
  count: number;
  status?: string | null;
  bed: { id: number; name: string };
  plant: FullPlantData;
};

// Header height reserved for dots offset (still a small top margin)
const BED_HEADER_PX = 22;

// Helper function to get status color for dots
function getStatusDotColor(status?: string | null): string {
  switch (status) {
    case "planted":
      return "bg-blue-500"; // blue
    case "growing":
      return "bg-green-500"; // green
    case "harvesting":
      return "bg-orange-500"; // orange
    case "harvested":
      return "bg-purple-500"; // purple
    case "removed":
      return "bg-red-500"; // red
    default:
      return "bg-emerald-600"; // emerald (planned or null)
  }
}

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

  // setup inputs - width in feet and inches
  const [gWidthFeet, setGWidthFeet] = useState(20);
  const [gWidthInches, setGWidthInches] = useState(0);

  // setup inputs - height in feet and inches
  const [gHeightFeet, setGHeightFeet] = useState(20);
  const [gHeightInches, setGHeightInches] = useState(0);

  // setup inputs - cell size in feet and inches
  const [gCellFeet, setGCellFeet] = useState(1);
  const [gCellInches, setGCellInches] = useState(0);

  // Calculate total inches
  const gWidth = gWidthFeet * 12 + gWidthInches;
  const gHeight = gHeightFeet * 12 + gHeightInches;
  const gCell = gCellFeet * 12 + gCellInches;

  const gardenGridCols = Math.max(1, Math.floor(gWidth / gCell));
  const gardenGridRows = Math.max(1, Math.floor(gHeight / gCell));

  // selection state
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);

  // drag state
  const CELL_PX = 40; // Increased from 28 to 40 for better visibility
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [dragBedId, setDragBedId] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);

  // placement mode state
  const [placementMode, setPlacementMode] = useState<'bed' | 'walkway' | 'gate'>('bed');
  const [walkwayDraft, setWalkwayDraft] = useState<{
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
    isDragging: boolean;
  }>({
    start: null,
    end: null,
    isDragging: false,
  });

  // ✅ dot tooltip state
  const [dotTip, setDotTip] = useState<{
    bedId: number;
    placementId: number;
    label: string;
    x: number; // px within bed block
    y: number; // px within bed block
  } | null>(null);

  // plant info modal state
  const [selectedPlacement, setSelectedPlacement] = useState<PlanPlacement | null>(null);
  const [showPlantInfoModal, setShowPlantInfoModal] = useState(false);

  // zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // rotation state (0, 90, 180, 270)
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);

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
      // Convert inches to feet and inches
      setGWidthFeet(Math.floor(gJson.widthInches / 12));
      setGWidthInches(gJson.widthInches % 12);
      setGHeightFeet(Math.floor(gJson.heightInches / 12));
      setGHeightInches(gJson.heightInches % 12);
      setGCellFeet(Math.floor(gJson.cellInches / 12));
      setGCellInches(gJson.cellInches % 12);
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

  async function removeBedFromGarden(bedId: number) {
    console.log('Removing bed from garden:', bedId);
    setMessage("");
    try {
      const res = await fetch(`/api/beds/${bedId}/position`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gardenX: null, gardenY: null }),
      });

      console.log('Remove bed response:', res.status);
      const text = await res.text();
      console.log('Remove bed response text:', text);

      if (!res.ok) {
        try {
          const errorMsg = JSON.parse(text)?.error ?? `Remove failed (${res.status})`;
          console.error('Remove bed failed:', errorMsg);
          setMessage(errorMsg);
        } catch {
          console.error('Remove bed failed with non-JSON response:', text);
          setMessage(`Remove failed (${res.status}): ${text}`);
        }
        return;
      }

      setMessage("Bed removed from garden");
      await load();
    } catch (error) {
      console.error('Remove bed error:', error);
      setMessage(`Error removing bed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function addWalkway(x: number, y: number, width: number, height: number) {
    setMessage("");
    const res = await fetch("/api/walkways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y, width, height }),
    });

    const text = await res.text();
    if (!res.ok) {
      try {
        setMessage(JSON.parse(text)?.error ?? `Add walkway failed (${res.status})`);
      } catch {
        setMessage(`Add walkway failed (${res.status})`);
      }
      return;
    }

    await load();
  }

  async function deleteWalkway(id: number) {
    setMessage("");
    const res = await fetch(`/api/walkways/${id}`, {
      method: "DELETE",
    });

    const text = await res.text();
    if (!res.ok) {
      setMessage(`Delete walkway failed (${res.status}): ${text}`);
      return;
    }

    await load();
  }

  async function addGate(x: number, y: number, side: string) {
    setMessage("");
    const res = await fetch("/api/gates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y, side, width: 1 }),
    });

    const text = await res.text();
    if (!res.ok) {
      try {
        setMessage(JSON.parse(text)?.error ?? `Add gate failed (${res.status})`);
      } catch {
        setMessage(`Add gate failed (${res.status})`);
      }
      return;
    }

    await load();
  }

  async function deleteGate(id: number) {
    setMessage("");
    const res = await fetch(`/api/gates/${id}`, {
      method: "DELETE",
    });

    const text = await res.text();
    if (!res.ok) {
      setMessage(`Delete gate failed (${res.status}): ${text}`);
      return;
    }

    await load();
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(z => Math.min(z * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoom(z => Math.max(z / 1.5, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      if (delta > 0) {
        setZoom(z => Math.min(z * 1.1, 10));
      } else {
        setZoom(z => Math.max(z / 1.1, 0.5));
      }
    }
  };

  // Pan handlers
  const handlePanStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.shiftKey || e.button === 1 || (e.ctrlKey && !e.metaKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handlePanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Rotation handlers
  const handleRotate = () => {
    setRotation(r => {
      const next = (r + 90) % 360;
      return next as 0 | 90 | 180 | 270;
    });
  };

  // Convert mouse/pointer position to grid cell
  function pointerToCell(clientX: number, clientY: number) {
    const el = gridRef.current;
    if (!el) return null;

    const rect = el.getBoundingClientRect();

    // Get position relative to the grid container
    let px = clientX - rect.left;
    let py = clientY - rect.top;

    // Reverse the transformations: translate, scale, rotate
    // First, account for pan offset (reverse translate)
    px -= panOffset.x;
    py -= panOffset.y;

    // Then account for zoom (reverse scale)
    px /= zoom;
    py /= zoom;

    // Finally, account for rotation (rotate back around center)
    if (rotation !== 0) {
      const centerX = (cols * CELL_PX) / 2;
      const centerY = (rows * CELL_PX) / 2;

      // Translate to origin (center)
      const relX = px - centerX;
      const relY = py - centerY;

      // Rotate by -rotation degrees
      const angleRad = (-rotation * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      const rotatedX = relX * cosA - relY * sinA;
      const rotatedY = relX * sinA + relY * cosA;

      // Translate back from origin
      px = rotatedX + centerX;
      py = rotatedY + centerY;
    }

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

  // Grid cell pointer down - start walkway drag or place bed/gate
  function onGridCellPointerDown(x: number, y: number) {
    if (placementMode === 'walkway') {
      setWalkwayDraft({ start: { x, y }, end: { x, y }, isDragging: true });
      setMessage("Drag to size walkway, release to place");
    }
  }

  // Grid cell pointer enter - update walkway end position while dragging
  function onGridCellPointerEnter(x: number, y: number) {
    if (placementMode === 'walkway' && walkwayDraft.isDragging && walkwayDraft.start) {
      setWalkwayDraft(prev => ({ ...prev, end: { x, y } }));
    }
  }

  // Grid cell pointer up - finalize walkway or place bed/gate
  function onGridCellPointerUp(x: number, y: number) {
    if (placementMode === 'bed') {
      if (!selectedBed) {
        setMessage("Pick a bed first.");
        return;
      }
      setBedPosition(selectedBed.id, x, y);
    } else if (placementMode === 'walkway') {
      if (walkwayDraft.isDragging && walkwayDraft.start) {
        // Finalize walkway
        const startX = Math.min(walkwayDraft.start.x, x);
        const startY = Math.min(walkwayDraft.start.y, y);
        const endX = Math.max(walkwayDraft.start.x, x);
        const endY = Math.max(walkwayDraft.start.y, y);
        const width = endX - startX + 1;
        const height = endY - startY + 1;

        addWalkway(startX, startY, width, height);
        setWalkwayDraft({ start: null, end: null, isDragging: false });
        setMessage("");
      }
    } else if (placementMode === 'gate') {
      // Determine which edge this is closest to
      if (!garden) return;
      const distToTop = y;
      const distToBottom = rows - 1 - y;
      const distToLeft = x;
      const distToRight = cols - 1 - x;

      const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
      let side = 'bottom';
      if (minDist === distToTop) side = 'top';
      else if (minDist === distToRight) side = 'right';
      else if (minDist === distToLeft) side = 'left';

      addGate(x, y, side);
    }
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
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Width</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={gWidthFeet}
                  onChange={(e) => setGWidthFeet(Math.max(0, Number(e.target.value)))}
                  min={0}
                  placeholder="Feet"
                />
              </div>
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={gWidthInches}
                  onChange={(e) => setGWidthInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                  min={0}
                  max={11}
                  placeholder="Inches"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500">Total: {inchesToFeetInches(gWidth)}</span>
          </div>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Height</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={gHeightFeet}
                  onChange={(e) => setGHeightFeet(Math.max(0, Number(e.target.value)))}
                  min={0}
                  placeholder="Feet"
                />
              </div>
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={gHeightInches}
                  onChange={(e) => setGHeightInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                  min={0}
                  max={11}
                  placeholder="Inches"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500">Total: {inchesToFeetInches(gHeight)}</span>
          </div>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Grid cell size</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={gCellFeet}
                  onChange={(e) => setGCellFeet(Math.max(0, Number(e.target.value)))}
                  min={0}
                  placeholder="Feet"
                />
              </div>
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={gCellInches}
                  onChange={(e) => setGCellInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                  min={0}
                  max={11}
                  step={0.5}
                  placeholder="Inches"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500">Total: {inchesToFeetInches(gCell)}</span>
          </div>
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

      {/* Garden Layout Tools */}
      <div className={`${ui.card} ${ui.cardPad} space-y-4`}>
          <div>
            <p className="text-base font-semibold">Garden Layout Tools</p>
            <p className="text-xs text-slate-600 mt-0.5">Place beds, walkways, and gates</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Placement Mode</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  placementMode === 'bed'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setPlacementMode('bed');
                  setWalkwayDraft({ start: null, end: null, isDragging: false });
                }}
              >
                Beds
              </button>
              <button
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  placementMode === 'walkway'
                    ? 'bg-amber-100 border-amber-500 text-amber-900'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setPlacementMode('walkway');
                  setWalkwayDraft({ start: null, end: null, isDragging: false });
                }}
              >
                Walkways
              </button>
              <button
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  placementMode === 'gate'
                    ? 'bg-blue-100 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setPlacementMode('gate');
                  setWalkwayDraft({ start: null, end: null, isDragging: false });
                }}
              >
                Gates
              </button>
            </div>
            {placementMode === 'walkway' && (
              <p className="text-xs text-amber-700">Click and drag on the grid to create walkways</p>
            )}
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
                        <p>Size: {inchesToFeetInches(selectedBed.widthInches)} × {inchesToFeetInches(selectedBed.heightInches)}</p>
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
                      <div
                        key={b.id}
                        className={[
                          "rounded-lg border transition-colors",
                          selectedBedId === b.id
                            ? "border-emerald-400 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white",
                        ].join(" ")}
                      >
                        <button
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50/50"
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
                        <div className="border-t px-3 py-2">
                          <button
                            className="text-xs text-red-600 hover:text-red-700 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBedFromGarden(b.id);
                            }}
                            title="Remove this bed from the garden layout"
                          >
                            Remove from garden
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Garden canvas */}
        <div className={`${ui.card} ${ui.cardPad}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-base font-semibold">Garden Layout</p>
              {garden ? (
                <p className="text-xs text-slate-600">
                  {cols} × {rows} grid ({inchesToFeetInches(garden.widthInches)} × {inchesToFeetInches(garden.heightInches)} @ {inchesToFeetInches(garden.cellInches)} cells)
                </p>
              ) : null}
            </div>

            {garden ? (
              <div className="flex gap-2 items-center">
                <div className="flex gap-1 items-center border rounded-lg p-1">
                  <button
                    className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    onClick={handleZoomOut}
                    title="Zoom out"
                  >
                    −
                  </button>
                  <span className="px-2 text-xs text-slate-600 min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    onClick={handleZoomIn}
                    title="Zoom in"
                  >
                    +
                  </button>
                  <button
                    className="px-2 py-1 text-xs hover:bg-gray-100 rounded border-l"
                    onClick={handleZoomReset}
                    title="Reset zoom and pan"
                  >
                    Reset
                  </button>
                </div>
                <button
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                  onClick={handleRotate}
                  title={`Rotate garden view (currently ${rotation}°)`}
                >
                  ↻ Rotate
                </button>
              </div>
            ) : null}
          </div>

          {!garden ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-700">Set garden dimensions above and click "Save garden" to get started.</p>
            </div>
          ) : (
            <div
              className="mt-3 overflow-auto rounded-xl border bg-white p-3"
              style={{
                maxHeight: 'calc(100vh - 400px)', // Dynamic height based on viewport
                minHeight: '500px',
                cursor: isPanning ? 'grabbing' : 'default'
              }}
              onWheel={handleWheel}
            >
              <div
                ref={gridRef}
                className="relative touch-none select-none"
                style={{
                  width: cols * CELL_PX,
                  height: rows * CELL_PX,
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                }}
                onPointerMove={(e) => {
                  handlePanMove(e);
                  onGridPointerMove(e);
                }}
                onPointerUp={(e) => {
                  handlePanEnd();
                  onGridPointerUp(e);
                }}
                onPointerDown={handlePanStart}
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
                        title={
                          placementMode === 'walkway'
                            ? "Click and drag to create walkway"
                            : placementMode === 'gate'
                            ? "Click to place gate"
                            : selectedBed
                            ? `Place/move "${selectedBed.name}" here`
                            : "Select a bed"
                        }
                        onPointerDown={() => onGridCellPointerDown(x, y)}
                        onPointerEnter={() => onGridCellPointerEnter(x, y)}
                        onPointerUp={() => onGridCellPointerUp(x, y)}
                      />
                    ))
                  )}
                </div>

                {/* overlay: walkways */}
                <div
                  className="absolute inset-0 grid pointer-events-none"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
                    gridTemplateRows: `repeat(${rows}, ${CELL_PX}px)`,
                  }}
                >
                  {(garden?.walkways ?? []).map((w) => (
                    <div
                      key={w.id}
                      className="relative h-full bg-amber-200/60 border border-amber-400 pointer-events-auto"
                      style={{
                        gridColumnStart: w.x + 1,
                        gridRowStart: w.y + 1,
                        gridColumnEnd: w.x + 1 + w.width,
                        gridRowEnd: w.y + 1 + w.height,
                      }}
                      title={w.name || "Walkway"}
                    >
                      <button
                        className="absolute top-0.5 right-0.5 bg-white rounded-full w-5 h-5 text-xs hover:bg-red-50 border border-red-300 text-red-600"
                        onClick={() => deleteWalkway(w.id)}
                        title="Delete walkway"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Walkway draft preview */}
                  {placementMode === 'walkway' && walkwayDraft.start && walkwayDraft.end && (
                    <div
                      className="h-full bg-amber-300/40 border-2 border-dashed border-amber-500"
                      style={{
                        gridColumnStart: Math.min(walkwayDraft.start.x, walkwayDraft.end.x) + 1,
                        gridRowStart: Math.min(walkwayDraft.start.y, walkwayDraft.end.y) + 1,
                        gridColumnEnd: Math.max(walkwayDraft.start.x, walkwayDraft.end.x) + 2,
                        gridRowEnd: Math.max(walkwayDraft.start.y, walkwayDraft.end.y) + 2,
                      }}
                    />
                  )}
                </div>

                {/* overlay: gates */}
                <div
                  className="absolute inset-0 grid pointer-events-none"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
                    gridTemplateRows: `repeat(${rows}, ${CELL_PX}px)`,
                  }}
                >
                  {(garden?.gates ?? []).map((g) => (
                    <div
                      key={g.id}
                      className="relative h-full flex items-center justify-center bg-blue-200/60 border-2 border-blue-500 pointer-events-auto"
                      style={{
                        gridColumnStart: g.x + 1,
                        gridRowStart: g.y + 1,
                        gridColumnEnd: g.x + 1 + g.width,
                        gridRowEnd: g.y + 2,
                      }}
                      title={g.name || `Gate (${g.side})`}
                    >
                      <span className="text-xs font-bold text-blue-700">GATE</span>
                      <button
                        className="absolute top-0.5 right-0.5 bg-white rounded-full w-5 h-5 text-xs hover:bg-red-50 border border-red-300 text-red-600"
                        onClick={() => deleteGate(g.id)}
                        title="Delete gate"
                      >
                        ×
                      </button>
                    </div>
                  ))}
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
                            const dotColor = getStatusDotColor(p.status);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                className={`absolute h-2 w-2 rounded-full ${dotColor} opacity-80 hover:scale-110`}
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
                                  // Show plant info modal
                                  setSelectedPlacement(p);
                                  setShowPlantInfoModal(true);
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
                  <li><strong>Beds:</strong> Click grid cell to place, or drag bed blocks to reposition</li>
                  <li><strong>Walkways:</strong> Click and drag on grid to create rectangular walkways</li>
                  <li><strong>Gates:</strong> Click grid cell to place gate (auto-detects nearest edge)</li>
                  <li><strong>Zoom:</strong> Use +/− buttons, or Ctrl+Scroll wheel to zoom in/out</li>
                  <li><strong>Pan:</strong> Shift+Drag, Middle-click+Drag, or Ctrl+Drag to pan the view</li>
                  <li><strong>Rotate View:</strong> Click "Rotate" button to rotate entire garden layout</li>
                  <li>Hover over colored dots to see which plants are placed in beds</li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs font-medium text-slate-700 mb-2">Plant Status Colors:</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                    <span>Planned</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Planted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Growing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>Harvesting</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Harvested</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Removed</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Plant Info Modal */}
      <PlantInfoModal
        isOpen={showPlantInfoModal}
        plant={selectedPlacement?.plant || null}
        bedName={selectedPlacement?.bed.name}
        placementInfo={
          selectedPlacement
            ? {
                count: selectedPlacement.count,
                status: selectedPlacement.status || null,
              }
            : undefined
        }
        onClose={() => {
          setShowPlantInfoModal(false);
          setSelectedPlacement(null);
        }}
      />
    </div>
  );
}
