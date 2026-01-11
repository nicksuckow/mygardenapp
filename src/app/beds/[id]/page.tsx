"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";

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

export default function BedLayoutPage({ params }: { params: { id: string } }) {
  const bedId = Number(params.id);

  const [bed, setBed] = useState<Bed | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const cols = useMemo(() => {
    if (!bed) return 0;
    return Math.max(1, Math.floor(bed.widthInches / bed.cellInches));
  }, [bed]);

  const rows = useMemo(() => {
    if (!bed) return 0;
    return Math.max(1, Math.floor(bed.heightInches / bed.cellInches));
  }, [bed]);

  async function load() {
    const bedRes = await fetch(`/api/beds/${bedId}`);
    const bedData = await bedRes.json();
    setBed(bedData);

    const plantsRes = await fetch("/api/plants");
    const plantsData = await plantsRes.json();
    setPlants(plantsData);

    if (plantsData.length > 0 && selectedPlantId == null) {
      setSelectedPlantId(plantsData[0].id);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placementMap = useMemo(() => {
    const map = new Map<string, Placement>();
    if (!bed) return map;
    for (const p of bed.placements) map.set(`${p.x},${p.y}`, p);
    return map;
  }, [bed]);

  async function placePlant(x: number, y: number) {
    setMessage("");
    if (!selectedPlantId) {
      setMessage("Add a plant first (Plants page).");
      return;
    }

    const res = await fetch(`/api/beds/${bedId}/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantId: selectedPlantId, x, y }),
    });

    if (!res.ok) {
      setMessage("Failed to place plant.");
      return;
    }
    await load();
  }

  async function clearCell(x: number, y: number) {
    setMessage("");
    const res = await fetch(`/api/beds/${bedId}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });

    if (!res.ok) {
      setMessage("Failed to clear cell.");
      return;
    }
    await load();
  }

  function onDragEnd(event: DragEndEvent) {
    const over = event.over?.id?.toString();
    const active = event.active?.id?.toString();
    if (!over || !active) return;
    if (!active.startsWith("plant-")) return;
    if (!over.startsWith("cell-")) return;

    const plantId = Number(active.replace("plant-", ""));
    setSelectedPlantId(plantId);

    const [, xStr, yStr] = over.split("-");
    placePlant(Number(xStr), Number(yStr));
  }

  if (!bed) return <p className="text-sm text-gray-600">Loading…</p>;

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
          <p className="text-sm font-medium">Plant palette</p>

          {plants.length === 0 ? (
            <p className="text-sm text-gray-600">
              No plants yet. Add some on the Plants page.
            </p>
          ) : (
            <>
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

              <DndContext onDragEnd={onDragEnd}>
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">Drag a plant onto the grid</p>
                  <div className="flex flex-wrap gap-2">
                    {plants.map((p) => (
                      <DraggablePlant key={p.id} id={`plant-${p.id}`} name={p.name} />
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium">Bed grid</p>

                  <div
                    className="mt-2 grid gap-1 rounded-lg border p-2"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: rows }).map((_, y) =>
                      Array.from({ length: cols }).map((__, x) => {
                        const placed = placementMap.get(`${x},${y}`);
                        return (
                          <DroppableCell
                            key={`${x},${y}`}
                            id={`cell-${x}-${y}`}
                            label={placed?.plant.name ?? ""}
                            onClick={() => placePlant(x, y)}
                            onRightClick={(e) => {
                              e.preventDefault();
                              clearCell(x, y);
                            }}
                          />
                        );
                      })
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-600">
                    Tip: click to place selected plant. Right-click to clear.
                  </p>
                </div>
              </DndContext>
            </>
          )}

          {message ? <p className="text-sm">{message}</p> : null}
        </div>

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-sm font-medium">What’s planted</p>
          {bed.placements.length === 0 ? (
            <p className="text-sm text-gray-600">Nothing placed yet.</p>
          ) : (
            <ul className="text-sm list-disc pl-5">
              {bed.placements
                .slice()
                .sort((a, b) => (a.y - b.y) || (a.x - b.x))
                .map((p) => (
                  <li key={p.id}>
                    {p.plant.name} at ({p.x},{p.y})
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DraggablePlant({ id, name }: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
    >
      {name}
    </div>
  );
}

function DroppableCell({
  id,
  label,
  onClick,
  onRightClick,
}: {
  id: string;
  label: string;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      onContextMenu={onRightClick}
      className={`aspect-square rounded border text-[10px] p-1 leading-tight ${
        isOver ? "bg-gray-100" : "bg-white"
      }`}
      title="Click to place selected plant. Right-click to clear."
    >
      {label ? <span className="font-medium">{label}</span> : null}
    </button>
  );
}
