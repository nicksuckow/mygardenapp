"use client";

import Link from "next/link";
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
  variety: string | null;
  spacingInches: number;
  daysToMaturityMin: number | null;
  daysToMaturityMax: number | null;
  startIndoorsWeeksBeforeFrost: number | null;
  transplantWeeksAfterFrost: number | null;
  directSowWeeksRelativeToFrost: number | null;
  hasSeeds: boolean;
  cycle: string | null;
  sunlight: string | null;
  // Succession planting
  successionEnabled?: boolean;
  successionIntervalDays?: number | null;
  successionMaxCount?: number | null;
};

type SuccessionDue = {
  plantId: number;
  plantName: string;
  nextSuccessionNumber: number;
  dueDate: string | null;
  daysUntilDue: number | null;
  isOverdue: boolean;
  currentCount: number;
  maxCount: number | null;
  intervalDays: number | null;
  latestPlacement: {
    id: number;
    bedName: string;
    plantedDate: string | null;
  } | null;
};

type PlantableCategory = "start-indoors" | "transplant" | "direct-sow";

type PlantableItem = {
  plant: Plant;
  category: PlantableCategory;
  windowStart: Date;
  windowEnd: Date;
  daysRemaining: number;
  status: "optimal" | "ending-soon" | "just-started" | "past";
};

function addWeeks(d: Date, weeks: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + weeks * 7);
  return out;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PlantNowPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [successionsDue, setSuccessionsDue] = useState<SuccessionDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [showSeedsOnly, setShowSeedsOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<PlantableCategory | "all">("all");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const [sRes, pRes, succRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/plants", { cache: "no-store" }),
          fetch("/api/succession", { cache: "no-store" }),
        ]);

        const sText = await sRes.text();
        const sJson = sText ? JSON.parse(sText) : null;
        setSettings(sJson);

        const pText = await pRes.text();
        const pJson = pText ? JSON.parse(pText) : [];

        if (!pRes.ok || !Array.isArray(pJson)) {
          setError("Failed to load plants.");
          setPlants([]);
          return;
        }

        setPlants(pJson);

        // Load succession schedule
        if (succRes.ok) {
          const succJson = await succRes.json();
          setSuccessionsDue(succJson.upcoming ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const plantableNow = useMemo(() => {
    if (!settings) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastFrost = new Date(settings.lastSpringFrost);
    const firstFrost = new Date(settings.firstFallFrost);

    const items: PlantableItem[] = [];

    // Window buffer in weeks (how long after the optimal date it's still ok to plant)
    const WINDOW_BUFFER_WEEKS = 4;

    for (const plant of plants) {
      // Filter by seeds if enabled
      if (showSeedsOnly && !plant.hasSeeds) continue;

      // Start indoors
      if (plant.startIndoorsWeeksBeforeFrost != null) {
        const optimalDate = addWeeks(lastFrost, -plant.startIndoorsWeeksBeforeFrost);
        const windowEnd = addWeeks(optimalDate, WINDOW_BUFFER_WEEKS);

        // Check if we're in the planting window
        if (today <= windowEnd) {
          const daysRemaining = Math.ceil((windowEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const daysSinceOptimal = Math.ceil((today.getTime() - optimalDate.getTime()) / (1000 * 60 * 60 * 24));

          let status: PlantableItem["status"] = "optimal";
          if (daysSinceOptimal < -7) status = "just-started";
          else if (daysRemaining <= 7) status = "ending-soon";
          else if (daysRemaining < 0) status = "past";

          if (status !== "past") {
            items.push({
              plant,
              category: "start-indoors",
              windowStart: optimalDate,
              windowEnd,
              daysRemaining,
              status,
            });
          }
        }
      }

      // Transplant
      if (plant.transplantWeeksAfterFrost != null) {
        const optimalDate = addWeeks(lastFrost, plant.transplantWeeksAfterFrost);
        const windowEnd = addWeeks(optimalDate, WINDOW_BUFFER_WEEKS);

        if (today <= windowEnd && today >= addWeeks(optimalDate, -2)) {
          const daysRemaining = Math.ceil((windowEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const daysSinceOptimal = Math.ceil((today.getTime() - optimalDate.getTime()) / (1000 * 60 * 60 * 24));

          let status: PlantableItem["status"] = "optimal";
          if (daysSinceOptimal < 0) status = "just-started";
          else if (daysRemaining <= 7) status = "ending-soon";

          items.push({
            plant,
            category: "transplant",
            windowStart: optimalDate,
            windowEnd,
            daysRemaining,
            status,
          });
        }
      }

      // Direct sow
      if (plant.directSowWeeksRelativeToFrost != null) {
        const optimalDate = addWeeks(lastFrost, plant.directSowWeeksRelativeToFrost);
        // Direct sow window extends until fall frost minus days to maturity
        const daysToMaturity = plant.daysToMaturityMax ?? plant.daysToMaturityMin ?? 60;
        const latestSow = addWeeks(firstFrost, -Math.ceil(daysToMaturity / 7));
        const windowEnd = latestSow > addWeeks(optimalDate, WINDOW_BUFFER_WEEKS)
          ? addWeeks(optimalDate, WINDOW_BUFFER_WEEKS * 2)
          : latestSow;

        if (today <= windowEnd && today >= addWeeks(optimalDate, -2)) {
          const daysRemaining = Math.ceil((windowEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const daysSinceOptimal = Math.ceil((today.getTime() - optimalDate.getTime()) / (1000 * 60 * 60 * 24));

          let status: PlantableItem["status"] = "optimal";
          if (daysSinceOptimal < 0) status = "just-started";
          else if (daysRemaining <= 7) status = "ending-soon";

          items.push({
            plant,
            category: "direct-sow",
            windowStart: optimalDate,
            windowEnd,
            daysRemaining,
            status,
          });
        }
      }
    }

    // Sort: ending-soon first, then by days remaining
    return items.sort((a, b) => {
      if (a.status === "ending-soon" && b.status !== "ending-soon") return -1;
      if (a.status !== "ending-soon" && b.status === "ending-soon") return 1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [settings, plants, showSeedsOnly]);

  const filteredItems = useMemo(() => {
    if (categoryFilter === "all") return plantableNow;
    return plantableNow.filter((item) => item.category === categoryFilter);
  }, [plantableNow, categoryFilter]);

  const categoryConfig: Record<PlantableCategory, { emoji: string; label: string; bgClass: string; textClass: string }> = {
    "start-indoors": {
      emoji: "🌱",
      label: "Start Indoors",
      bgClass: "bg-sky-100",
      textClass: "text-sky-700",
    },
    transplant: {
      emoji: "🏡",
      label: "Transplant",
      bgClass: "bg-sage/20",
      textClass: "text-sage-dark",
    },
    "direct-sow": {
      emoji: "🌾",
      label: "Direct Sow",
      bgClass: "bg-amber-100",
      textClass: "text-amber-700",
    },
  };

  if (loading) {
    return (
      <div className={ui.page}>
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center gap-2 text-earth-warm">
            <div className="w-5 h-5 border-2 border-earth-warm/60 border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={ui.page}>
        <div className="max-w-6xl mx-auto p-4">
          <p className="text-terracotta">{error}</p>
          <Link href="/garden" className="text-sage-dark underline mt-2 block">
            Back to garden
          </Link>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={ui.page}>
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-8">
            <p className="text-earth-warm mb-4">
              Please configure your frost dates in settings to see what you can plant now.
            </p>
            <Link href="/settings" className={ui.btnPrimary}>
              Go to Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className="max-w-6xl mx-auto p-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 border border-cream-200 p-6 mb-6">
          {/* Decorative seedling icon */}
          <div className="absolute top-0 right-0 opacity-10">
            <svg className="w-32 h-32 text-sage" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-gradient-to-br from-sage to-sage-dark text-white p-2.5 rounded-xl shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
                  What Can I Plant Now?
                </h1>
                <p className="text-earth-warm text-sm mt-1">
                  Based on your frost dates: Last frost {formatDate(new Date(settings.lastSpringFrost))}, First frost{" "}
                  {formatDate(new Date(settings.firstFallFrost))}
                </p>
              </div>
            </div>
            <Link href="/garden" className="text-sm text-sage-dark hover:underline">
              Back to garden
            </Link>
          </div>
        </div>

        {/* Successions Due Section */}
        {successionsDue.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-earth-deep mb-3 flex items-center gap-2">
              <span className="text-violet-500">🔄</span> Successions Due
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {successionsDue.slice(0, 6).map((item) => {
                const isOverdue = item.isOverdue;
                const isDueSoon = item.daysUntilDue !== null && item.daysUntilDue <= 7 && item.daysUntilDue >= 0;

                return (
                  <div
                    key={`succ-${item.plantId}`}
                    className={`rounded-lg border-2 p-4 ${
                      isOverdue
                        ? "border-terracotta/30 bg-terracotta-50"
                        : isDueSoon
                        ? "border-violet-300 bg-violet-50"
                        : "border-violet-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-earth-deep">{item.plantName}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                        #{item.nextSuccessionNumber}
                      </span>
                    </div>

                    <div className="text-sm text-earth-warm space-y-1">
                      {item.latestPlacement && (
                        <p>
                          <span className="text-earth-warm">Last planted:</span>{" "}
                          {item.latestPlacement.plantedDate
                            ? formatDate(new Date(item.latestPlacement.plantedDate))
                            : "N/A"}{" "}
                          in {item.latestPlacement.bedName}
                        </p>
                      )}
                      {item.dueDate && (
                        <p>
                          <span className="text-earth-warm">Due:</span> {formatDate(new Date(item.dueDate))}
                        </p>
                      )}
                      <p className="text-xs text-earth-warm">
                        {item.currentCount}/{item.maxCount} planted • Every {item.intervalDays} days
                      </p>
                    </div>

                    <div className="mt-3">
                      <span
                        className={`text-xs font-medium ${
                          isOverdue
                            ? "text-terracotta"
                            : isDueSoon
                            ? "text-violet-600"
                            : "text-earth-warm"
                        }`}
                      >
                        {isOverdue
                          ? `⚠️ ${Math.abs(item.daysUntilDue ?? 0)} days overdue!`
                          : item.daysUntilDue === 0
                          ? "📅 Due today!"
                          : item.daysUntilDue !== null
                          ? `${item.daysUntilDue} days until due`
                          : "Ready to plant"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {successionsDue.length > 6 && (
              <p className="text-sm text-earth-warm mt-2">
                + {successionsDue.length - 6} more succession{successionsDue.length - 6 > 1 ? "s" : ""} scheduled
              </p>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-earth-warm">Show:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as PlantableCategory | "all")}
              className="text-sm border rounded-lg px-3 py-1.5"
            >
              <option value="all">All Actions</option>
              <option value="start-indoors">Start Indoors</option>
              <option value="transplant">Transplant</option>
              <option value="direct-sow">Direct Sow</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-earth-warm cursor-pointer">
            <input
              type="checkbox"
              checked={showSeedsOnly}
              onChange={(e) => setShowSeedsOnly(e.target.checked)}
              className="rounded border-cream-200"
            />
            Only plants I have seeds for
          </label>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["start-indoors", "transplant", "direct-sow"] as PlantableCategory[]).map((cat) => {
            const count = plantableNow.filter((i) => i.category === cat).length;
            const config = categoryConfig[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  categoryFilter === cat
                    ? `${config.bgClass} ${config.textClass} ring-2 ring-offset-1 ring-current`
                    : "bg-cream-100 text-earth-warm hover:bg-cream-200"
                }`}
              >
                {config.emoji} {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Results */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-earth-warm">
            <p className="text-lg mb-2">No plants to show right now</p>
            <p className="text-sm">
              {showSeedsOnly
                ? "Try unchecking 'Only plants I have seeds for' or add more plants to your library."
                : "Add plants with planting information to your library to see recommendations."}
            </p>
            <Link href="/plants" className="text-sage-dark underline mt-4 inline-block">
              Go to Plants →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, idx) => {
              const config = categoryConfig[item.category];
              return (
                <div
                  key={`${item.plant.id}-${item.category}-${idx}`}
                  className={`rounded-lg border p-4 ${
                    item.status === "ending-soon"
                      ? "border-orange-300 bg-orange-50"
                      : item.status === "just-started"
                      ? "border-sage/30 bg-sage/10"
                      : "border-cream-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-earth-deep">{item.plant.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
                      {config.emoji} {config.label}
                    </span>
                  </div>

                  {item.plant.variety && (
                    <p className="text-xs text-earth-warm mb-2">{item.plant.variety}</p>
                  )}

                  <div className="text-sm text-earth-warm space-y-1">
                    <p>
                      <span className="text-earth-warm">Window:</span> {formatDate(item.windowStart)} -{" "}
                      {formatDate(item.windowEnd)}
                    </p>
                    {item.plant.daysToMaturityMin && (
                      <p>
                        <span className="text-earth-warm">Days to harvest:</span>{" "}
                        {item.plant.daysToMaturityMin}
                        {item.plant.daysToMaturityMax && item.plant.daysToMaturityMax !== item.plant.daysToMaturityMin
                          ? `-${item.plant.daysToMaturityMax}`
                          : ""}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        item.status === "ending-soon"
                          ? "text-orange-600"
                          : item.status === "just-started"
                          ? "text-sage-dark"
                          : "text-sage-dark"
                      }`}
                    >
                      {item.status === "ending-soon"
                        ? `⏰ ${item.daysRemaining} days left!`
                        : item.status === "just-started"
                        ? "🌟 Window just opened"
                        : `✓ ${item.daysRemaining} days remaining`}
                    </span>

                    {item.plant.hasSeeds && (
                      <span className="text-xs text-sage-dark bg-sage/20 px-2 py-0.5 rounded">
                        🌰 Have seeds
                      </span>
                    )}
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
