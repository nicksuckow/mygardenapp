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

const BED_HEADER_PX = 22;

function getPlacementStatus(placement: PlanPlacement): string | null {
  if (placement.harvestEndedDate) return "completed";
  if (placement.harvestStartedDate) return "harvesting";
  if (placement.transplantedDate || placement.directSowedDate) return "growing";
  if (placement.seedsStartedDate) return "planted";
  return "planned";
}

function getStatusDotColor(placement: PlanPlacement): string {
  if (placement.harvestEndedDate) return "bg-purple-500";
  if (placement.harvestStartedDate) return "bg-orange-500";
  if (placement.transplantedDate || placement.directSowedDate) return "bg-green-500";
  if (placement.seedsStartedDate) return "bg-blue-500";
  return "bg-slate-400";
}

function bedSizeInGardenCells(bed: Bed, gardenCellInches: number) {
  const wIn = bed.gardenRotated ? bed.heightInches : bed.widthInches;
  const hIn = bed.gardenRotated ? bed.widthInches : bed.heightInches;
  return {
    w: Math.max(1, Math.ceil(wIn / gardenCellInches)),
    h: Math.max(1, Math.ceil(hIn / gardenCellInches)),
  };
}

function dotPosPct(bed: Bed, p: PlanPlacement) {
  const w = p.w ?? 12;
  const h = p.h ?? 12;
  let cx = p.x + w / 2;
  let cy = p.y + h / 2;
  let bedWidth = bed.widthInches;
  let bedHeight = bed.heightInches;

  if (bed.gardenRotated) {
    const newCx = cy;
    const newCy = bedWidth - cx;
    cx = newCx;
    cy = newCy;
    bedWidth = bed.heightInches;
    bedHeight = bed.widthInches;
  }

  return {
    left: `${Math.max(0, Math.min((cx / bedWidth) * 100, 100))}%`,
    top: `${Math.max(0, Math.min((cy / bedHeight) * 100, 100))}%`,
  };
}

export default function GardenPage() {
  const [garden, setGarden] = useState<Garden | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [placements, setPlacements] = useState<PlanPlacement[]>([]);

  const CELL_PX = 40;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasAutoFit, setHasAutoFit] = useState(false);

  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  const [dotTip, setDotTip] = useState<{
    bedId: number;
    placementId: number;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const [selectedPlacement, setSelectedPlacement] = useState<PlanPlacement | null>(null);
  const [showPlantInfoModal, setShowPlantInfoModal] = useState(false);

  async function load() {
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
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const cols = useMemo(() => {
    if (!garden) return 0;
    return Math.max(1, Math.floor(garden.widthInches / garden.cellInches));
  }, [garden]);

  const rows = useMemo(() => {
    if (!garden) return 0;
    return Math.max(1, Math.floor(garden.heightInches / garden.cellInches));
  }, [garden]);

  const optimalZoom = useMemo(() => {
    if (!garden || containerSize.width === 0 || containerSize.height === 0) return 1;
    const gridPixelWidth = cols * CELL_PX;
    const gridPixelHeight = rows * CELL_PX;
    const padding = 32;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;
    const zoomToFitWidth = availableWidth / gridPixelWidth;
    const zoomToFitHeight = availableHeight / gridPixelHeight;
    return Math.max(0.1, Math.min(zoomToFitWidth, zoomToFitHeight, 10));
  }, [garden, cols, rows, containerSize]);

  useEffect(() => {
    if (!garden || containerSize.width === 0 || containerSize.height === 0) return;
    if (!hasAutoFit) {
      setZoom(optimalZoom);
      setHasAutoFit(true);
    }
  }, [garden, containerSize, optimalZoom, hasAutoFit]);

  // Re-fit when entering/exiting full screen
  useEffect(() => {
    setHasAutoFit(false);
  }, [isFullScreen]);

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

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.3, 10));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.3, 0.1));
  const handleZoomReset = useCallback(() => {
    setZoom(optimalZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [optimalZoom]);

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

  const handlePanEnd = () => setIsPanning(false);

  const handleRotate = () => {
    setRotation(r => ((r + 90) % 360) as 0 | 90 | 180 | 270);
  };

  // Escape key exits full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  if (!garden) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-700 mb-2">No Garden Set Up</h1>
          <p className="text-slate-500 mb-4">Create your garden layout to get started.</p>
          <Link className={`${ui.btn} ${ui.btnPrimary}`} href="/garden/edit">
            Set Up Garden →
          </Link>
        </div>
      </div>
    );
  }

  const gardenCanvas = (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{
        borderRadius: isFullScreen ? "0" : "12px",
        background: "linear-gradient(145deg, #8B7355 0%, #6B5344 50%, #5D4632 100%)",
        padding: "8px",
        boxShadow: isFullScreen ? "none" : "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)",
        cursor: isPanning ? 'grabbing' : 'default'
      }}
      onWheel={handleWheel}
    >
      {/* Inner grass/ground area */}
      <div
        className="w-full h-full overflow-hidden rounded-lg relative flex items-center justify-center"
        style={{ boxShadow: "inset 0 4px 12px rgba(0,0,0,0.3)" }}
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
          }}
          onPointerMove={handlePanMove}
          onPointerUp={handlePanEnd}
          onPointerDown={handlePanStart}
          onPointerLeave={handlePanEnd}
        >
          {/* Grid lines */}
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

          {/* Walkways */}
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
                className="h-full rounded-sm overflow-hidden"
                style={{
                  gridColumnStart: w.x + 1,
                  gridRowStart: w.y + 1,
                  gridColumnEnd: w.x + 1 + w.width,
                  gridRowEnd: w.y + 1 + w.height,
                  background: `
                    radial-gradient(circle at 20% 30%, rgba(180,160,140,0.3) 0%, transparent 20%),
                    radial-gradient(circle at 60% 70%, rgba(160,140,120,0.3) 0%, transparent 15%),
                    radial-gradient(circle at 80% 20%, rgba(170,150,130,0.3) 0%, transparent 18%),
                    radial-gradient(circle at 40% 80%, rgba(175,155,135,0.3) 0%, transparent 12%),
                    linear-gradient(180deg, #C4B5A0 0%, #B8A890 50%, #A89880 100%)
                  `,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15), inset 0 -1px 2px rgba(255,255,255,0.2)',
                  border: '1px solid rgba(139,119,101,0.5)',
                }}
                title={w.name || "Garden Path"}
              >
                {/* Gravel texture dots */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `
                    radial-gradient(circle, #8B7355 1px, transparent 1px),
                    radial-gradient(circle, #6B5344 1px, transparent 1px)
                  `,
                  backgroundSize: '8px 8px, 12px 12px',
                  backgroundPosition: '0 0, 4px 4px',
                }} />
              </div>
            ))}
          </div>

          {/* Gates */}
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
                className="h-full flex items-center justify-center rounded-sm overflow-hidden"
                style={{
                  gridColumnStart: g.x + 1,
                  gridRowStart: g.y + 1,
                  gridColumnEnd: g.x + 1 + g.width,
                  gridRowEnd: g.y + 2,
                  background: 'linear-gradient(180deg, #6B8E7B 0%, #5A7D6A 50%, #4A6D5A 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)',
                  border: '2px solid #3D5A4A',
                }}
                title={g.name || `Gate (${g.side})`}
              >
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur rounded px-1.5 py-0.5 shadow">
                  <span className="text-sm">🚪</span>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">{g.side}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Beds */}
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
              const plantCount = plantCountByBed.get(b.id) ?? 0;
              const bedPlacements = placementsByBed.get(b.id) ?? [];
              const showTip = dotTip && dotTip.bedId === b.id
                ? { left: dotTip.x, top: dotTip.y, label: dotTip.label }
                : null;

              return (
                <Link
                  key={b.id}
                  href={`/beds/${b.id}`}
                  className="relative h-full rounded-lg pointer-events-auto overflow-hidden cursor-pointer group"
                  style={{
                    gridColumnStart: x + 1,
                    gridRowStart: y + 1,
                    gridColumnEnd: x + 1 + size.w,
                    gridRowEnd: y + 1 + size.h,
                    background: "linear-gradient(145deg, #8B7355 0%, #6B5344 50%, #5D4632 100%)",
                    padding: "3px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                  title={`${b.name} - Click to edit`}
                  onPointerLeave={() => setDotTip((t) => (t?.bedId === b.id ? null : t))}
                >
                  <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/20 transition-colors rounded-lg z-10 pointer-events-none" />
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
                    <div className="absolute inset-x-0 z-20" style={{ top: BED_HEADER_PX + 1, bottom: 0 }}>
                      {bedPlacements.map((p) => {
                        const pos = dotPosPct(b, p);
                        const dotColor = getStatusDotColor(p);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`absolute h-2.5 w-2.5 rounded-full ${dotColor} opacity-90 hover:scale-125 transition-transform`}
                            style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)" }}
                            onPointerEnter={(ev) => {
                              ev.stopPropagation();
                              const rect = (ev.currentTarget.offsetParent as HTMLElement | null)?.getBoundingClientRect();
                              const dotRect = ev.currentTarget.getBoundingClientRect();
                              if (!rect) return;
                              setDotTip({
                                bedId: b.id,
                                placementId: p.id,
                                label: p.plant.name,
                                x: dotRect.left - rect.left + dotRect.width / 2,
                                y: dotRect.top - rect.top,
                              });
                            }}
                            onPointerLeave={(ev) => {
                              ev.stopPropagation();
                              setDotTip((t) => t && t.bedId === b.id && t.placementId === p.id ? null : t);
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
                      {showTip && (
                        <div
                          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 shadow"
                          style={{ left: showTip.left, top: showTip.top }}
                        >
                          {showTip.label}
                        </div>
                      )}
                    </div>
                    <div className="absolute right-1 top-1 z-20 inline-flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 shadow-sm">
                      <div className="min-w-0">
                        <div className="max-w-[120px] truncate text-[10px] font-semibold leading-tight text-slate-900">
                          {b.name}
                        </div>
                        <div className="text-[9px] text-slate-600 leading-tight">
                          {plantCount} plants
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay Controls - Top Right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        {/* Full screen toggle */}
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="bg-white/90 hover:bg-white shadow-lg rounded-lg p-2 text-slate-700 hover:text-slate-900 transition-colors"
          title={isFullScreen ? "Exit full screen (Esc)" : "Full screen"}
        >
          {isFullScreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>

        {/* Zoom controls */}
        <div className="bg-white/90 shadow-lg rounded-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="block w-full p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-200"
            title="Zoom in"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
          </button>
          <button
            onClick={handleZoomReset}
            className="block w-full px-2 py-1 hover:bg-slate-100 text-xs text-slate-600 border-b border-slate-200"
            title="Fit to screen"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomOut}
            className="block w-full p-2 hover:bg-slate-100 text-slate-700"
            title="Zoom out"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
            </svg>
          </button>
        </div>

        {/* Rotate */}
        <button
          onClick={handleRotate}
          className="bg-white/90 hover:bg-white shadow-lg rounded-lg p-2 text-slate-700 hover:text-slate-900 transition-colors"
          title={`Rotate (${rotation}°)`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* Legend - Bottom Left */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 shadow-lg rounded-lg px-3 py-2 max-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700">Plant Status</p>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-slate-600 -mr-1"
              title="Hide legend"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Started</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Growing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Harvesting</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Complete</span>
            </div>
          </div>
        </div>
      )}

      {/* Show legend button when hidden */}
      {!showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className="absolute bottom-4 left-4 z-20 bg-white/90 hover:bg-white shadow-lg rounded-lg p-2 text-slate-700"
          title="Show legend"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </button>
      )}

      {/* Info overlay - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-20 text-right">
        <p className="text-[11px] text-white/70 drop-shadow">
          {inchesToFeetInches(garden.widthInches)} × {inchesToFeetInches(garden.heightInches)} • {placedBeds.length} beds • {placements.length} plants
        </p>
        <p className="text-[10px] text-white/50 drop-shadow">
          Click bed to edit • Shift+drag to pan • Ctrl+scroll to zoom
        </p>
      </div>
    </div>
  );

  // Full screen mode
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Exit button overlay */}
        <div className="absolute top-4 left-4 z-30 flex gap-2">
          <button
            onClick={() => setIsFullScreen(false)}
            className="bg-white/90 hover:bg-white shadow-lg rounded-lg px-3 py-2 text-sm text-slate-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Exit Full Screen
          </button>
          <Link
            href="/garden/edit"
            className="bg-emerald-500 hover:bg-emerald-600 shadow-lg rounded-lg px-3 py-2 text-sm text-white flex items-center gap-2"
          >
            Edit Garden
          </Link>
        </div>
        {gardenCanvas}
        <PlantInfoModal
          isOpen={showPlantInfoModal}
          plant={selectedPlacement?.plant || null}
          bedName={selectedPlacement?.bed.name}
          placementInfo={
            selectedPlacement
              ? { count: selectedPlacement.count, status: getPlacementStatus(selectedPlacement) }
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

  // Normal mode with compact header
  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-4 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white p-2 rounded-lg shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-teal-700">Garden Layout</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link className={`${ui.btn} ${ui.btnPrimary} text-sm py-1.5`} href="/garden/edit">
            Edit Garden
          </Link>
          <Link className={`${ui.btn} ${ui.btnSecondary} text-sm py-1.5`} href="/beds">
            Beds
          </Link>
          <Link className={`${ui.btn} ${ui.btnSecondary} text-sm py-1.5`} href="/schedule">
            Schedule
          </Link>
        </div>
      </div>

      {/* Garden Canvas - fills remaining space */}
      <div className="flex-1 min-h-0 p-2">
        {gardenCanvas}
      </div>

      <PlantInfoModal
        isOpen={showPlantInfoModal}
        plant={selectedPlacement?.plant || null}
        bedName={selectedPlacement?.bed.name}
        placementInfo={
          selectedPlacement
            ? { count: selectedPlacement.count, status: getPlacementStatus(selectedPlacement) }
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
