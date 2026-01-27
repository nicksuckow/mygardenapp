"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";
import { inchesToFeetInches } from "@/lib/dimensions";

type Bed = {
  id: number;
  name: string;
  widthInches: number;
  heightInches: number;
  cellInches: number;
  notes?: string | null;
};

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [name, setName] = useState("My 4x8 Bed");

  // Width in feet and inches
  const [widthFeet, setWidthFeet] = useState(8);
  const [widthInches, setWidthInches] = useState(0);

  // Height in feet and inches
  const [heightFeet, setHeightFeet] = useState(4);
  const [heightInches, setHeightInches] = useState(0);

  // Cell size in feet and inches
  const [cellFeet, setCellFeet] = useState(1);
  const [cellInches, setCellInches] = useState(0);

  // Notes for the bed
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");

  // Calculate total inches
  const totalWidthInches = widthFeet * 12 + widthInches;
  const totalHeightInches = heightFeet * 12 + heightInches;
  const totalCellInches = cellFeet * 12 + cellInches;

  const gridCols = Math.max(1, Math.floor(totalWidthInches / totalCellInches));
  const gridRows = Math.max(1, Math.floor(totalHeightInches / totalCellInches));

  async function load() {
    const res = await fetch("/api/beds", { cache: "no-store" });
    const data = await res.json();
    setBeds(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createBed() {
    setMessage("");
    if (!name.trim()) {
      setMessage("Bed name is required.");
      return;
    }

    const res = await fetch("/api/beds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        widthInches: totalWidthInches,
        heightInches: totalHeightInches,
        cellInches: totalCellInches,
        notes: notes.trim() || null,
      }),
    });

    if (!res.ok) {
      setMessage("Failed to create bed.");
      return;
    }

    setMessage("Created!");
    setNotes(""); // Reset notes after creation
    await load();
  }

  async function deleteBed(id: number) {
    setMessage("");
    const ok = confirm("Delete this bed? This cannot be undone.");
    if (!ok) return;

    const res = await fetch(`/api/beds/${id}`, { method: "DELETE" });
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

    setMessage("Deleted.");
    await load();
  }

  async function duplicateBed(id: number, name: string) {
    setMessage("");
    const res = await fetch(`/api/beds/${id}/duplicate`, { method: "POST" });
    const text = await res.text();

    if (!res.ok) {
      try {
        const j = JSON.parse(text);
        setMessage(j?.error ?? `Duplicate failed (${res.status})`);
      } catch {
        setMessage(`Duplicate failed (${res.status})`);
      }
      return;
    }

    setMessage(`Duplicated "${name}"!`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-100 p-6">
        {/* Decorative grid pattern */}
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-32 h-32 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white p-2.5 rounded-xl shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              🌾 Garden Beds
            </h1>
            <p className="text-amber-900 text-sm mt-1">
              Create a bed, then open it to lay out plants on a grid.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Create bed form */}
        <div className={`${ui.card} ${ui.cardPad} space-y-4`}>
          <div>
            <h2 className="text-base font-semibold">Create a new bed</h2>
          <p className="text-sm text-slate-600">Define the physical dimensions and grid spacing for plant placement</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Bed name</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Front Yard Bed A"
            />
          </label>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Width</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={widthFeet}
                  onChange={(e) => setWidthFeet(Math.max(0, Number(e.target.value)))}
                  min={0}
                  placeholder="Feet"
                />
              </div>
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={widthInches}
                  onChange={(e) => setWidthInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                  min={0}
                  max={11}
                  placeholder="Inches"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500">Physical width of your bed (Total: {inchesToFeetInches(totalWidthInches)})</span>
          </div>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Height</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(Math.max(0, Number(e.target.value)))}
                  min={0}
                  placeholder="Feet"
                />
              </div>
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={heightInches}
                  onChange={(e) => setHeightInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                  min={0}
                  max={11}
                  placeholder="Inches"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500">Physical height of your bed (Total: {inchesToFeetInches(totalHeightInches)})</span>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Grid cell size</span>
            <div className="flex gap-2 max-w-md">
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={cellFeet}
                  onChange={(e) => setCellFeet(Math.max(0, Number(e.target.value)))}
                  min={0}
                  placeholder="Feet"
                />
              </div>
              <div className="flex-1">
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  type="number"
                  value={cellInches}
                  onChange={(e) => setCellInches(Math.max(0, Math.min(11, Number(e.target.value))))}
                  min={0}
                  max={11}
                  step={0.5}
                  placeholder="Inches"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500">
              Size of each grid square for plant placement (Total: {inchesToFeetInches(totalCellInches)}). Common: 6&quot; (intensive), 1&apos; (standard), 1&apos;6&quot; (large plants)
            </span>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Notes (optional)</span>
            <textarea
              className="w-full rounded border px-3 py-2 text-sm resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., North side of garden, gets afternoon shade, raised bed with compost mix"
              rows={2}
            />
          </div>
        </div>

        {gridCols > 0 && gridRows > 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-900">Grid Preview</p>
            <p className="text-sm text-emerald-700">
              This will create a <span className="font-semibold">{gridCols} × {gridRows}</span> grid
              ({gridCols * gridRows} planting cells total)
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={createBed}>
            Create bed
          </button>

          {message ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </div>
          ) : null}
        </div>
      </div>

        {/* Your beds */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your beds</h2>

        {beds.length === 0 ? (
          <p className={ui.sub}>No beds yet. Create one above to get started.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {beds.map((b) => {
              const cols = Math.max(1, Math.floor(b.widthInches / b.cellInches));
              const rows = Math.max(1, Math.floor(b.heightInches / b.cellInches));

              return (
                <div key={b.id} className={`${ui.card} p-4 hover:shadow-md transition-shadow`}>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-base">{b.name}</p>
                      <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                        <p>Size: {inchesToFeetInches(b.widthInches)} × {inchesToFeetInches(b.heightInches)}</p>
                        <p>Grid: {cols} × {rows} cells ({inchesToFeetInches(b.cellInches)} each)</p>
                        <p className="text-slate-500">{cols * rows} planting spots</p>
                      </div>
                      {b.notes && (
                        <p className="mt-2 text-xs text-slate-600 italic line-clamp-2">{b.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link className={`${ui.btn} ${ui.btnPrimary} flex-1 min-w-[100px] text-center py-2`} href={`/beds/${b.id}`}>
                        Open
                      </Link>

                      <button
                        className={`${ui.btn} ${ui.btnSecondary} px-3 py-2`}
                        onClick={() => duplicateBed(b.id, b.name)}
                        title="Duplicate bed"
                      >
                        Copy
                      </button>

                      <button
                        className={`${ui.btn} ${ui.btnDanger} px-3 py-2`}
                        onClick={() => deleteBed(b.id)}
                        title="Delete bed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
