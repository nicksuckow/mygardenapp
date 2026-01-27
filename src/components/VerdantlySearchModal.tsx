"use client";

import { useState } from "react";
import { ui } from "@/lib/uiStyles";

interface VerdantlyPlant {
  id: string;
  mappingId: string;
  name: string;
  category: string;
  type: string;
  subtype?: string;
  description?: string;
  growingRequirements: {
    minGrowingZone?: number;
    maxGrowingZone?: number;
    growingZoneRange?: string;
    sunlightRequirement?: string;
    waterRequirement?: string;
    soilPreference?: string;
    preferredTemperature?: string;
    spacingRequirement?: string;
    careInstructions?: string;
  };
  growthDetails: {
    growthPeriod?: string;
    growthType?: string;
    matureHeight?: number;
    matureWidth?: number;
  };
  lifecycleMilestones?: {
    avgFirstBloomDate?: string;
    firstHarvestDate?: string;
    lastHarvestDate?: string;
  };
  careInstructions?: {
    plantingInstructions?: {
      startIndoors?: string;
      transplantOutdoors?: string;
      directSow?: string;
    };
    pruningInstructions?: string;
    harvestingInstructions?: string;
  };
  commonUses?: string;
  pestAndDiseaseRisks?: string;
  highlights?: string;
  history?: string;
}

interface VerdantlySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

export default function VerdantlySearchModal({ isOpen, onClose, onImport }: VerdantlySearchModalProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [results, setResults] = useState<VerdantlyPlant[]>([]);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Seed tracking option
  const [hasSeeds, setHasSeeds] = useState(false);

  async function handleSearch(e?: React.FormEvent, page: number = 1) {
    e?.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setError("Please enter at least 2 characters");
      return;
    }

    setSearching(true);
    setError("");
    if (page === 1) {
      setResults([]); // Only clear results when starting a new search
    }

    try {
      const params = new URLSearchParams({
        q: trimmedQuery,
        page: page.toString(),
      });

      const res = await fetch(`/api/verdantly/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed");
        setSearching(false);
        return;
      }

      setResults(data.results || []);
      setTotal(data.total || 0);
      setCurrentPage(page);
      setTotalPages(data.pages || 1);
      setSearching(false);
    } catch (err) {
      setError("Failed to search Verdantly. Please try again.");
      setSearching(false);
    }
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    handleSearch(undefined, newPage);
  }

  async function handleImport(plant: VerdantlyPlant) {
    setImporting(plant.id);
    setError("");

    try {
      const res = await fetch("/api/verdantly/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantData: plant }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        setImporting(null);
        return;
      }

      // If user has seeds, update the plant to track that
      if (hasSeeds && data.id) {
        const seedsRes = await fetch(`/api/plants/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasSeeds: true }),
        });
        if (!seedsRes.ok) {
          // Plant was imported but seed tracking failed - not critical, continue
          console.warn("Failed to update hasSeeds for imported plant");
        }
      }

      // Success - reset form and refresh plants list
      setImporting(null);
      setQuery("");
      setResults([]);
      setHasSeeds(false);
      onImport();
      onClose();
    } catch (err) {
      setError("Failed to import plant. Please try again.");
      setImporting(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-lg border border-slate-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Search Verdantly Plant Database
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Import plant data from Verdantly with detailed growing information
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Form */}
        <div className="border-b border-slate-200 p-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by common or scientific name (e.g., tomato, lettuce, carrot)..."
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="submit"
                disabled={searching}
                className={`${ui.btn} ${ui.btnPrimary}`}
              >
                {searching ? "Searching..." : "Search"}
              </button>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSeeds}
                  onChange={(e) => setHasSeeds(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-700">I have seeds for this plant</span>
              </label>
            </div>
          </form>

          {total > 0 && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <p>
                  Found {total} result{total !== 1 ? "s" : ""} • Page {currentPage} of {totalPages}
                </p>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || searching}
                    className={`${ui.btn} ${ui.btnSecondary} py-1 px-2 text-xs`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || searching}
                    className={`${ui.btn} ${ui.btnSecondary} py-1 px-2 text-xs`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {results.length === 0 && !searching && (
            <div className="py-8 text-center text-sm text-slate-500">
              Enter a search term to find plants (try "tomato", "lettuce", or "basil")
            </div>
          )}

          <div className="space-y-2">
            {results.map((plant) => (
              <div
                key={plant.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900 truncate">
                      {plant.name}
                    </h3>
                    {plant.subtype && (
                      <span className="text-xs text-slate-500">({plant.subtype})</span>
                    )}
                  </div>

                  {plant.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                      {plant.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {plant.category && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
                        {plant.category}
                      </span>
                    )}
                    {plant.type && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 capitalize">
                        {plant.type}
                      </span>
                    )}
                    {plant.growingRequirements.growingZoneRange && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Zones {plant.growingRequirements.growingZoneRange}
                      </span>
                    )}
                    {plant.growthDetails.growthPeriod && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {plant.growthDetails.growthPeriod}
                      </span>
                    )}
                    {plant.growingRequirements.spacingRequirement && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {plant.growingRequirements.spacingRequirement}
                      </span>
                    )}
                    {plant.growingRequirements.sunlightRequirement && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        ☀️ {plant.growingRequirements.sunlightRequirement}
                      </span>
                    )}
                    {plant.growingRequirements.waterRequirement && (
                      <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
                        💧 {plant.growingRequirements.waterRequirement}
                      </span>
                    )}
                    {plant.growingRequirements.preferredTemperature && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                        🌡️ {plant.growingRequirements.preferredTemperature}
                      </span>
                    )}
                    {plant.growthDetails.matureHeight && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        Height: {plant.growthDetails.matureHeight}"
                      </span>
                    )}
                  </div>

                  {/* Additional plant details that may be useful */}
                  {(plant.growingRequirements.soilPreference || plant.highlights || plant.commonUses) && (
                    <div className="mt-2 text-xs text-slate-600 space-y-1">
                      {plant.growingRequirements.soilPreference && (
                        <p>🌱 Soil: {plant.growingRequirements.soilPreference}</p>
                      )}
                      {plant.highlights && (
                        <p className="line-clamp-1">✨ {plant.highlights}</p>
                      )}
                      {plant.commonUses && (
                        <p className="line-clamp-1">🍴 {plant.commonUses}</p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleImport(plant)}
                  disabled={importing === plant.id}
                  className={`${ui.btn} ${ui.btnPrimary} shrink-0`}
                >
                  {importing === plant.id ? "Importing..." : "Import"}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom pagination */}
          {total > 0 && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 border-t border-slate-200 pt-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || searching}
                className={`${ui.btn} ${ui.btnSecondary} py-1 px-3 text-sm`}
              >
                ← Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || searching}
                className={`${ui.btn} ${ui.btnSecondary} py-1 px-3 text-sm`}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <p className="text-xs text-slate-500">
            Data provided by{" "}
            <a
              href="https://www.verdantly.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-600"
            >
              Verdantly.io
            </a>
            {" "}- Over 40,000 plant species and 5,000+ cultivated varieties
          </p>
        </div>
      </div>
    </div>
  );
}
