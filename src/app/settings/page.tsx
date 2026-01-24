"use client";

import { useEffect, useState } from "react";

type Settings = {
  id: number;
  lastSpringFrost: string;
  firstFallFrost: string;
  zone: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState("");
  const [lastSpringFrost, setLastSpringFrost] = useState("");
  const [firstFallFrost, setFirstFallFrost] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const text = await res.text();
  
        if (!res.ok) {
          setMessage(`Failed to load settings (error ${res.status}).`);
          setLoading(false);
          return;
        }

        const data: Settings | null = text ? JSON.parse(text) : null;

        if (data) {
          setZone(data.zone ?? "");
          setLastSpringFrost(data.lastSpringFrost.slice(0, 10));
          setFirstFallFrost(data.firstFallFrost.slice(0, 10));
        } else {
          setLastSpringFrost("2026-04-15");
          setFirstFallFrost("2026-10-15");
        }

        setLoading(false);
      } catch (e) {
        setMessage("Failed to load settings.");
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone, lastSpringFrost, firstFallFrost }),
    });

    if (!res.ok) {
      setMessage("Save failed.");
      return;
    }
    setMessage("Saved!");
  }

  if (loading) return <p className="text-sm text-gray-600">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Location Data</h1>
      <p className="text-sm text-gray-600">
        Frost dates drive seed starting + planting timing. Zone is optional.
      </p>

      <div className="grid gap-3 rounded-lg border p-4 sm:max-w-md">
        <label className="grid gap-1">
          <span className="text-sm font-medium">USDA Zone (optional)</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="e.g., 6a"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Last spring frost</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            type="date"
            value={lastSpringFrost}
            onChange={(e) => setLastSpringFrost(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">First fall frost</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            type="date"
            value={firstFallFrost}
            onChange={(e) => setFirstFallFrost(e.target.value)}
          />
        </label>

        <button
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
          onClick={save}
        >
          Save
        </button>

        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </div>
  );
}
