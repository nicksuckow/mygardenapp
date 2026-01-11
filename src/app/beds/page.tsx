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

      <div className={`${ui.card} ${ui.cardPad} space-y-3 sm:max-w-xl`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Bed name</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Width (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={widthInches}
              onChange={(e) => setWidthInches(Number(e.target.value))}
              min={12}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Height (inches)</span>
            <input
              className="rounded border px-3 py-2 text-sm"
              type="number"
              value={heightInches}
              onChange={(e) => setHeightInches(Number(e.target.value))}
              min={12}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Grid size (inches)</span>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={cellInches}
              onChange={(e) => setCellInches(Number(e.target.value))}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
            </select>
          </label>
        </div>

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

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your beds</h2>

        {beds.length === 0 ? (
          <p className={ui.sub}>No beds yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {beds.map((b) => (
              <div key={b.id} className={`${ui.card} p-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-slate-600">
                      {b.widthInches}" × {b.heightInches}" @ {b.cellInches}"
                    </p>
                    <Link
                      href={`/beds/${b.id}`}
                      className="mt-2 inline-block text-sm text-emerald-700 hover:underline"
                    >
                      Open layout →
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link className={`${ui.btn} ${ui.btnSecondary} py-1`} href={`/beds/${b.id}`}>
                      Open
                    </Link>

                    <button
                      className={`${ui.btn} ${ui.btnDanger} py-1`}
                      onClick={() => deleteBed(b.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
