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
  // Succession planting
  successionEnabled?: boolean;
  successionIntervalDays?: number | null;
  successionMaxCount?: number | null;
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
  // Succession tracking
  successionGroupId?: string | null;
  successionNumber?: number | null;
};

type TaskType = "seeds" | "transplant" | "directSow" | "harvestStart" | "harvestEnd" | "succession";

type EventRow = {
  date: string;
  bedId: number;
  bedName: string;
  plantName: string;
  count: number;
  task: string;
  taskType: TaskType;
  placementId?: number;
  status?: "planned" | "completed";
  isActual?: boolean;
};

// Task configuration with emojis and colors for each stage
const TASK_CONFIG: Record<TaskType, { emoji: string; label: string; completedLabel: string; bgClass: string; textClass: string; borderClass: string }> = {
  seeds: {
    emoji: "🌱",
    label: "Start seeds indoors",
    completedLabel: "Seeds started",
    bgClass: "bg-sky-100",
    textClass: "text-sky-700",
    borderClass: "border-sky-300",
  },
  transplant: {
    emoji: "🏡",
    label: "Transplant outdoors",
    completedLabel: "Transplanted",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-300",
  },
  directSow: {
    emoji: "🌾",
    label: "Direct sow",
    completedLabel: "Direct sowed",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
    borderClass: "border-amber-300",
  },
  harvestStart: {
    emoji: "🥬",
    label: "Begin harvest",
    completedLabel: "Harvesting",
    bgClass: "bg-orange-100",
    textClass: "text-orange-700",
    borderClass: "border-orange-300",
  },
  harvestEnd: {
    emoji: "✅",
    label: "Harvest complete",
    completedLabel: "Harvest done",
    bgClass: "bg-purple-100",
    textClass: "text-purple-700",
    borderClass: "border-purple-300",
  },
  succession: {
    emoji: "🔄",
    label: "Plant next succession",
    completedLabel: "Succession planted",
    bgClass: "bg-violet-100",
    textClass: "text-violet-700",
    borderClass: "border-violet-300",
  },
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

  // Month selector for grid view
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(null);

  // Plant detail modal
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);

  // Day detail modal (for viewing all events on a day)
  const [selectedDay, setSelectedDay] = useState<{ date: Date; events: EventRow[] } | null>(null);

  // Print mode for day modal
  const [printingDayModal, setPrintingDayModal] = useState(false);

  // Handle printing day modal
  const handlePrintDayModal = () => {
    setPrintingDayModal(true);
    // Small delay to let state update before printing
    setTimeout(() => {
      window.print();
      setPrintingDayModal(false);
    }, 100);
  };

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
            taskType: "seeds",
            task: `${TASK_CONFIG.seeds.emoji} ${TASK_CONFIG.seeds.completedLabel}`,
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
            taskType: "seeds",
            task: `${TASK_CONFIG.seeds.emoji} ${TASK_CONFIG.seeds.label}`,
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
            taskType: "transplant",
            task: `${TASK_CONFIG.transplant.emoji} ${TASK_CONFIG.transplant.completedLabel}`,
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
            taskType: "transplant",
            task: `${TASK_CONFIG.transplant.emoji} ${TASK_CONFIG.transplant.label}`,
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
            taskType: "directSow",
            task: `${TASK_CONFIG.directSow.emoji} ${TASK_CONFIG.directSow.completedLabel}`,
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
            taskType: "directSow",
            task: `${TASK_CONFIG.directSow.emoji} ${TASK_CONFIG.directSow.label}`,
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
            taskType: "harvestStart",
            task: `${TASK_CONFIG.harvestStart.emoji} ${TASK_CONFIG.harvestStart.completedLabel}`,
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
            taskType: "harvestStart",
            task: `${TASK_CONFIG.harvestStart.emoji} ${TASK_CONFIG.harvestStart.label}`,
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
            taskType: "harvestEnd",
            task: `${TASK_CONFIG.harvestEnd.emoji} ${TASK_CONFIG.harvestEnd.completedLabel}`,
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
            taskType: "harvestEnd",
            task: `${TASK_CONFIG.harvestEnd.emoji} ${TASK_CONFIG.harvestEnd.label}`,
            status: "planned",
          });
        }
      }
    }

    // Generate succession planting events
    // Group placements by plantId to track succession counts
    const plantSuccessionCounts = new Map<number, { count: number; latestDate: Date | null; plant: Plant }>();

    for (const plc of placements) {
      const plant = plc.plant;
      if (!plant.successionEnabled || !plant.successionIntervalDays) continue;

      // Find the latest planting date for this placement
      const plantingDate = plc.directSowedDate || plc.transplantedDate || plc.seedsStartedDate;
      if (!plantingDate) continue;

      const existing = plantSuccessionCounts.get(plant.id);
      const plantDate = new Date(plantingDate);

      if (existing) {
        existing.count += 1;
        if (!existing.latestDate || plantDate > existing.latestDate) {
          existing.latestDate = plantDate;
        }
      } else {
        plantSuccessionCounts.set(plant.id, {
          count: 1,
          latestDate: plantDate,
          plant,
        });
      }
    }

    // Generate upcoming succession events
    for (const [plantId, data] of plantSuccessionCounts.entries()) {
      const { count, latestDate, plant } = data;
      const maxCount = plant.successionMaxCount ?? 6;
      const interval = plant.successionIntervalDays;

      if (!latestDate || !interval) continue;

      // Generate events for remaining successions (up to max)
      for (let i = count + 1; i <= maxCount; i++) {
        const dueDate = addDays(latestDate, interval * (i - count));

        rows.push({
          date: fmt(dueDate),
          bedId: 0, // Will show as "Any Bed"
          bedName: "—",
          plantName: plant.name,
          count: 1,
          taskType: "succession",
          task: `${TASK_CONFIG.succession.emoji} ${TASK_CONFIG.succession.label} #${i}`,
          status: "planned",
        });
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

  // Available months for grid view navigation
  const availableMonths = useMemo(() => {
    if (filteredEvents.length === 0) return [];

    const dates = filteredEvents.map((e) => new Date(e.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const months: { year: number; month: number; label: string }[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= endMonth) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        label: current.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }, [filteredEvents]);

  // Set default selected month when available months change
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      // Default to current month if it's in the range, otherwise first month
      const now = new Date();
      const currentMonthIdx = availableMonths.findIndex(
        (m) => m.year === now.getFullYear() && m.month === now.getMonth()
      );
      if (currentMonthIdx >= 0) {
        setSelectedMonth({ year: availableMonths[currentMonthIdx].year, month: availableMonths[currentMonthIdx].month });
      } else {
        setSelectedMonth({ year: availableMonths[0].year, month: availableMonths[0].month });
      }
    }
  }, [availableMonths, selectedMonth]);

  // Grid view - create a month calendar grid for the selected month
  const calendarGrid = useMemo(() => {
    if (filteredEvents.length === 0 || !selectedMonth) return [];

    const year = selectedMonth.year;
    const month = selectedMonth.month;
    const monthName = new Date(year, month, 1).toLocaleDateString("en-US", { year: "numeric", month: "long" });

    // Find first day to display (Sunday of the week containing the 1st)
    const firstOfMonth = new Date(year, month, 1);
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

    return [{ year, month, monthName, days }];
  }, [filteredEvents, selectedMonth]);

  // Get all events for a specific plant (for detail modal)
  const getPlantEvents = (plantName: string, bedName: string) => {
    return events.filter((e) => e.plantName === plantName && e.bedName === bedName);
  };

  // Navigate to previous/next month
  const goToPrevMonth = () => {
    if (!selectedMonth || availableMonths.length === 0) return;
    const currentIdx = availableMonths.findIndex(
      (m) => m.year === selectedMonth.year && m.month === selectedMonth.month
    );
    if (currentIdx > 0) {
      setSelectedMonth({ year: availableMonths[currentIdx - 1].year, month: availableMonths[currentIdx - 1].month });
    }
  };

  const goToNextMonth = () => {
    if (!selectedMonth || availableMonths.length === 0) return;
    const currentIdx = availableMonths.findIndex(
      (m) => m.year === selectedMonth.year && m.month === selectedMonth.month
    );
    if (currentIdx < availableMonths.length - 1) {
      setSelectedMonth({ year: availableMonths[currentIdx + 1].year, month: availableMonths[currentIdx + 1].month });
    }
  };

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

  // Helper to get task color class from taskType
  function getTaskColorClass(taskType: TaskType): string {
    const config = TASK_CONFIG[taskType];
    return `${config.bgClass} ${config.textClass} ${config.borderClass}`;
  }

  // Print function for monthly grid view
  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Main content - hidden when printing day modal */}
      <div className={printingDayModal ? "print-hide-for-modal" : ""}>
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
        <div className="flex flex-col gap-3">
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Bed:</label>
              <select
                className="rounded border px-3 py-2 text-sm flex-1 sm:flex-none"
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
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Status:</label>
              <select
                className="rounded border px-3 py-2 text-sm flex-1 sm:flex-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "planned" | "completed")}
              >
                <option value="all">All</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* View mode and export row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-sm overflow-x-auto">
              <button
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-md ${
                  viewMode === "table"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
                onClick={() => setViewMode("table")}
              >
                Table
              </button>
              <button
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-md ${
                  viewMode === "week"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
                onClick={() => setViewMode("week")}
              >
                Week
              </button>
              <button
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-md ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
                onClick={() => setViewMode("grid")}
              >
                Grid
              </button>
              <button
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-md ${
                  viewMode === "calendar"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
                onClick={() => setViewMode("calendar")}
              >
                List
              </button>
            </div>

            <div className="flex gap-2">
              <button className={`${ui.btn} ${ui.btnSecondary} whitespace-nowrap`} onClick={handlePrint}>
                🖨️ Print
              </button>
              <button className={`${ui.btn} ${ui.btnSecondary} whitespace-nowrap`} onClick={exportToCSV}>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className={`${ui.card} ${ui.cardPad} no-print`}>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-sm font-medium text-slate-700">Legend:</span>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(Object.keys(TASK_CONFIG) as TaskType[]).map((taskType) => (
              <div
                key={taskType}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTaskColorClass(taskType)}`}
              >
                <span>{TASK_CONFIG[taskType].emoji}</span>
                <span className="hidden sm:inline">{TASK_CONFIG[taskType].label}</span>
              </div>
            ))}
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
                  <button
                    key={idx}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left flex flex-wrap items-start gap-3 text-sm p-2 rounded hover:bg-slate-100 hover:ring-2 hover:ring-slate-200 transition-all cursor-pointer"
                  >
                    <span className="font-mono text-slate-600 min-w-[80px]">{event.date}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getTaskColorClass(
                        event.taskType
                      )}`}
                    >
                      {event.task}
                    </span>
                    <span className="text-slate-700">
                      {event.plantName} ({event.count})
                    </span>
                    <span className="text-slate-500 text-xs">in {event.bedName}</span>
                  </button>
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
                          <button
                            key={eIdx}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 cursor-pointer ${getTaskColorClass(event.taskType)}`}
                            title={`${event.task} - ${event.plantName}`}
                          >
                            {TASK_CONFIG[event.taskType].emoji} {event.plantName}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <button
                            onClick={() => setSelectedDay({ date: dayDate, events: dayEvents })}
                            className="w-full text-xs text-slate-600 py-0.5 rounded hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer font-medium"
                          >
                            +{dayEvents.length - 3} more
                          </button>
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
        <div className="space-y-6 print-calendar">
          {/* Print-only header and legend */}
          <div className="hidden print:block mb-4">
            <h2 className="print-title">Garden Planting Schedule</h2>
            <div className="print-legend">
              <div className="print-legend-item">
                <span className={`px-2 py-0.5 rounded ${TASK_CONFIG.seeds.bgClass}`}>🌱</span>
                <span>Start seeds indoors</span>
              </div>
              <div className="print-legend-item">
                <span className={`px-2 py-0.5 rounded ${TASK_CONFIG.transplant.bgClass}`}>🏡</span>
                <span>Transplant outdoors</span>
              </div>
              <div className="print-legend-item">
                <span className={`px-2 py-0.5 rounded ${TASK_CONFIG.directSow.bgClass}`}>🌾</span>
                <span>Direct sow</span>
              </div>
              <div className="print-legend-item">
                <span className={`px-2 py-0.5 rounded ${TASK_CONFIG.harvestStart.bgClass}`}>🥬</span>
                <span>Begin harvest</span>
              </div>
              <div className="print-legend-item">
                <span className={`px-2 py-0.5 rounded ${TASK_CONFIG.harvestEnd.bgClass}`}>✅</span>
                <span>Harvest complete</span>
              </div>
            </div>
          </div>

          {/* Month Navigation (screen only) */}
          <div className="flex items-center justify-between no-print">
            <button
              onClick={goToPrevMonth}
              disabled={!selectedMonth || availableMonths.findIndex((m) => m.year === selectedMonth.year && m.month === selectedMonth.month) === 0}
              className={`${ui.btn} ${ui.btnSecondary} disabled:opacity-40`}
            >
              ← Prev
            </button>

            <div className="flex items-center gap-3">
              <select
                value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ""}
                onChange={(e) => {
                  const [year, month] = e.target.value.split("-").map(Number);
                  setSelectedMonth({ year, month });
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium bg-white shadow-sm"
              >
                {availableMonths.map((m) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={goToNextMonth}
              disabled={!selectedMonth || availableMonths.findIndex((m) => m.year === selectedMonth.year && m.month === selectedMonth.month) === availableMonths.length - 1}
              className={`${ui.btn} ${ui.btnSecondary} disabled:opacity-40`}
            >
              Next →
            </button>
          </div>

          {calendarGrid.map((month, mIdx) => (
            <div key={mIdx} className={`${ui.card} ${ui.cardPad} print-card`}>
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
                      className={`min-h-[80px] sm:min-h-[100px] rounded border p-1 ${
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
                        {day.events.slice(0, 3).map((event, eIdx) => (
                          <button
                            key={eIdx}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left text-xs px-1 py-0.5 rounded hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 transition-all cursor-pointer ${getTaskColorClass(event.taskType)}`}
                            title={`${event.task} - ${event.plantName} (${event.bedName})`}
                          >
                            <span className="block truncate">
                              {TASK_CONFIG[event.taskType].emoji} {event.plantName}
                            </span>
                          </button>
                        ))}
                        {day.events.length > 3 && (
                          <button
                            onClick={() => setSelectedDay({ date: day.date, events: day.events })}
                            className="w-full text-xs text-slate-600 text-center py-0.5 rounded hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer font-medium"
                          >
                            +{day.events.length - 3} more
                          </button>
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
                    onClick={() => setSelectedEvent(e)}
                    className={`border-b last:border-b-0 hover:bg-slate-100 cursor-pointer transition-colors ${
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
      </div>{/* End main content wrapper */}

      {/* Plant Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className={`${ui.card} w-full max-w-md max-h-[80vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{selectedEvent.plantName}</h2>
                  <p className="text-sm text-slate-600 mt-1">in {selectedEvent.bedName}</p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Current Event */}
              <div className={`p-3 rounded-lg border ${getTaskColorClass(selectedEvent.taskType)}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{TASK_CONFIG[selectedEvent.taskType].emoji}</span>
                  <div>
                    <p className="font-medium">{TASK_CONFIG[selectedEvent.taskType].label}</p>
                    <p className="text-sm">{selectedEvent.date}</p>
                  </div>
                </div>
                {selectedEvent.status === "completed" && (
                  <span className="inline-block mt-2 text-xs font-medium bg-white/50 px-2 py-0.5 rounded">
                    ✓ Completed
                  </span>
                )}
              </div>

              {/* All Events for this Plant */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Full Schedule</h3>
                <div className="space-y-2">
                  {getPlantEvents(selectedEvent.plantName, selectedEvent.bedName).map((event, idx) => {
                    const isCurrentEvent = event.date === selectedEvent.date && event.taskType === selectedEvent.taskType;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                          isCurrentEvent ? "bg-slate-100 ring-2 ring-slate-300" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-base">{TASK_CONFIG[event.taskType].emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${event.status === "completed" ? "text-green-700" : "text-slate-800"}`}>
                            {TASK_CONFIG[event.taskType].label}
                          </p>
                          <p className="text-xs text-slate-500">{event.date}</p>
                        </div>
                        {event.status === "completed" && (
                          <span className="text-green-600 text-xs">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plant Count */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Plants in this bed:</span>
                  <span className="font-semibold text-slate-900">{selectedEvent.count}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedEvent(null)}
                className={`${ui.btn} ${ui.btnSecondary} w-full`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Detail Modal - shows all events for a selected day */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-day-modal-backdrop"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className={`${ui.card} w-full max-w-md max-h-[80vh] overflow-y-auto print-day-modal`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedDay.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedDay.events.length} scheduled {selectedDay.events.length === 1 ? "task" : "tasks"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-2">
              {selectedDay.events.map((event, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDay(null);
                    setSelectedEvent(event);
                  }}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 cursor-pointer ${getTaskColorClass(event.taskType)}`}
                >
                  <span className="text-xl">{TASK_CONFIG[event.taskType].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.plantName}</p>
                    <p className="text-xs opacity-80">{TASK_CONFIG[event.taskType].label}</p>
                    <p className="text-xs opacity-70">in {event.bedName}</p>
                  </div>
                  {event.status === "completed" && (
                    <span className="text-xs font-medium bg-white/50 px-2 py-0.5 rounded">✓ Done</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2 no-print">
              <button
                onClick={handlePrintDayModal}
                className={`${ui.btn} ${ui.btnSecondary} flex-1`}
              >
                🖨️ Print
              </button>
              <button
                onClick={() => setSelectedDay(null)}
                className={`${ui.btn} ${ui.btnSecondary} flex-1`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
