"use client";

import { useState } from "react";

interface PerenualPlant {
  id: number;
  common_name: string;
  scientific_name: string[];
  cycle?: string;
  watering?: string;
  sunlight?: string[];
  default_image?: {
    thumbnail?: string;
    small_url?: string;
  } | null;
}

interface PerenualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

export default function PerenualSearchModal({ isOpen, onClose, onImport }: PerenualSearchModalProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [results, setResults] = useState<PerenualPlant[]>([]);
  const [error, setError] = useState("");
  const [edibleOnly, setEdibleOnly] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  async function handleSearch(e: React.FormEvent, page: number = 1) {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) {
      setError("Please enter at least 2 characters");
      return;
    }

    setSearching(true);
    setError("");
    if (page === 1) {
      setResults([]);
    }

    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
      });
      if (edibleOnly) params.append("edible", "true");

      const res = await fetch(`/api/perenual/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed");
        setSearching(false);
        return;
      }

      setResults(data.data || []);
      setTotal(data.total || 0);
      setCurrentPage(data.current_page || 1);
      setTotalPages(data.last_page || 1);
      setSearching(false);
    } catch (err) {
      setError("Failed to search Perenual. Please try again.");
      setSearching(false);
    }
  }

  async function handleImport(plantId: number) {
    setImporting(plantId);
    setError("");

    try {
      const res = await fetch("/api/perenual/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perenualId: plantId }),
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

  function handlePageChange(newPage: number) {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSearch(fakeEvent, newPage);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-lg border border-slate-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Search Perenual Plant Database
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Import plant data from the Perenual API with detailed growing information
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
          <form onSubmit={(e) => handleSearch(e, 1)} className="space-y-3">
            <div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by common or scientific name (e.g., tomato, lettuce, carrot)..."
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={edibleOnly}
                  onChange={(e) => setEdibleOnly(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Edible plants only
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
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
              <p>
                Found {total} result{total !== 1 ? "s" : ""} • Page {currentPage} of {totalPages}
              </p>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || searching}
                    className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || searching}
                    className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50 disabled:opacity-30"
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
            <div className="mb-4 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
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
                className="flex items-center gap-3 rounded border border-slate-200 p-3 hover:bg-slate-50"
              >
                {plant.default_image?.thumbnail && (
                  <img
                    src={plant.default_image.thumbnail}
                    alt={plant.common_name}
                    className="h-16 w-16 rounded object-cover"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">
                    {plant.common_name}
                  </h3>
                  <p className="text-xs text-slate-600 italic truncate">
                    {Array.isArray(plant.scientific_name)
                      ? plant.scientific_name[0]
                      : plant.scientific_name}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {plant.cycle && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                        {plant.cycle}
                      </span>
                    )}
                    {plant.watering && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                        {plant.watering}
                      </span>
                    )}
                    {plant.sunlight?.[0] && (
                      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
                        {plant.sunlight[0]}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleImport(plant.id)}
                  disabled={importing === plant.id}
                  className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 shrink-0"
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
            Data provided by <a href="https://perenual.com" target="_blank" rel="noopener noreferrer" className="underline">Perenual.com</a>
            {" "}- Free tier: 100 requests/day • 300 requests/day for registered users
          </p>
        </div>
      </div>
    </div>
  );
}
