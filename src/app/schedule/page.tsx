"use client";

import { useEffect, useMemo, useState } from "react";

type Settings = {
  lastSpringFrost: string;
  firstFallFrost: string;
  zone: string | null;
};

type Plant = {
  id: number;
  name: string;
  daysToMaturityMin: number | null;
  daysToMaturityMax: number | null;
  startIndoorsWeeksBeforeFrost: number | null;
  transplantWeeksAfterFrost: number | null;
  directSowWeeksRelativeToFrost: number | null;
};

type Bed = {
  id: number;
  name: string;
};

type Placement = {
  id: number;
  x: number;
  y: number;
  plant: Plant;
  bed: Bed;
};

type EventRow = {
  date: string;
  bedId: number;
  bedName: string;
  plantName: string;
  count: number;
  task: string;
};

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}
function addWeeks(d: Date, weeks: number) {
  return addDays(d, weeks * 7);
}
function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function SchedulePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [error, setError] = useState("");

  // ✅ NEW: bed filter state
  const [filterBedId, setFilterBedId] = useState<number | "all">("all");

  useEffect(() => {
    (async () => {
      try {
        setError("");

        const sRes = await fetch("/api/settings", { cache: "no-store" });
        const sText = await sRes.text();
        const sJson = sText ? JSON.parse(sText) : null;
        setSettings(sJson);

        const pRes = await fetch("/api/plan", { cache: "no-store" });
        const pText = await pRes.text();
        const pJson = pText ? JSON.parse(pText) : [];
        setPlacements(pJson);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load schedule data.");
      }
    })();
  }, []);

  // ✅ NEW: dropdown options based on beds seen in placements
  const bedOptions = useMemo(() => {
    const m = new Map<number, string>();
    for (const plc of placements) {
      m.set(plc.bed.id, plc.bed.name);
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [placements]);

  // ✅ NEW: if user had a bed selected but it no longer exists, reset to "all"
  useEffect(() => {
    if (filterBedId === "all") return;
    const stillExists = bedOptions.some((b) => b.id === filterBedId);
    if (!stillExists) setFilterBedId("all");
  }, [bedOptions, filterBedId]);

  const events = useMemo(() => {
    if (!settings) return [] as EventRow[];

    const lastFrost = new Date(settings.lastSpringFrost);

    // bedId -> bedName + plantId -> {plant, count}
    const byBed = new Map<
      number,
      { bedName: string; plants: Map<number, { plant: Plant; count: number }> }
    >();

    for (const plc of placements) {
      const bedId = plc.bed.id;
      const plantId = plc.plant.id;

      if (!byBed.has(bedId)) {
        byBed.set(bedId, { bedName: plc.bed.name, plants: new Map() });
      }

      const bedEntry = byBed.get(bedId)!;
      const existing = bedEntry.plants.get(plantId);

      if (existing) existing.count += 1;
      else bedEntry.plants.set(plantId, { plant: plc.plant, count: 1 });
    }

    const rows: EventRow[] = [];

    for (const [bedId, bedEntry] of byBed.entries()) {
      for (const { plant, count } of bedEntry.plants.values()) {
        const startIndoors =
          plant.startIndoorsWeeksBeforeFrost != null
            ? addWeeks(lastFrost, -plant.startIndoorsWeeksBeforeFrost)
            : null;

        const transplant =
          plant.transplantWeeksAfterFrost != null
            ? addWeeks(lastFrost, plant.transplantWeeksAfterFrost)
            : null;

        const directSow =
          plant.directSowWeeksRelativeToFrost != null
            ? addWeeks(lastFrost, plant.directSowWeeksRelativeToFrost)
            : null;

        if (startIndoors) {
          rows.push({
            date: fmt(startIndoors),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Start seeds indoors",
          });
        }

        if (transplant) {
          rows.push({
            date: fmt(transplant),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Transplant outside",
          });
        }

        if (directSow) {
          rows.push({
            date: fmt(directSow),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Direct sow outside",
          });
        }

        const anchor = transplant ?? directSow ?? startIndoors;

        if (anchor && plant.daysToMaturityMin != null) {
          rows.push({
            date: fmt(addDays(anchor, plant.daysToMaturityMin)),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Estimated harvest (start)",
          });
        }

        if (anchor && plant.daysToMaturityMax != null) {
          rows.push({
            date: fmt(addDays(anchor, plant.daysToMaturityMax)),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Estimated harvest (end)",
          });
        }
      }
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [settings, placements]);

  // ✅ NEW: filtered events
  const filteredEvents = useMemo(() => {
    if (filterBedId === "all") return events;
    return events.filter((e) => e.bedId === filterBedId);
  }, [events, filterBedId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Schedule</h1>

        {/* ✅ NEW: dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter bed:</label>
          <select
            className="rounded border px-3 py-2 text-sm"
            value={filterBedId}
            onChange={(e) => {
              const v = e.target.value;
              setFilterBedId(v === "all" ? "all" : Number(v));
            }}
          >
            <option value="all">All beds</option>
            {bedOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Error</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs">{error}</pre>
        </div>
      ) : !settings ? (
        <p className="text-sm text-gray-600">
          No settings found. Go to Settings and save frost dates.
        </p>
      ) : placements.length === 0 ? (
        <p className="text-sm text-gray-600">
          No plants placed yet. Go to Beds and place some plants.
        </p>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-600">
          You have placements, but plants are missing timing rules. Add timing details on Plants page.
        </p>
      ) : filteredEvents.length === 0 ? (
        <p className="text-sm text-gray-600">
          No schedule items for this bed (or timing rules are missing for plants in this bed).
        </p>
      ) : (
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Bed</th>
                <th className="p-2">Plant</th>
                <th className="p-2">Count</th>
                <th className="p-2">Task</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 font-mono">{e.date}</td>
                  <td className="p-2">{e.bedName}</td>
                  <td className="p-2">{e.plantName}</td>
                  <td className="p-2">{e.count}</td>
                  <td className="p-2">{e.task}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
