"use client";

import { useState } from "react";

interface TreflePlant {
  id: number;
  common_name: string | null;
  scientific_name: string;
  slug: string;
  family_common_name: string | null;
  image_url: string | null;
  edible?: boolean;
  vegetable?: boolean;
}

interface TrefleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

export default function TrefleSearchModal({ isOpen, onClose, onImport }: TrefleSearchModalProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [results, setResults] = useState<TreflePlant[]>([]);
  const [error, setError] = useState("");
  const [vegetableOnly, setVegetableOnly] = useState(true);
  const [total, setTotal] = useState(0);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) {
      setError("Please enter at least 2 characters");
      return;
    }

    setSearching(true);
    setError("");
    setResults([]);

    try {
      const params = new URLSearchParams({
        q: query,
        page: "1",
      });
      if (vegetableOnly) params.append("vegetable", "true");

      const res = await fetch(`/api/trefle/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed");
        setSearching(false);
        return;
      }

      setResults(data.data || []);
      setTotal(data.meta?.total || 0);
      setSearching(false);
    } catch (err) {
      setError("Failed to search Trefle. Please try again.");
      setSearching(false);
    }
  }

  async function handleImport(plantId: number) {
    setImporting(plantId);
    setError("");

    try {
      const res = await fetch("/api/trefle/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trefleId: plantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        setImporting(null);
        return;
      }

      // Success - close modal and refresh plants list
      setImporting(null);
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
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg border border-slate-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Search Trefle Plant Database
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Import plant data from the free Trefle botanical API
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
                placeholder="Search by common or scientific name..."
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={vegetableOnly}
                  onChange={(e) => setVegetableOnly(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Vegetables only
              </label>

              <button
                type="submit"
                disabled={searching}
                className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {total > 0 && (
            <p className="mt-2 text-xs text-slate-600">
              Found {total} result{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {results.length === 0 && !searching && (
            <div className="py-8 text-center text-sm text-slate-500">
              Enter a search term to find plants
            </div>
          )}

          <div className="space-y-2">
            {results.map((plant) => (
              <div
                key={plant.id}
                className="flex items-center justify-between rounded border border-slate-200 p-3 hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">
                      {plant.common_name || plant.scientific_name}
                    </h3>
                    {plant.vegetable && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                        Vegetable
                      </span>
                    )}
                    {plant.edible && !plant.vegetable && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                        Edible
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 italic mt-0.5">
                    {plant.scientific_name}
                  </p>
                  {plant.family_common_name && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {plant.family_common_name} family
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleImport(plant.id)}
                  disabled={importing === plant.id}
                  className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {importing === plant.id ? "Importing..." : "Import"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <p className="text-xs text-slate-500">
            Data provided by <a href="https://trefle.io" target="_blank" rel="noopener noreferrer" className="underline">Trefle.io</a>
            {" "}- Free rate limit: 60 requests/minute
          </p>
        </div>
      </div>
    </div>
  );
}
