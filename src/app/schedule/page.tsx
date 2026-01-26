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
  seedsStartedDate?: string | null;
  transplantedDate?: string | null;
  directSowedDate?: string | null;
  harvestStartedDate?: string | null;
  harvestEndedDate?: string | null;
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
  const [viewMode, setViewMode] = useState<"table" | "calendar" | "week" | "grid">("table");

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

        // Handle error responses from API
        if (!pRes.ok || (pJson && !Array.isArray(pJson))) {
          setError(pJson?.error || "Failed to load placements. Please make sure you're logged in.");
          setPlacements([]);
          return;
        }

        setPlacements(pJson);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load schedule data.");
        setPlacements([]);
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
        if (plc.seedsStartedDate || plc.transplantedDate || plc.directSowedDate || plc.harvestStartedDate || plc.harvestEndedDate) {
          existing.placement = plc;
        }
      } else {
        bedEntry.plants.set(plantId, { plant: plc.plant, count: 1, placement: plc });
      }
    }

    const rows: EventRow[] = [];

    for (const [bedId, bedEntry] of byBed.entries()) {
      for (const { plant, count, placement } of bedEntry.plants.values()) {
        // Calculate estimated dates
        const estimatedStartIndoors =
          plant.startIndoorsWeeksBeforeFrost != null
            ? addWeeks(lastFrost, -plant.startIndoorsWeeksBeforeFrost)
            : null;

        const estimatedTransplant =
          plant.transplantWeeksAfterFrost != null
            ? addWeeks(lastFrost, plant.transplantWeeksAfterFrost)
            : null;

        const estimatedDirectSow =
          plant.directSowWeeksRelativeToFrost != null
            ? addWeeks(lastFrost, plant.directSowWeeksRelativeToFrost)
            : null;

        // Start seeds indoors
        if (placement?.seedsStartedDate) {
          rows.push({
            date: placement.seedsStartedDate.slice(0, 10),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            placementId: placement.id,
            task: "✓ Seeds started indoors",
            status: "completed",
            isActual: true,
          });
        } else if (estimatedStartIndoors) {
          rows.push({
            date: fmt(estimatedStartIndoors),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Start seeds indoors",
            status: "planned",
          });
        }

        // Transplant
        if (placement?.transplantedDate) {
          rows.push({
            date: placement.transplantedDate.slice(0, 10),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            placementId: placement.id,
            task: "✓ Transplanted outdoors",
            status: "completed",
            isActual: true,
          });
        } else if (estimatedTransplant) {
          rows.push({
            date: fmt(estimatedTransplant),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Transplant outdoors",
            status: "planned",
          });
        }

        // Direct sow
        if (placement?.directSowedDate) {
          rows.push({
            date: placement.directSowedDate.slice(0, 10),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            placementId: placement.id,
            task: "✓ Direct sowed",
            status: "completed",
            isActual: true,
          });
        } else if (estimatedDirectSow) {
          rows.push({
            date: fmt(estimatedDirectSow),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            task: "Direct sow",
            status: "planned",
          });
        }

        // Determine anchor date for harvest calculations
        const anchor = estimatedTransplant ?? estimatedDirectSow ?? estimatedStartIndoors;

        // Harvest start
        if (placement?.harvestStartedDate) {
          rows.push({
            date: placement.harvestStartedDate.slice(0, 10),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            placementId: placement.id,
            task: "✓ Harvest started",
            status: "completed",
            isActual: true,
          });
        } else if (anchor && plant.daysToMaturityMin != null) {
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

        // Harvest end
        if (placement?.harvestEndedDate) {
          rows.push({
            date: placement.harvestEndedDate.slice(0, 10),
            bedId,
            bedName: bedEntry.bedName,
            plantName: plant.name,
            count,
            placementId: placement.id,
            task: "✓ Harvest ended",
            status: "completed",
            isActual: true,
          });
        } else if (anchor && plant.daysToMaturityMax != null) {
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

  // Upcoming tasks - next 7 and 14 days
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in14Days = new Date(today);
    in14Days.setDate(in14Days.getDate() + 14);

    const plannedEvents = events.filter((e) => e.status === "planned");

    const overdue: EventRow[] = [];
    const thisWeek: EventRow[] = [];
    const nextWeek: EventRow[] = [];

    for (const event of plannedEvents) {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        overdue.push(event);
      } else if (eventDate <= in7Days) {
        thisWeek.push(event);
      } else if (eventDate <= in14Days) {
        nextWeek.push(event);
      }
    }

    return { overdue, thisWeek, nextWeek };
  }, [events]);

  // Week view - group events by week
  const eventsByWeek = useMemo(() => {
    const weeks: { weekStart: Date; weekEnd: Date; events: EventRow[] }[] = [];

    if (filteredEvents.length === 0) return weeks;

    // Find date range
    const dates = filteredEvents.map((e) => new Date(e.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Start from the Sunday of the first week
    const current = new Date(minDate);
    current.setDate(current.getDate() - current.getDay());

    while (current <= maxDate) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekEvents = filteredEvents.filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });

      if (weekEvents.length > 0) {
        weeks.push({ weekStart, weekEnd, events: weekEvents });
      }

      current.setDate(current.getDate() + 7);
    }

    return weeks;
  }, [filteredEvents]);

  // Grid view - create a month calendar grid
  const calendarGrid = useMemo(() => {
    if (filteredEvents.length === 0) return [];

    // Find the month range we need to display
    const dates = filteredEvents.map((e) => new Date(e.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const months: {
      year: number;
      month: number;
      monthName: string;
      days: { date: Date; events: EventRow[]; isCurrentMonth: boolean }[];
    }[] = [];

    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= endMonth) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const monthName = current.toLocaleDateString("en-US", { year: "numeric", month: "long" });

      // Find first day to display (Sunday of the week containing the 1st)
      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);
      const startDay = new Date(firstOfMonth);
      startDay.setDate(startDay.getDate() - startDay.getDay());

      const days: { date: Date; events: EventRow[]; isCurrentMonth: boolean }[] = [];

      // Generate 6 weeks of days (42 days)
      for (let i = 0; i < 42; i++) {
        const day = new Date(startDay);
        day.setDate(day.getDate() + i);

        const dateStr = fmt(day);
        const dayEvents = filteredEvents.filter((e) => e.date === dateStr);

        days.push({
          date: day,
          events: dayEvents,
          isCurrentMonth: day.getMonth() === month,
        });
      }

      months.push({ year, month, monthName, days });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 p-6">
        {/* Decorative calendar icon */}
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-shrink-0 bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-2.5 rounded-xl shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              📅 Planting Schedule
            </h1>
            <p className="text-indigo-900 text-sm mt-1">
              Planned activities for your garden based on frost dates and plant timing
            </p>
          </div>
        </div>
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
                  viewMode === "week"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                } border-l border-slate-200`}
                onClick={() => setViewMode("week")}
              >
                Week
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "grid"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                } border-l border-slate-200`}
                onClick={() => setViewMode("grid")}
              >
                Grid
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "calendar"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                } rounded-r-lg border-l border-slate-200`}
                onClick={() => setViewMode("calendar")}
              >
                List
              </button>
            </div>

            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={exportToCSV}>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Tasks Notifications */}
      {!error && settings && events.length > 0 && (upcomingTasks.overdue.length > 0 || upcomingTasks.thisWeek.length > 0 || upcomingTasks.nextWeek.length > 0) && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Overdue */}
          {upcomingTasks.overdue.length > 0 && (
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-rose-200">
                  <svg className="w-4 h-4 text-rose-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-rose-900">Overdue ({upcomingTasks.overdue.length})</h3>
              </div>
              <div className="space-y-2">
                {upcomingTasks.overdue.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-rose-600 text-xs mt-0.5">{task.date}</span>
                    <div>
                      <span className="font-medium text-rose-800">{task.task}</span>
                      <span className="text-rose-700"> - {task.plantName}</span>
                    </div>
                  </div>
                ))}
                {upcomingTasks.overdue.length > 5 && (
                  <p className="text-xs text-rose-600">+{upcomingTasks.overdue.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {/* This Week */}
          {upcomingTasks.thisWeek.length > 0 && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-200">
                  <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-amber-900">This Week ({upcomingTasks.thisWeek.length})</h3>
              </div>
              <div className="space-y-2">
                {upcomingTasks.thisWeek.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-amber-600 text-xs mt-0.5">{task.date}</span>
                    <div>
                      <span className="font-medium text-amber-800">{task.task}</span>
                      <span className="text-amber-700"> - {task.plantName}</span>
                    </div>
                  </div>
                ))}
                {upcomingTasks.thisWeek.length > 5 && (
                  <p className="text-xs text-amber-600">+{upcomingTasks.thisWeek.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {/* Next Week */}
          {upcomingTasks.nextWeek.length > 0 && (
            <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-200">
                  <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-blue-900">Next Week ({upcomingTasks.nextWeek.length})</h3>
              </div>
              <div className="space-y-2">
                {upcomingTasks.nextWeek.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-blue-600 text-xs mt-0.5">{task.date}</span>
                    <div>
                      <span className="font-medium text-blue-800">{task.task}</span>
                      <span className="text-blue-700"> - {task.plantName}</span>
                    </div>
                  </div>
                ))}
                {upcomingTasks.nextWeek.length > 5 && (
                  <p className="text-xs text-blue-600">+{upcomingTasks.nextWeek.length - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error ? (
        <div className={`${ui.card} ${ui.cardPad} space-y-3`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-rose-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-900">Unable to load schedule</p>
              <p className="mt-1 text-sm text-slate-600">{error}</p>
              {error.includes("Unauthorized") && (
                <p className="mt-2 text-sm text-slate-700">
                  Please <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">sign in</a> to view your planting schedule.
                </p>
              )}
            </div>
          </div>
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
        /* List View (by month) */
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
      ) : viewMode === "week" ? (
        /* Week View */
        <div className="space-y-4">
          {eventsByWeek.map((week, idx) => (
            <div key={idx} className={`${ui.card} ${ui.cardPad}`}>
              <h3 className="text-base font-semibold mb-3 text-slate-800">
                Week of {week.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {week.weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </h3>
              <div className="grid gap-2 md:grid-cols-7">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, dayIdx) => {
                  const dayDate = new Date(week.weekStart);
                  dayDate.setDate(dayDate.getDate() + dayIdx);
                  const dateStr = fmt(dayDate);
                  const dayEvents = week.events.filter((e) => e.date === dateStr);
                  const isToday = dateStr === fmt(new Date());

                  return (
                    <div
                      key={day}
                      className={`rounded-lg border p-2 min-h-[80px] ${
                        isToday ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-500">{day}</span>
                        <span className={`text-xs font-mono ${isToday ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                          {dayDate.getDate()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event, eIdx) => (
                          <div
                            key={eIdx}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${getTaskColorClass(event.task)}`}
                            title={`${event.task} - ${event.plantName}`}
                          >
                            {event.plantName}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-500">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View (Monthly Calendar) */
        <div className="space-y-6">
          {calendarGrid.map((month, mIdx) => (
            <div key={mIdx} className={`${ui.card} ${ui.cardPad}`}>
              <h3 className="text-lg font-semibold mb-4 text-slate-800">{month.monthName}</h3>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
                {/* Day cells */}
                {month.days.map((day, dIdx) => {
                  const isToday = fmt(day.date) === fmt(new Date());
                  const hasEvents = day.events.length > 0;
                  const hasOverdue = day.events.some((e) => e.status === "planned" && new Date(e.date) < new Date());

                  return (
                    <div
                      key={dIdx}
                      className={`min-h-[60px] rounded border p-1 ${
                        !day.isCurrentMonth
                          ? "bg-slate-50 border-slate-100"
                          : isToday
                          ? "border-emerald-400 bg-emerald-50"
                          : hasOverdue
                          ? "border-rose-300 bg-rose-50"
                          : hasEvents
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className={`text-xs text-right mb-1 ${
                        !day.isCurrentMonth ? "text-slate-300" : isToday ? "text-emerald-700 font-bold" : "text-slate-500"
                      }`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {day.events.slice(0, 2).map((event, eIdx) => (
                          <div
                            key={eIdx}
                            className={`text-xs px-1 py-0.5 rounded truncate ${getTaskColorClass(event.task)}`}
                            title={`${event.task} - ${event.plantName} (${event.bedName})`}
                          >
                            {event.plantName.slice(0, 8)}
                          </div>
                        ))}
                        {day.events.length > 2 && (
                          <div className="text-xs text-slate-500 text-center">+{day.events.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
