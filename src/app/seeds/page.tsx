"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/uiStyles";

type Plant = {
  id: number;
  name: string;
  variety: string | null;
  hasSeeds: boolean;
  spacingInches: number;
  daysToMaturityMin: number | null;
  daysToMaturityMax: number | null;
};

export default function SeedInventoryPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  async function loadPlants() {
    try {
      setError("");
      const res = await fetch("/api/plants");
      if (!res.ok) {
        setError("Failed to load plants");
        return;
      }
      const data = await res.json();
      setPlants(data);
    } catch {
      setError("Failed to load plants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlants();
  }, []);

  async function toggleHasSeeds(plant: Plant) {
    setUpdating(plant.id);
    try {
      const res = await fetch(`/api/plants/${plant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasSeeds: !plant.hasSeeds }),
      });
      if (res.ok) {
        setPlants((prev) =>
          prev.map((p) =>
            p.id === plant.id ? { ...p, hasSeeds: !p.hasSeeds } : p
          )
        );
      }
    } catch {
      setError("Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  const plantsWithSeeds = plants.filter((p) => p.hasSeeds);
  const plantsNeedingSeeds = plants.filter((p) => !p.hasSeeds);

  if (loading) return <p className="text-sm text-earth-warm">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 border border-cream-200 p-6">
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-32 h-32 text-sage" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-shrink-0 bg-gradient-to-br from-sage to-sage-dark text-white p-2.5 rounded-xl shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
              Seed Inventory
            </h1>
            <p className="text-earth-warm text-sm mt-1">
              Track which plants you have seeds for and what you still need to buy
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-cream-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-earth-deep">{plants.length}</p>
          <p className="text-xs text-earth-warm">Total Plants</p>
        </div>
        <div className="rounded-lg border border-sage/20 bg-sage/20 p-3 text-center">
          <p className="text-2xl font-bold text-sage-dark">{plantsWithSeeds.length}</p>
          <p className="text-xs text-sage-dark">Have Seeds</p>
        </div>
        <div className="rounded-lg border border-terracotta/30 bg-terracotta-50 p-3 text-center">
          <p className="text-2xl font-bold text-terracotta-dark">{plantsNeedingSeeds.length}</p>
          <p className="text-xs text-terracotta">Need Seeds</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {plants.length === 0 ? (
        <div className={`${ui.card} ${ui.cardPad} text-center py-12`}>
          <p className="text-earth-warm mb-4">
            No plants added yet. Add plants first to track your seed inventory.
          </p>
          <Link href="/plants" className={`${ui.btn} ${ui.btnPrimary}`}>
            Go to Plants
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Plants needing seeds - Shopping List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-terracotta" />
              <h2 className="text-lg font-semibold">Need to Buy</h2>
              <span className="text-sm text-earth-warm">({plantsNeedingSeeds.length})</span>
            </div>

            {plantsNeedingSeeds.length === 0 ? (
              <div className={`${ui.card} ${ui.cardPad} text-center py-8`}>
                <p className="text-earth-warm text-sm">You have seeds for all your plants!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {plantsNeedingSeeds.map((plant) => (
                  <div
                    key={plant.id}
                    className={`${ui.card} px-4 py-3 flex items-center justify-between gap-3`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-earth-deep truncate">{plant.name}</p>
                      {plant.variety && (
                        <p className="text-sm text-earth-warm truncate">{plant.variety}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleHasSeeds(plant)}
                      disabled={updating === plant.id}
                      className="flex-shrink-0 text-sm text-sage-dark hover:text-sage-dark font-medium disabled:opacity-50"
                    >
                      {updating === plant.id ? "..." : "Mark as owned"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plants with seeds - Inventory */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sage" />
              <h2 className="text-lg font-semibold">Have Seeds</h2>
              <span className="text-sm text-earth-warm">({plantsWithSeeds.length})</span>
            </div>

            {plantsWithSeeds.length === 0 ? (
              <div className={`${ui.card} ${ui.cardPad} text-center py-8`}>
                <p className="text-earth-warm text-sm">
                  No seeds yet. Mark plants as owned when you buy seeds.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {plantsWithSeeds.map((plant) => (
                  <div
                    key={plant.id}
                    className={`${ui.card} px-4 py-3 flex items-center justify-between gap-3 border-l-4 border-l-sage`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-earth-deep truncate">{plant.name}</p>
                      {plant.variety && (
                        <p className="text-sm text-earth-warm truncate">{plant.variety}</p>
                      )}
                      {plant.daysToMaturityMin && (
                        <p className="text-xs text-earth-warm/60">
                          {plant.daysToMaturityMin}
                          {plant.daysToMaturityMax && plant.daysToMaturityMax !== plant.daysToMaturityMin
                            ? `-${plant.daysToMaturityMax}`
                            : ""}{" "}
                          days to maturity
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleHasSeeds(plant)}
                      disabled={updating === plant.id}
                      className="flex-shrink-0 text-sm text-earth-warm/60 hover:text-rose-600 disabled:opacity-50"
                      title="Remove from inventory"
                    >
                      {updating === plant.id ? "..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="rounded-lg border border-mustard/30 bg-mustard-50 p-4 text-sm text-earth-deep">
        <p>
          <strong>Tip:</strong> When adding a new plant on the{" "}
          <Link href="/plants" className="underline">
            Plants page
          </Link>
          , check &quot;I already have seeds&quot; to automatically add it to your inventory.
        </p>
      </div>
    </div>
  );
}
