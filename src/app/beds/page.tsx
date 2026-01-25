"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";

type Bed = {
  id: number;
  name: string;
  widthInches: number;
  heightInches: number;
  cellInches: number;
};

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [name, setName] = useState("My 4x8 Bed");
  const [widthInches, setWidthInches] = useState(96);
  const [heightInches, setHeightInches] = useState(48);
  const [cellInches, setCellInches] = useState(12);
  const [message, setMessage] = useState("");

  const gridCols = Math.max(1, Math.floor(widthInches / cellInches));
  const gridRows = Math.max(1, Math.floor(heightInches / cellInches));

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
      body: JSON.stringify({ name, widthInches, heightInches, cellInches }),
    });

    if (!res.ok) {
      setMessage("Failed to create bed.");
      return;
    }

    setMessage("Created!");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.h1}>Beds</h1>
        <p className={ui.sub}>Create a bed, then open it to lay out plants on a grid.</p>
      </div>

      <div className={`${ui.card} ${ui.cardPad} space-y-4 sm:max-w-2xl`}>
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

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Width (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={widthInches}
              onChange={(e) => setWidthInches(Number(e.target.value))}
              min={12}
            />
            <span className="text-xs text-slate-500">Physical width of your bed</span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Height (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={heightInches}
              onChange={(e) => setHeightInches(Number(e.target.value))}
              min={12}
            />
            <span className="text-xs text-slate-500">Physical height of your bed</span>
          </label>

          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Grid cell size (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={cellInches}
              onChange={(e) => setCellInches(Number(e.target.value))}
              min={1}
              step={0.5}
            />
            <span className="text-xs text-slate-500">
              Size of each grid square for plant placement. Common values: 6" (intensive), 12" (standard), 18" (large plants)
            </span>
          </label>
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
                        <p>Size: {b.widthInches}" × {b.heightInches}"</p>
                        <p>Grid: {cols} × {rows} cells ({b.cellInches}" each)</p>
                        <p className="text-slate-500">{cols * rows} planting spots</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link className={`${ui.btn} ${ui.btnPrimary} flex-1 text-center py-2`} href={`/beds/${b.id}`}>
                        Open layout
                      </Link>

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
  );
}
