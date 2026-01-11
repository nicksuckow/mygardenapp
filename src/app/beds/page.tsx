"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    const res = await fetch("/api/beds");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Beds</h1>
        <p className="text-sm text-gray-600">
          Create a bed, then open it to lay out plants on a grid.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-3 sm:max-w-xl">
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

        <button
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
          onClick={createBed}
        >
          Create bed
        </button>

        {message ? <p className="text-sm">{message}</p> : null}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your beds</h2>
        {beds.length === 0 ? (
          <p className="text-sm text-gray-600">No beds yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {beds.map((b) => (
              <Link
                key={b.id}
                href={`/beds/${b.id}`}
                className="rounded-lg border p-3 hover:bg-gray-50"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-gray-600">
                    {b.widthInches}" × {b.heightInches}" @ {b.cellInches}"
                  </p>
                </div>
                <p className="mt-2 text-sm text-gray-700">Open layout →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
