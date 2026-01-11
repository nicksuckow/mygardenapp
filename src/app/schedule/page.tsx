"use client";

import { useEffect, useMemo, useState } from "react";

type Settings = {
  lastSpringFrost: string;
  firstFallFrost: string;
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

type EventRow = {
  plantName: string;
  type: string;
  date: string;
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
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    (async () => {
      const s = await fetch("/api/settings").then((r) => r.json());
      const p = await fetch("/api/plants").then((r) => r.json());
      setSettings(s);
      setPlants(p);
    })();
  }, []);

  const events = useMemo(() => {
    if (!settings) return [] as EventRow[];
    const lastFrost = new Date(settings.lastSpringFrost);

    const rows: EventRow[] = [];

    for (const plant of plants) {
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

      if (startIndoors) rows.push({ plantName: plant.name, type: "Start seeds indoors", date: fmt(startIndoors) });
      if (transplant) rows.push({ plantName: plant.name, type: "Transplant outside", date: fmt(transplant) });
      if (directSow) rows.push({ plantName: plant.name, type: "Direct sow outside", date: fmt(directSow) });

      const anchor = transplant ?? directSow ?? startIndoors;
      if (anchor && plant.daysToMaturityMin != null) {
        rows.push({ plantName: plant.name, type: "Estimated harvest (start)", date: fmt(addDays(anchor, plant.daysToMaturityMin)) });
      }
      if (anchor && plant.daysToMaturityMax != null) {
        rows.push({ plantName: plant.name, type: "Estimated harvest (end)", date: fmt(addDays(anchor, plant.daysToMaturityMax)) });
      }
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [settings, plants]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Schedule</h1>

      {!settings ? (
        <p className="text-sm text-gray-600">
          No settings found. Go to Settings and save frost dates.
        </p>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-600">
          Add plants (and timing rules) to see a schedule.
        </p>
      ) : (
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Plant</th>
                <th className="p-2">Task</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 font-mono">{e.date}</td>
                  <td className="p-2">{e.plantName}</td>
                  <td className="p-2">{e.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
