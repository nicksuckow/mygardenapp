"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/lib/uiStyles";

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
  status?: string | null;
  plantingDate?: string | null;
  actualHarvestStartDate?: string | null;
  actualHarvestEndDate?: string | null;
};

type EventRow = {
  date: string;
  bedId: number;
  bedName: string;
  plantName: string;
  count: number;
  task: string;
  placementId?: number;
  status?: "planned" | "completed";
  isActual?: boolean;
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

  // Filters and view mode
  const [filterBedId, setFilterBedId] = useState<number | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "planned" | "completed">("all");
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

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

    // bedId -> bedName + plantId -> {plant, count, placement}
    const byBed = new Map<
      number,
      { bedName: string; plants: Map<number, { plant: Plant; count: number; placement: Placement }> }
    >();

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
        // Use the most recent placement data (or first one with actual dates)
        if (plc.plantingDate || plc.actualHarvestStartDate || plc.actualHarvestEndDate) {
          existing.placement = plc;
        }
      } else {
        bedEntry.plants.set(plantId, { plant: plc.plant, count: 1, placement: plc });
      }
    }

    const rows: EventRow[] = [];

    for (const [bedId, bedEntry] of byBed.entries()) {
      for (const { plant, count, placement } of bedEntry.plants.values()) {
        // Check if we have actual dates from placement
        const hasActualPlantingDate = placement?.plantingDate != null;
        const hasActualHarvestStart = placement?.actualHarvestStartDate != null;
        const hasActualHarvestEnd = placement?.actualHarvestEndDate != null;

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

        // Add actual planting date if it exists
        if (hasActualPlantingDate) {
          rows.push({
            date: placement.plantingDate!.slice(0, 10),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            placementId: placement.id,
            task: "Planted ✓",
            status: "completed",
            isActual: true,
          });
        } else {
          // Show estimated dates only if no actual date
          if (startIndoors) {
            rows.push({
              date: fmt(startIndoors),
              bedId,
              bedName: bedEntry.bedName,
              plantName: plant.name,
              count,
              task: "Start seeds indoors",
              status: "planned",
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
              status: "planned",
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
              status: "planned",
            });
          }
        }

        const anchor = transplant ?? directSow ?? startIndoors;

        // Add actual harvest dates if they exist
        if (hasActualHarvestStart) {
          rows.push({
            date: placement.actualHarvestStartDate!.slice(0, 10),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            placementId: placement.id,
            task: "Harvest started ✓",
            status: "completed",
            isActual: true,
          });
        } else if (anchor && plant.daysToMaturityMin != null) {
          // Show estimated harvest start only if no actual date
          rows.push({
            date: fmt(addDays(anchor, plant.daysToMaturityMin)),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Estimated harvest (start)",
            status: "planned",
          });
        }

        if (hasActualHarvestEnd) {
          rows.push({
            date: placement.actualHarvestEndDate!.slice(0, 10),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            placementId: placement.id,
            task: "Harvest complete ✓",
            status: "completed",
            isActual: true,
          });
        } else if (anchor && plant.daysToMaturityMax != null) {
          // Show estimated harvest end only if no actual date
          rows.push({
            date: fmt(addDays(anchor, plant.daysToMaturityMax)),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Estimated harvest (end)",
            status: "planned",
          });
        }
      }
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [settings, placements]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by bed
    if (filterBedId !== "all") {
      filtered = filtered.filter((e) => e.bedId === filterBedId);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((e) => e.status === filterStatus);
    }

    return filtered;
  }, [events, filterBedId, filterStatus]);

  // Group events by month for calendar view
  const eventsByMonth = useMemo(() => {
    const grouped: Record<string, EventRow[]> = {};

    for (const event of filteredEvents) {
      const date = new Date(event.date);
      const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(event);
    }

    return grouped;
  }, [filteredEvents]);

  // CSV export function
  function exportToCSV() {
    const csv = [
      ["Date", "Bed", "Plant", "Count", "Task", "Status"].join(","),
      ...filteredEvents.map((e) =>
        [e.date, e.bedName, e.plantName, e.count, e.task, e.status || "planned"].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `garden-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper to get task color class
  function getTaskColorClass(task: string): string {
    if (task.includes("Start seeds")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (task.includes("Transplant")) return "bg-green-100 text-green-700 border-green-200";
    if (task.includes("Direct sow")) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (task.includes("Harvest")) return "bg-orange-100 text-orange-700 border-orange-200";
    if (task.includes("complete")) return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.h1}>Planting Schedule</h1>
        <p className={ui.sub}>
          Planned activities for your garden based on frost dates and plant timing
        </p>
      </div>

      <div className={`${ui.card} ${ui.cardPad}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Bed:</label>
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

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "planned" | "completed")}
              >
                <option value="all">All</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-white">
              <button
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "table"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                } rounded-l-lg`}
                onClick={() => setViewMode("table")}
              >
                Table
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "calendar"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                } rounded-r-lg border-l border-slate-200`}
                onClick={() => setViewMode("calendar")}
              >
                Calendar
              </button>
            </div>

            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={exportToCSV}>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className={`${ui.card} ${ui.cardPad}`}>
          <p className="text-sm font-medium text-rose-700">Error</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{error}</pre>
        </div>
      ) : !settings ? (
        <p className={ui.sub}>
          No settings found. Go to Settings and save frost dates.
        </p>
      ) : placements.length === 0 ? (
        <p className={ui.sub}>
          No plants placed yet. Go to Beds and place some plants.
        </p>
      ) : events.length === 0 ? (
        <p className={ui.sub}>
          You have placements, but plants are missing timing rules. Add timing details on Plants page.
        </p>
      ) : filteredEvents.length === 0 ? (
        <p className={ui.sub}>
          No schedule items match your filters.
        </p>
      ) : viewMode === "calendar" ? (
        /* Calendar View */
        <div className="space-y-4">
          {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
            <div key={month} className={`${ui.card} ${ui.cardPad}`}>
              <h3 className="text-base font-semibold mb-3 text-slate-800">{month}</h3>
              <div className="space-y-2">
                {monthEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-start gap-3 text-sm p-2 rounded hover:bg-slate-50"
                  >
                    <span className="font-mono text-slate-600 min-w-[80px]">{event.date}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getTaskColorClass(
                        event.task
                      )}`}
                    >
                      {event.task}
                    </span>
                    <span className="text-slate-700">
                      {event.plantName} ({event.count})
                    </span>
                    <span className="text-slate-500 text-xs">in {event.bedName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className={`${ui.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-3 font-semibold text-slate-700">Date</th>
                  <th className="p-3 font-semibold text-slate-700">Bed</th>
                  <th className="p-3 font-semibold text-slate-700">Plant</th>
                  <th className="p-3 font-semibold text-slate-700">Count</th>
                  <th className="p-3 font-semibold text-slate-700">Task</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e, idx) => (
                  <tr
                    key={idx}
                    className={`border-b last:border-b-0 hover:bg-slate-50 ${
                      e.status === "completed" ? "bg-green-50/30" : ""
                    }`}
                  >
                    <td className="p-3 font-mono text-slate-600">{e.date}</td>
                    <td className="p-3">{e.bedName}</td>
                    <td className="p-3">{e.plantName}</td>
                    <td className="p-3 text-slate-600">{e.count}</td>
                    <td className="p-3">
                      <span
                        className={
                          e.isActual
                            ? "text-green-700 font-medium"
                            : e.status === "completed"
                            ? "text-green-600"
                            : "text-slate-600"
                        }
                      >
                        {e.task}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
