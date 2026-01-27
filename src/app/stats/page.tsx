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
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Garden Statistics</h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Garden Statistics</h1>
        <p className="text-red-600">{error || "No data available"}</p>
      </div>
    );
  }

  const statusTotal = Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Garden Statistics</h1>
        <Link className="text-sm underline" href="/">
          Back to home
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-3xl font-bold text-emerald-600">{stats.summary.totalBeds}</p>
          <p className="text-sm text-slate-600">Beds</p>
        </div>
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-3xl font-bold text-blue-600">{stats.summary.totalPlants}</p>
          <p className="text-sm text-slate-600">Plant Types</p>
        </div>
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-3xl font-bold text-amber-600">{stats.summary.totalPlacements}</p>
          <p className="text-sm text-slate-600">Planted</p>
        </div>
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <p className="text-3xl font-bold text-purple-600">
            {stats.companionPlanting.score !== null ? `${stats.companionPlanting.score}%` : "N/A"}
          </p>
          <p className="text-sm text-slate-600">Companion Score</p>
        </div>
      </div>

      {/* Status Progress */}
      {statusTotal > 0 && (
        <div className={`${ui.card} ${ui.cardPad}`}>
          <h2 className="font-semibold mb-3">Growth Progress</h2>
          <div className="flex h-6 rounded-full overflow-hidden bg-slate-100">
            {stats.statusBreakdown.planned > 0 && (
              <div
                className="bg-slate-400 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.statusBreakdown.planned / statusTotal) * 100}%` }}
                title={`Planned: ${stats.statusBreakdown.planned}`}
              >
                {stats.statusBreakdown.planned > statusTotal * 0.1 && stats.statusBreakdown.planned}
              </div>
            )}
            {stats.statusBreakdown.seedsStarted > 0 && (
              <div
                className="bg-blue-400 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.statusBreakdown.seedsStarted / statusTotal) * 100}%` }}
                title={`Seeds Started: ${stats.statusBreakdown.seedsStarted}`}
              >
                {stats.statusBreakdown.seedsStarted > statusTotal * 0.1 && stats.statusBreakdown.seedsStarted}
              </div>
            )}
            {stats.statusBreakdown.growing > 0 && (
              <div
                className="bg-emerald-400 flex items-center justify-center text-xs text-white font-medium"
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
              <div className="w-3 h-3 rounded-full bg-slate-400" /> Planned ({stats.statusBreakdown.planned})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-400" /> Seeds Started ({stats.statusBreakdown.seedsStarted})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-400" /> Growing ({stats.statusBreakdown.growing})
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
                  <span className="text-sm text-slate-500 w-5">{idx + 1}.</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{plant.name}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${(plant.count / stats.topPlants[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{plant.count}</span>
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
                    <span className="text-slate-600">
                      {bed.utilizationPercent}% ({bed.placementCount} plants)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        bed.utilizationPercent > 80
                          ? "bg-amber-400"
                          : bed.utilizationPercent > 50
                          ? "bg-emerald-400"
                          : "bg-blue-400"
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
                      <span className="text-slate-500 ml-1">({harvest.bedName})</span>
                    </div>
                    <span className={isOverdue ? "text-amber-600 font-medium" : "text-slate-600"}>
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
                <div key={yield_.unit} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{yield_.amount}</p>
                  <p className="text-sm text-slate-600">{yield_.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-700 mb-2">Great Pairings</p>
                <ul className="space-y-1 text-sm text-emerald-600">
                  {stats.companionPlanting.goodPairs.map((pair, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{pair.plant1}</span> +{" "}
                      <span className="font-medium">{pair.plant2}</span>
                      <span className="text-emerald-500 text-xs ml-1">- {pair.reason}</span>
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
          <p className="text-slate-600 mb-3">
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
