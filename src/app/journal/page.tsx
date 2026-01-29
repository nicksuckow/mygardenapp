"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { ui } from "@/lib/uiStyles";

type JournalEntry = {
  id: number;
  entryDate: string;
  title: string | null;
  content: string;
  weatherNote: string | null;
  temperature: number | null;
  bedId: number | null;
  photos: string | null;
  tags: string | null;
  createdAt: string;
};

type Bed = {
  id: number;
  name: string;
};

const TAG_SUGGESTIONS = [
  "harvest",
  "planting",
  "pest",
  "disease",
  "weather",
  "milestone",
  "observation",
  "maintenance",
  "fertilizing",
  "watering",
];

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New entry form
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newBedId, setNewBedId] = useState<number | null>(null);
  const [newWeather, setNewWeather] = useState("");
  const [newTemp, setNewTemp] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterBedId, setFilterBedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [jRes, bRes] = await Promise.all([
        fetch("/api/journal", { cache: "no-store" }),
        fetch("/api/beds", { cache: "no-store" }),
      ]);

      const jText = await jRes.text();
      const jJson = jText ? JSON.parse(jText) : [];

      if (!jRes.ok) {
        setError(jJson?.error || "Failed to load journal entries.");
        return;
      }

      setEntries(jJson);

      const bText = await bRes.text();
      const bJson = bText ? JSON.parse(bText) : [];
      if (Array.isArray(bJson)) {
        setBeds(bJson);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddEntry = async () => {
    if (!newContent.trim()) {
      setError("Please write something in your journal entry.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          title: newTitle || null,
          tags: newTags.length > 0 ? newTags.join(",") : null,
          bedId: newBedId,
          weatherNote: newWeather || null,
          temperature: newTemp ? parseFloat(newTemp) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save entry.");
        return;
      }

      // Reset form
      setNewContent("");
      setNewTitle("");
      setNewTags([]);
      setNewBedId(null);
      setNewWeather("");
      setNewTemp("");
      setIsAddingEntry(false);

      // Reload entries
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm("Delete this journal entry?")) return;

    try {
      const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete entry.");
        return;
      }
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete entry.");
    }
  };

  const toggleTag = (tag: string) => {
    if (newTags.includes(tag)) {
      setNewTags(newTags.filter((t) => t !== tag));
    } else {
      setNewTags([...newTags, tag]);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (filterTag && (!e.tags || !e.tags.includes(filterTag))) return false;
    if (filterBedId && e.bedId !== filterBedId) return false;
    return true;
  });

  // Get all unique tags from entries
  const allTags = [...new Set(entries.flatMap((e) => (e.tags ? e.tags.split(",") : [])))];

  if (loading) {
    return (
      <div className={ui.page}>
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-2 text-earth-warm">
            <div className="w-5 h-5 border-2 border-earth-warm/60 border-t-transparent rounded-full animate-spin" />
            Loading journal...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-earth-deep flex items-center gap-2">
              <span>📔</span> Garden Journal
            </h1>
            <p className="text-sm text-earth-warm mt-1">
              Track your garden progress, observations, and milestones
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/garden" className="text-sm underline text-earth-warm hover:text-earth-deep">
              Back to garden
            </Link>
            {!isAddingEntry && (
              <button
                onClick={() => setIsAddingEntry(true)}
                className={`${ui.btn} ${ui.btnPrimary}`}
              >
                + New Entry
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-terracotta-50 border border-terracotta/30 rounded-lg text-terracotta text-sm">
            {error}
          </div>
        )}

        {/* New Entry Form */}
        {isAddingEntry && (
          <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
            <h2 className="font-semibold text-earth-deep mb-4">New Journal Entry</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-deep mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., First tomato harvest!"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-deep mb-1">
                  What happened in your garden today?
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  placeholder="Write about plantings, observations, harvests, pests, weather conditions..."
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-deep mb-1">
                    Related Bed (optional)
                  </label>
                  <select
                    value={newBedId || ""}
                    onChange={(e) => setNewBedId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">No specific bed</option>
                    {beds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-earth-deep mb-1">Weather</label>
                    <input
                      type="text"
                      value={newWeather}
                      onChange={(e) => setNewWeather(e.target.value)}
                      placeholder="Sunny, rain..."
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-deep mb-1">Temp (F)</label>
                    <input
                      type="number"
                      value={newTemp}
                      onChange={(e) => setNewTemp(e.target.value)}
                      placeholder="72"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-deep mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                        newTags.includes(tag)
                          ? "bg-sage/20 text-sage-dark ring-1 ring-sage"
                          : "bg-cream-100 text-earth-warm hover:bg-cream-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAddingEntry(false)}
                  className="px-4 py-2 text-sm text-earth-warm hover:text-earth-deep"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  disabled={saving || !newContent.trim()}
                  className={`${ui.btn} ${ui.btnPrimary} disabled:opacity-50`}
                >
                  {saving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {entries.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3 items-center">
            <span className="text-sm text-earth-warm">Filter:</span>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      filterTag === tag
                        ? "bg-sage/20 text-sage-dark"
                        : "bg-cream-100 text-earth-warm hover:bg-cream-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {beds.length > 0 && (
              <select
                value={filterBedId || ""}
                onChange={(e) => setFilterBedId(e.target.value ? parseInt(e.target.value) : null)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="">All beds</option>
                {beds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {(filterTag || filterBedId) && (
              <button
                onClick={() => {
                  setFilterTag(null);
                  setFilterBedId(null);
                }}
                className="text-xs text-earth-warm hover:text-earth-deep underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-earth-warm">
            <p className="text-lg mb-2">
              {entries.length === 0 ? "No journal entries yet" : "No entries match your filters"}
            </p>
            <p className="text-sm">
              {entries.length === 0
                ? "Start documenting your garden journey!"
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => {
              const bed = beds.find((b) => b.id === entry.bedId);
              const tags = entry.tags ? entry.tags.split(",") : [];
              const photos = entry.photos ? JSON.parse(entry.photos) : [];

              return (
                <div key={entry.id} className="bg-white rounded-lg border p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-earth-warm">{formatDate(entry.entryDate)}</p>
                      {entry.title && (
                        <h3 className="font-semibold text-earth-deep mt-1">{entry.title}</h3>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-earth-warm/60 hover:text-terracotta transition-colors"
                      title="Delete entry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm text-earth-deep whitespace-pre-wrap">{entry.content}</p>

                  {/* Photos preview */}
                  {photos.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {photos.map((photo: string, idx: number) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {bed && (
                      <span className="px-2 py-0.5 bg-cream-100 text-earth-warm rounded">
                        📍 {bed.name}
                      </span>
                    )}
                    {entry.weatherNote && (
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded">
                        {entry.weatherNote}
                        {entry.temperature && ` ${entry.temperature}°F`}
                      </span>
                    )}
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-sage/20 text-sage-dark rounded cursor-pointer hover:bg-sage/20"
                        onClick={() => setFilterTag(tag)}
                      >
                        #{tag}
                      </span>
                    ))}
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
