"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/uiStyles";

type Stats = {
  summary: {
    totalBeds: number;
    totalPlants: number;
    totalPlacements: number;
  };
  statusBreakdown: {
    planned: number;
    seedsStarted: number;
    growing: number;
    harvesting: number;
    complete: number;
  };
  topPlants: { name: string; count: number }[];
  harvestYields: { unit: string; amount: number }[];
  plantYields: { plantName: string; amount: number; unit: string }[];
  historicalYields: { year: number; yields: { unit: string; amount: number }[] }[];
  companionPlanting: {
    score: number | null;
    goodPairs: { plant1: string; plant2: string; reason: string }[];
    badPairs: { plant1: string; plant2: string; reason: string }[];
  };
  upcomingHarvests: { plantName: string; estimatedDate: string; bedName: string }[];
  bedUtilization: { name: string; utilizationPercent: number; placementCount: number }[];
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load garden statistics");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 border border-cream-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-gradient-to-br from-sage to-sage-dark text-white p-2.5 rounded-xl shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
                Garden Statistics
              </h1>
              <p className="text-earth-warm text-sm mt-1">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 border border-cream-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-gradient-to-br from-sage to-sage-dark text-white p-2.5 rounded-xl shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
                Garden Statistics
              </h1>
              <p className="text-terracotta text-sm mt-1">{error || "No data available"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusTotal = Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 border border-cream-200 p-6">
        {/* Decorative chart icon */}
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-32 h-32 text-sage" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-gradient-to-br from-sage to-sage-dark text-white p-2.5 rounded-xl shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
                Garden Statistics
              </h1>
              <p className="text-earth-warm text-sm mt-1">
                Track your garden&apos;s progress and performance
              </p>
            </div>
          </div>
          <Link className="text-sm text-sage-dark hover:underline" href="/">
            Back to home
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-3xl font-bold text-sage-dark">{stats.summary.totalBeds}</p>
          <p className="text-sm text-earth-warm">Beds</p>
        </div>
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-3xl font-bold text-sage">{stats.summary.totalPlants}</p>
          <p className="text-sm text-earth-warm">Plant Types</p>
        </div>
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-3xl font-bold text-amber-600">{stats.summary.totalPlacements}</p>
          <p className="text-sm text-earth-warm">Planted</p>
        </div>
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-3xl font-bold text-earth-deep">
            {stats.companionPlanting.score !== null ? `${stats.companionPlanting.score}%` : "N/A"}
          </p>
          <p className="text-sm text-earth-warm">Companion Score</p>
        </div>
      </div>

      {/* Status Progress */}
      {statusTotal > 0 && (
        <div className={`${ui.card} ${ui.cardPad}`}>
          <h2 className="font-semibold mb-3">Growth Progress</h2>
          <div className="flex h-6 rounded-full overflow-hidden bg-cream-100">
            {stats.statusBreakdown.planned > 0 && (
              <div
                className="bg-earth-warm/60 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.statusBreakdown.planned / statusTotal) * 100}%` }}
                title={`Planned: ${stats.statusBreakdown.planned}`}
              >
                {stats.statusBreakdown.planned > statusTotal * 0.1 && stats.statusBreakdown.planned}
              </div>
            )}
            {stats.statusBreakdown.seedsStarted > 0 && (
              <div
                className="bg-mustard flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.statusBreakdown.seedsStarted / statusTotal) * 100}%` }}
                title={`Seeds Started: ${stats.statusBreakdown.seedsStarted}`}
              >
                {stats.statusBreakdown.seedsStarted > statusTotal * 0.1 && stats.statusBreakdown.seedsStarted}
              </div>
            )}
            {stats.statusBreakdown.growing > 0 && (
              <div
                className="bg-sage flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.statusBreakdown.growing / statusTotal) * 100}%` }}
                title={`Growing: ${stats.statusBreakdown.growing}`}
              >
                {stats.statusBreakdown.growing > statusTotal * 0.1 && stats.statusBreakdown.growing}
              </div>
            )}
            {stats.statusBreakdown.harvesting > 0 && (
              <div
                className="bg-amber-400 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.statusBreakdown.harvesting / statusTotal) * 100}%` }}
                title={`Harvesting: ${stats.statusBreakdown.harvesting}`}
              >
                {stats.statusBreakdown.harvesting > statusTotal * 0.1 && stats.statusBreakdown.harvesting}
              </div>
            )}
            {stats.statusBreakdown.complete > 0 && (
              <div
                className="bg-purple-400 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.statusBreakdown.complete / statusTotal) * 100}%` }}
                title={`Complete: ${stats.statusBreakdown.complete}`}
              >
                {stats.statusBreakdown.complete > statusTotal * 0.1 && stats.statusBreakdown.complete}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-earth-warm/60" /> Planned ({stats.statusBreakdown.planned})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-mustard" /> Seeds Started ({stats.statusBreakdown.seedsStarted})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-sage" /> Growing ({stats.statusBreakdown.growing})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-400" /> Harvesting ({stats.statusBreakdown.harvesting})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-400" /> Complete ({stats.statusBreakdown.complete})
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Plants */}
        {stats.topPlants.length > 0 && (
          <div className={`${ui.card} ${ui.cardPad}`}>
            <h2 className="font-semibold mb-3">Top Plants</h2>
            <div className="space-y-2">
              {stats.topPlants.map((plant, idx) => (
                <div key={plant.name} className="flex items-center gap-2">
                  <span className="text-sm text-earth-warm w-5">{idx + 1}.</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{plant.name}</span>
                    <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage rounded-full"
                        style={{ width: `${(plant.count / stats.topPlants[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-earth-warm">{plant.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bed Utilization */}
        {stats.bedUtilization.length > 0 && (
          <div className={`${ui.card} ${ui.cardPad}`}>
            <h2 className="font-semibold mb-3">Bed Utilization</h2>
            <div className="space-y-2">
              {stats.bedUtilization.map((bed) => (
                <div key={bed.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{bed.name}</span>
                    <span className="text-earth-warm">
                      {bed.utilizationPercent}% ({bed.placementCount} plants)
                    </span>
                  </div>
                  <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        bed.utilizationPercent > 80
                          ? "bg-amber-400"
                          : bed.utilizationPercent > 50
                          ? "bg-sage"
                          : "bg-sage/50"
                      }`}
                      style={{ width: `${bed.utilizationPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Harvests */}
        {stats.upcomingHarvests.length > 0 && (
          <div className={`${ui.card} ${ui.cardPad}`}>
            <h2 className="font-semibold mb-3">Upcoming Harvests</h2>
            <div className="space-y-2">
              {stats.upcomingHarvests.map((harvest, idx) => {
                const date = new Date(harvest.estimatedDate);
                const isOverdue = date < new Date();
                const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{harvest.plantName}</span>
                      <span className="text-earth-warm ml-1">({harvest.bedName})</span>
                    </div>
                    <span className={isOverdue ? "text-amber-600 font-medium" : "text-earth-warm"}>
                      {isOverdue
                        ? "Ready!"
                        : daysUntil === 0
                        ? "Today"
                        : daysUntil === 1
                        ? "Tomorrow"
                        : `${daysUntil} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Harvest Yields */}
        {stats.harvestYields.length > 0 && (
          <div className={`${ui.card} ${ui.cardPad}`}>
            <h2 className="font-semibold mb-3">Total Harvests</h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.harvestYields.map((yield_) => (
                <div key={yield_.unit} className="bg-cream-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-sage-dark">{yield_.amount}</p>
                  <p className="text-sm text-earth-warm">{yield_.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yield by Plant */}
        {stats.plantYields && stats.plantYields.length > 0 && (
          <div className={`${ui.card} ${ui.cardPad}`}>
            <h2 className="font-semibold mb-3">Yields by Plant</h2>
            <div className="space-y-2">
              {stats.plantYields.map((item, idx) => (
                <div key={`${item.plantName}-${item.unit}`} className="flex items-center gap-2">
                  <span className="text-sm text-earth-warm w-5">{idx + 1}.</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{item.plantName}</span>
                    <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${(item.amount / stats.plantYields[0].amount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-earth-warm">
                      {item.amount} {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Historical Yields by Year */}
      {stats.historicalYields && stats.historicalYields.length > 0 && (
        <div className={`${ui.card} ${ui.cardPad}`}>
          <h2 className="font-semibold mb-3">Historical Yields by Year</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.historicalYields.map((yearData) => (
              <div key={yearData.year} className="bg-gradient-to-br from-mustard-50 to-mustard-100 rounded-lg border border-mustard/30 p-4">
                <h3 className="font-semibold text-earth-deep mb-2">{yearData.year}</h3>
                <div className="space-y-1">
                  {yearData.yields.map((y) => (
                    <div key={y.unit} className="flex justify-between text-sm">
                      <span className="text-earth-warm">{y.unit}</span>
                      <span className="font-medium text-earth-deep">{y.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-earth-warm mt-3">
            Archive completed harvests to build your historical yield data for comparison
          </p>
        </div>
      )}

      {/* Companion Planting */}
      {(stats.companionPlanting.goodPairs.length > 0 || stats.companionPlanting.badPairs.length > 0) && (
        <div className={`${ui.card} ${ui.cardPad}`}>
          <h2 className="font-semibold mb-3">Companion Planting Analysis</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {stats.companionPlanting.badPairs.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-semibold text-rose-700 mb-2">Conflicts to Consider</p>
                <ul className="space-y-1 text-sm text-rose-600">
                  {stats.companionPlanting.badPairs.map((pair, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{pair.plant1}</span> +{" "}
                      <span className="font-medium">{pair.plant2}</span>
                      <span className="text-rose-500 text-xs ml-1">- {pair.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stats.companionPlanting.goodPairs.length > 0 && (
              <div className="rounded-lg border border-sage/20 bg-sage/20 p-3">
                <p className="text-sm font-semibold text-sage-dark mb-2">Great Pairings</p>
                <ul className="space-y-1 text-sm text-sage-dark">
                  {stats.companionPlanting.goodPairs.map((pair, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{pair.plant1}</span> +{" "}
                      <span className="font-medium">{pair.plant2}</span>
                      <span className="text-sage-dark text-xs ml-1">- {pair.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.summary.totalPlacements === 0 && (
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-earth-warm mb-3">
            No plants placed yet. Add some plants to your beds to see statistics!
          </p>
          <Link className={`${ui.btn} ${ui.btnPrimary}`} href="/beds">
            Go to Beds
          </Link>
        </div>
      )}
    </div>
  );
}
