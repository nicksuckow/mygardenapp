"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  seedsStartedDate?: string | null;
  transplantedDate?: string | null;
  directSowedDate?: string | null;
  harvestStartedDate?: string | null;
  harvestEndedDate?: string | null;
  bed: { id: number; name: string };
  plant: FullPlantData;
};

// Header height reserved for dots offset (still a small top margin)
const BED_HEADER_PX = 22;

// Helper function to get status string from placement dates
function getPlacementStatus(placement: PlanPlacement): string | null {
  if (placement.harvestEndedDate) return "completed";
  if (placement.harvestStartedDate) return "harvesting";
  if (placement.transplantedDate || placement.directSowedDate) return "growing";
  if (placement.seedsStartedDate) return "planted";
  return "planned";
}

// Helper function to get status color for dots based on spring tracking
function getStatusDotColor(placement: PlanPlacement): string {
  // Priority: latest stage completed
  if (placement.harvestEndedDate) {
    return "bg-purple-500"; // purple - harvest complete
  }
  if (placement.harvestStartedDate) {
    return "bg-orange-500"; // orange - harvesting
  }
  if (placement.transplantedDate || placement.directSowedDate) {
    return "bg-green-500"; // green - growing in ground
  }
  if (placement.seedsStartedDate) {
    return "bg-blue-500"; // blue - seeds started indoors
  }
  return "bg-slate-400"; // gray - planned only
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

// Bed card component for dragging into garden
function BedCard({
  bed,
  plantCount,
  onDragStart,
  onDragEnd,
  isDragging,
  isPlaced,
}: {
  bed: Bed;
  plantCount: number;
  onDragStart: (bed: Bed) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isPlaced: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("bedId", bed.id.toString());
        e.dataTransfer.effectAllowed = "copy";
        onDragStart(bed);
      }}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      <div
        className="w-10 h-10 rounded-lg border-2 flex items-center justify-center font-medium text-sm flex-shrink-0"
        style={{
          background: isPlaced
            ? "linear-gradient(145deg, #7a9a5f 0%, #5a7a4f 100%)"
            : "linear-gradient(145deg, #8B7355 0%, #6B5344 100%)",
          borderColor: isPlaced ? "#10b981" : "#8B7355",
          color: "white",
        }}
      >
        {bed.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{bed.name}</p>
        <p className="text-xs text-slate-500">
          {inchesToFeetInches(bed.widthInches)} × {inchesToFeetInches(bed.heightInches)}
          {isPlaced && " • Placed"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500">{plantCount} plants</p>
      </div>
    </div>
  );
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

  // Bed search state
  const [bedSearch, setBedSearch] = useState("");
  const [isBedDropdownOpen, setIsBedDropdownOpen] = useState(false);
  const [selectedBedForDrag, setSelectedBedForDrag] = useState<Bed | null>(null);
  const [isDraggingBedCard, setIsDraggingBedCard] = useState(false);
  const bedSearchInputRef = useRef<HTMLInputElement | null>(null);

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

  // Container size tracking for auto-fit
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasAutoFit, setHasAutoFit] = useState(false);

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

    // Debug: log bed positions after load
    console.log('[load] Beds loaded:', (Array.isArray(bJson) ? bJson : []).map((b: Bed) => ({
      id: b.id,
      name: b.name,
      gardenX: b.gardenX,
      gardenY: b.gardenY,
    })));

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

  // Track container size for auto-fit - re-run when garden loads
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    // Small delay to ensure container is fully rendered
    const timeout = setTimeout(updateSize, 50);
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [garden]); // Re-run when garden loads so containerRef is available

  // Reset auto-fit when garden changes (e.g., dimensions change)
  useEffect(() => {
    setHasAutoFit(false);
  }, [garden?.widthInches, garden?.heightInches, garden?.cellInches]);

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

  // Auto-fit zoom to container when garden loads
  useEffect(() => {
    if (!garden || hasAutoFit || containerSize.width === 0 || containerSize.height === 0) return;

    const gridPixelWidth = cols * CELL_PX;
    const gridPixelHeight = rows * CELL_PX;

    // Calculate zoom to fit entire garden in container (with some padding)
    const padding = 32;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;

    const zoomToFitWidth = availableWidth / gridPixelWidth;
    const zoomToFitHeight = availableHeight / gridPixelHeight;

    // Use the smaller zoom to ensure it fits both dimensions
    // No minimum - allow zooming out as far as needed to show full garden
    const fitZoom = Math.min(zoomToFitWidth, zoomToFitHeight, 10);

    setZoom(Math.max(0.1, fitZoom)); // Allow down to 10% zoom for very large gardens
    setHasAutoFit(true);
  }, [garden, cols, rows, containerSize, hasAutoFit]);

  const placedBeds = useMemo(
    () => beds.filter((b) => b.gardenX != null && b.gardenY != null),
    [beds]
  );

  // Keep selectedBedForDrag in sync with latest beds data after load()
  useEffect(() => {
    setSelectedBedForDrag(prev => {
      if (!prev) return null;
      const updated = beds.find(b => b.id === prev.id);
      if (!updated) return null; // Bed was deleted
      // Return the updated bed object if it's different
      if (
        updated.gardenX !== prev.gardenX ||
        updated.gardenY !== prev.gardenY ||
        updated.gardenRotated !== prev.gardenRotated ||
        updated.name !== prev.name
      ) {
        return updated;
      }
      return prev; // No changes, keep same reference
    });
  }, [beds]);

  // Fuzzy filter beds based on search query
  const filteredBeds = useMemo(() => {
    if (!bedSearch.trim()) return beds;
    const query = bedSearch.toLowerCase();
    return beds.filter((bed) => {
      const name = bed.name.toLowerCase();
      // Exact substring match
      if (name.includes(query)) return true;
      // Fuzzy match: check if all characters appear in order
      let queryIdx = 0;
      for (const char of name) {
        if (char === query[queryIdx]) queryIdx++;
        if (queryIdx === query.length) return true;
      }
      return false;
    });
  }, [beds, bedSearch]);

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

    const bed = beds.find(b => b.id === bedId);
    console.log('[setBedPosition] Moving bed:', {
      bedId,
      bedName: bed?.name,
      from: { x: bed?.gardenX, y: bed?.gardenY },
      to: { x, y }
    });

    const res = await fetch(`/api/beds/${bedId}/position`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gardenX: x, gardenY: y }),
    });

    const text = await res.text();
    console.log('[setBedPosition] API response:', { status: res.status, text });

    if (!res.ok) {
      try {
        setMessage(JSON.parse(text)?.error ?? `Place failed (${res.status})`);
      } catch {
        setMessage(`Place failed (${res.status})`);
      }
      return;
    }

    console.log('[setBedPosition] Success, reloading beds...');
    await load();
    console.log('[setBedPosition] Reload complete');
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
    setZoom(z => Math.max(z / 1.5, 0.1));
  };

  const handleZoomReset = useCallback(() => {
    if (!garden || containerSize.width === 0 || containerSize.height === 0) {
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const gridPixelWidth = cols * CELL_PX;
    const gridPixelHeight = rows * CELL_PX;

    const padding = 32;
    const zoomToFitWidth = (containerSize.width - padding) / gridPixelWidth;
    const zoomToFitHeight = (containerSize.height - padding) / gridPixelHeight;

    // Fit entire garden - allow zooming out as far as needed
    setZoom(Math.max(0.1, Math.min(zoomToFitWidth, zoomToFitHeight, 10)));
    setPanOffset({ x: 0, y: 0 });
  }, [garden, cols, rows, containerSize]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      if (delta > 0) {
        setZoom(z => Math.min(z * 1.1, 10));
      } else {
        setZoom(z => Math.max(z / 1.1, 0.1));
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

  // Bed card drag handlers
  function handleBedCardDragStart(bed: Bed) {
    setIsDraggingBedCard(true);
    setDragBedId(bed.id);
    setSelectedBedId(bed.id);
  }

  function handleBedCardDragEnd() {
    setIsDraggingBedCard(false);
    setDragBedId(null);
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

  // State for sidebar collapse on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100">
      {/* Compact header */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-gradient-to-br from-teal-400 to-cyan-500 text-white p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Edit Garden Layout</h1>
            {garden && (
              <p className="text-xs text-slate-500">
                {cols} × {rows} cells • {inchesToFeetInches(garden.widthInches)} × {inchesToFeetInches(garden.heightInches)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="lg:hidden px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "Hide Tools" : "Show Tools"}
          </button>
          <Link className={`${ui.btn} ${ui.btnSecondary} text-sm`} href="/beds">
            Manage Beds
          </Link>
          <Link className={`${ui.btn} ${ui.btnPrimary} text-sm`} href="/garden">
            ← Back
          </Link>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div className="flex-shrink-0 bg-slate-50 border-b px-4 py-2">
          <p className="text-sm text-slate-700">{message}</p>
        </div>
      )}

      {/* Main content: sidebar + canvas */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar - tools and controls */}
        <div
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } flex-shrink-0 bg-white border-r overflow-hidden transition-all duration-200`}
        >
          <div className="w-80 h-full overflow-y-auto p-4 space-y-4">
            {/* Garden dimensions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Garden Dimensions</p>
                <button
                  className={`${ui.btn} ${ui.btnPrimary} text-xs py-1 px-2`}
                  onClick={saveGarden}
                >
                  Save
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 w-14">Width</label>
                  <div className="flex gap-1 flex-1">
                    <input
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      type="number"
                      value={gWidthFeet}
                      onChange={(e) => setGWidthFeet(Math.max(0, Number(e.target.value)))}
                      min={0}
                    />
                    <span className="text-xs text-slate-500 self-center">ft</span>
                    <input
                      className="w-14 rounded border px-2 py-1.5 text-sm"
                      type="number"
                      value={gWidthInches}
                      onChange={(e) => setGWidthInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                      min={0}
                      max={11}
                    />
                    <span className="text-xs text-slate-500 self-center">in</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 w-14">Height</label>
                  <div className="flex gap-1 flex-1">
                    <input
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      type="number"
                      value={gHeightFeet}
                      onChange={(e) => setGHeightFeet(Math.max(0, Number(e.target.value)))}
                      min={0}
                    />
                    <span className="text-xs text-slate-500 self-center">ft</span>
                    <input
                      className="w-14 rounded border px-2 py-1.5 text-sm"
                      type="number"
                      value={gHeightInches}
                      onChange={(e) => setGHeightInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                      min={0}
                      max={11}
                    />
                    <span className="text-xs text-slate-500 self-center">in</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 w-14">Cell</label>
                  <div className="flex gap-1 flex-1">
                    <input
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      type="number"
                      value={gCellFeet}
                      onChange={(e) => setGCellFeet(Math.max(0, Number(e.target.value)))}
                      min={0}
                    />
                    <span className="text-xs text-slate-500 self-center">ft</span>
                    <input
                      className="w-14 rounded border px-2 py-1.5 text-sm"
                      type="number"
                      value={gCellInches}
                      onChange={(e) => setGCellInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                      min={0}
                      max={11}
                    />
                    <span className="text-xs text-slate-500 self-center">in</span>
                  </div>
                </div>
              </div>

              {gardenGridCols > 0 && gardenGridRows > 0 && (
                <p className="text-xs text-slate-500">
                  Grid: {gardenGridCols} × {gardenGridRows} = {gardenGridCols * gardenGridRows} cells
                </p>
              )}
            </div>

            <hr className="border-slate-200" />

            {/* Placement mode */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Placement Mode</p>
              <div className="flex gap-1">
                <button
                  className={`flex-1 px-2 py-1.5 text-xs rounded border transition-colors ${
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
                  className={`flex-1 px-2 py-1.5 text-xs rounded border transition-colors ${
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
                  className={`flex-1 px-2 py-1.5 text-xs rounded border transition-colors ${
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
                <p className="text-xs text-amber-700">Drag on the grid to create walkways</p>
              )}
              {placementMode === 'gate' && (
                <p className="text-xs text-blue-700">Click grid cell to place gate</p>
              )}
            </div>

            <hr className="border-slate-200" />

            {/* Bed selection */}
            {beds.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-700 mb-2">No beds created yet.</p>
                <Link className={`${ui.btn} ${ui.btnPrimary} text-xs w-full`} href="/beds">
                  Create your first bed →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search input */}
                <div className="relative">
                  <input
                    ref={bedSearchInputRef}
                    type="text"
                    placeholder="Search beds..."
                    value={bedSearch}
                    onChange={(e) => {
                      setBedSearch(e.target.value);
                      setIsBedDropdownOpen(true);
                    }}
                    onFocus={() => setIsBedDropdownOpen(true)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {bedSearch && (
                    <button
                      onClick={() => {
                        setBedSearch("");
                        setIsBedDropdownOpen(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Click outside to close dropdown */}
                {isBedDropdownOpen && (
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsBedDropdownOpen(false)}
                  />
                )}

                {/* Dropdown results */}
                {isBedDropdownOpen && bedSearch && (
                  <div className="relative z-20 border rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                    {filteredBeds.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">No beds found</p>
                    ) : (
                      filteredBeds.map((bed) => {
                        const isPlaced = bed.gardenX != null && bed.gardenY != null;
                        return (
                          <button
                            key={bed.id}
                            onClick={() => {
                              setSelectedBedForDrag(bed);
                              setSelectedBedId(bed.id);
                              setBedSearch("");
                              setIsBedDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 text-left border-b last:border-b-0"
                          >
                            <div
                              className="w-6 h-6 rounded border flex items-center justify-center text-xs flex-shrink-0"
                              style={{
                                background: isPlaced
                                  ? "linear-gradient(145deg, #7a9a5f 0%, #5a7a4f 100%)"
                                  : "linear-gradient(145deg, #8B7355 0%, #6B5344 100%)",
                                borderColor: isPlaced ? "#10b981" : "#8B7355",
                                color: "white",
                              }}
                            >
                              {bed.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{bed.name}</p>
                              <p className="text-xs text-slate-500">
                                {inchesToFeetInches(bed.widthInches)} × {inchesToFeetInches(bed.heightInches)}
                                {isPlaced && " • Placed"}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Selected bed to drag */}
                {selectedBedForDrag && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Drag to place in garden:</p>
                    <div className="relative">
                      <BedCard
                        bed={selectedBedForDrag}
                        plantCount={plantCountByBed.get(selectedBedForDrag.id) ?? 0}
                        onDragStart={handleBedCardDragStart}
                        onDragEnd={handleBedCardDragEnd}
                        isDragging={isDraggingBedCard && dragBedId === selectedBedForDrag.id}
                        isPlaced={selectedBedForDrag.gardenX != null}
                      />
                      <div className="absolute -top-1 -right-1 flex gap-1">
                        {selectedBedForDrag.gardenX != null && (
                          <button
                            onClick={() => rotateBed(selectedBedForDrag.id, !selectedBedForDrag.gardenRotated)}
                            className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow hover:bg-blue-600"
                            title="Rotate 90°"
                          >
                            ↻
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBedForDrag(null)}
                          className="w-5 h-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold shadow hover:bg-gray-500"
                          title="Clear selection"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedBedForDrag && !isBedDropdownOpen && (
                  <p className="text-xs text-gray-500">
                    Search and select a bed to drag onto the garden
                  </p>
                )}

                {/* Placed beds list */}
                {placedBeds.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1">
                      In Garden ({placedBeds.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {placedBeds.map((b) => (
                        <div
                          key={b.id}
                          className={`text-xs p-2 rounded border cursor-pointer transition-colors ${
                            selectedBedId === b.id
                              ? "border-emerald-400 bg-emerald-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                          onClick={() => {
                            setSelectedBedId(b.id);
                            setSelectedBedForDrag(b);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{b.name}</span>
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBedFromGarden(b.id);
                              }}
                              title="Remove from garden"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-slate-500">
                            {plantCountByBed.get(b.id) ?? 0} plants • {b.gardenRotated ? "rotated" : "normal"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            <hr className="border-slate-200" />

            {/* Legend */}
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Plant Status</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span>Planned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Seeds Started</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>In Ground</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>Harvesting</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Harvested</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* Help */}
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Tips:</strong></p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Click grid to place bed</li>
                <li>Drag beds to reposition</li>
                <li>Ctrl+Scroll to zoom</li>
                <li>Shift+Drag to pan</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main canvas area */}
        <div className="flex-1 relative min-w-0">
          {!garden ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center p-6">
                <p className="text-slate-700 mb-2">Set garden dimensions and click "Save" to get started.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Garden canvas - fills available space */}
              <div
                ref={containerRef}
                className="absolute inset-0 overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #8B7355 0%, #6B5344 50%, #5D4632 100%)",
                  cursor: isPanning ? 'grabbing' : 'default'
                }}
                onWheel={handleWheel}
              >
                {/* Inner grass/ground area */}
                <div
                  className="absolute inset-2 overflow-hidden rounded-lg flex items-center justify-center"
                  style={{
                    boxShadow: "inset 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    ref={gridRef}
                    className="relative touch-none select-none"
                    style={{
                      width: cols * CELL_PX * zoom,
                      height: rows * CELL_PX * zoom,
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                      background: `
                        radial-gradient(circle at 20% 30%, #4a6741 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, #3d5a35 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, #527a48 0%, transparent 70%),
                        linear-gradient(180deg, #4a6741 0%, #3d5a35 50%, #456b3c 100%)
                      `,
                      backgroundSize: "100% 100%",
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                      // Update drag preview position
                      const cell = pointerToCell(e.clientX, e.clientY);
                      if (cell) setDragPreview(cell);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const bedId = e.dataTransfer.getData("bedId");
                      const cell = pointerToCell(e.clientX, e.clientY);
                      if (bedId && cell) {
                        setBedPosition(Number(bedId), cell.x, cell.y);
                      }
                      handleBedCardDragEnd();
                    }}
                    onDragLeave={() => {
                      setDragPreview(null);
                    }}
                  >
                    {/* Grid lines overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: `${CELL_PX * zoom}px ${CELL_PX * zoom}px`,
                      }}
                    />
                    {/* grid buttons (click-to-place) */}
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, ${CELL_PX * zoom}px)`,
                        gridTemplateRows: `repeat(${rows}, ${CELL_PX * zoom}px)`,
                      }}
                    >
                      {Array.from({ length: rows }).map((_, y) =>
                        Array.from({ length: cols }).map((__, x) => (
                          <button
                            key={`${x},${y}`}
                            className="border border-white/10 hover:bg-white/20 transition-colors"
                            style={{ width: CELL_PX * zoom, height: CELL_PX * zoom }}
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
                        gridTemplateColumns: `repeat(${cols}, ${CELL_PX * zoom}px)`,
                        gridTemplateRows: `repeat(${rows}, ${CELL_PX * zoom}px)`,
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
                        gridTemplateColumns: `repeat(${cols}, ${CELL_PX * zoom}px)`,
                        gridTemplateRows: `repeat(${rows}, ${CELL_PX * zoom}px)`,
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
                        gridTemplateColumns: `repeat(${cols}, ${CELL_PX * zoom}px)`,
                        gridTemplateRows: `repeat(${rows}, ${CELL_PX * zoom}px)`,
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
                            className="relative h-full rounded-lg cursor-grab active:cursor-grabbing pointer-events-auto overflow-hidden"
                            style={{
                              gridColumnStart: x + 1,
                              gridRowStart: y + 1,
                              gridColumnEnd: x + 1 + size.w,
                              gridRowEnd: y + 1 + size.h,
                              background: isSelected
                                ? "linear-gradient(145deg, #7a9a5f 0%, #5a7a4f 50%, #4a6a3f 100%)"
                                : "linear-gradient(145deg, #8B7355 0%, #6B5344 50%, #5D4632 100%)",
                              padding: "3px",
                              boxShadow: isSelected
                                ? "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 2px #10b981"
                                : "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
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
                            {/* Inner soil area */}
                            <div
                              className="w-full h-full rounded overflow-hidden relative"
                              style={{
                                background: `
                                  radial-gradient(circle at 30% 40%, #5D4E37 0%, transparent 40%),
                                  radial-gradient(circle at 70% 60%, #4A3F2E 0%, transparent 40%),
                                  linear-gradient(180deg, #5A4A3A 0%, #4D3F32 100%)
                                `,
                                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                              }}
                            >
                              {/* Dots (hoverable) */}
                              <div
                                className="absolute inset-x-0 z-10"
                                style={{ top: BED_HEADER_PX + 1, bottom: 0 }}
                              >
                                {bedPlacements.map((p) => {
                                  const pos = dotPosPct(b, p);
                                  const dotColor = getStatusDotColor(p);
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
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                        setSelectedPlacement(p);
                                        setShowPlantInfoModal(true);
                                      }}
                                      title={p.plant.name}
                                    />
                                  );
                                })}

                                {/* Custom tooltip */}
                                {showTip && (
                                  <div
                                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 shadow"
                                    style={{
                                      left: showTip.left,
                                      top: showTip.top,
                                    }}
                                  >
                                    {showTip.label}
                                  </div>
                                )}
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
                          </div>
                        );
                      })}
                    </div>

                    {/* drag preview outline */}
                    {dragBedId && previewBed && dragPreview && (
                      <div
                        className="absolute rounded-lg border-2 border-emerald-400 bg-emerald-100/40 pointer-events-none"
                        style={{
                          left: dragPreview.x * CELL_PX * zoom,
                          top: dragPreview.y * CELL_PX * zoom,
                          width: previewBed.size.w * CELL_PX * zoom,
                          height: previewBed.size.h * CELL_PX * zoom,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Overlay controls (top-right) */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {/* Zoom controls */}
                <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border p-1 flex flex-col gap-1">
                  <button
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-lg font-medium"
                    onClick={handleZoomIn}
                    title="Zoom in"
                  >
                    +
                  </button>
                  <div className="text-xs text-center text-slate-600 py-1 border-y">
                    {Math.round(zoom * 100)}%
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-lg font-medium"
                    onClick={handleZoomOut}
                    title="Zoom out"
                  >
                    −
                  </button>
                </div>

                {/* Rotate button */}
                <button
                  className="bg-white/95 backdrop-blur rounded-lg shadow-lg border p-2 hover:bg-slate-100"
                  onClick={handleRotate}
                  title={`Rotate view (${rotation}°)`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                {/* Auto-fit button */}
                <button
                  className="bg-white/95 backdrop-blur rounded-lg shadow-lg border p-2 hover:bg-slate-100"
                  onClick={handleZoomReset}
                  title="Auto-fit to screen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>

              {/* Garden info overlay (bottom-left) */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-lg border px-3 py-2">
                <p className="text-xs text-slate-600">
                  {inchesToFeetInches(garden.widthInches)} × {inchesToFeetInches(garden.heightInches)}
                  <span className="mx-1">•</span>
                  {cols} × {rows} cells
                  <span className="mx-1">•</span>
                  {placedBeds.length} beds
                </p>
              </div>
            </>
          )}
        </div>
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
                status: getPlacementStatus(selectedPlacement),
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
