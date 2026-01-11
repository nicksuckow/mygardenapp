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
  date: string; // YYYY-MM-DD
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
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setError("");

        const sRes = await fetch("/api/settings");
        const sText = await sRes.text();
        const sJson = sText ? JSON.parse(sText) : null;
        setSettings(sJson);

        const pRes = await fetch("/api/plan");
        const pText = await pRes.text();
        const pJson = pText ? JSON.parse(pText) : [];
        setPlacements(pJson);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to load schedule data.");
      }
    })();
  }, []);

  const events = useMemo(() => {
    if (!settings) return [] as EventRow[];

    const lastFrost = new Date(settings.lastSpringFrost);

    // Group placements: bedId -> plantId -> count
    const byBed = new Map<number, { bedName: string; plants: Map<number, { plant: Plant; count: number }> }>();

    for (const plc of placements) {
      const bedId = plc.bed.id;
      const plantId = plc.plant.id;

      if (!byBed.has(bedId)) {
        byBed.set(bedId, { bedName: plc.bed.name, plants: new Map() });
      }

      const bedEntry = byBed.get(bedId)!;
      const existing = bedEntry.plants.get(plantId);

      if (existing) {
        existing.count += 1;
      } else {
        bedEntry.plants.set(plantId, { plant: plc.plant, count: 1 });
      }
    }

    const rows: EventRow[] = [];

    for (const bedEntry of byBed.values()) {
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
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Start seeds indoors",
          });
        }

        if (transplant) {
          rows.push({
            date: fmt(transplant),
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Transplant outside",
          });
        }

        if (directSow) {
          rows.push({
            date: fmt(directSow),
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Direct sow outside",
          });
        }

        // Harvest estimate: anchor to transplant if present, else direct sow, else start indoors
        const anchor = transplant ?? directSow ?? startIndoors;

        if (anchor && plant.daysToMaturityMin != null) {
          rows.push({
            date: fmt(addDays(anchor, plant.daysToMaturityMin)),
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Estimated harvest (start)",
          });
        }

        if (anchor && plant.daysToMaturityMax != null) {
          rows.push({
            date: fmt(addDays(anchor, plant.daysToMaturityMax)),
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

  const hasPlacements = placements.length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Schedule</h1>

      {error ? (
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm text-gray-700">{error}</p>
        </div>
      ) : !settings ? (
        <p className="text-sm text-gray-600">
          No settings found. Go to Settings and save frost dates.
        </p>
      ) : !hasPlacements ? (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm">
            No plants placed in any beds yet.
          </p>
          <p className="text-sm text-gray-600">
            Go to Beds, open a bed, and place some plants. Then come back here.
          </p>
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-600">
          You have placements, but your plants don’t have timing rules (weeks/DTM).
          Add timing details on the Plants page.
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
              {events.map((e, idx) => (
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
