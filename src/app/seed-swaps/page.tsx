"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";

type Settings = {
  zone: string | null;
};

// Common seed swap resources and communities
const SEED_RESOURCES = [
  {
    name: "Seed Savers Exchange",
    url: "https://seedsavers.org",
    description: "Nonprofit organization dedicated to saving and sharing heirloom seeds",
    type: "organization",
  },
  {
    name: "Local Seed Libraries",
    url: "https://seedlibraries.weebly.com/seed-library-locations.html",
    description: "Directory of seed lending libraries across the US",
    type: "directory",
  },
  {
    name: "Winter Sowing Community",
    url: "https://wintersown.org",
    description: "Community for winter sowing enthusiasts with seed sharing",
    type: "community",
  },
  {
    name: "Reddit r/seedswap",
    url: "https://reddit.com/r/seedswap",
    description: "Active online community for trading seeds",
    type: "community",
  },
  {
    name: "Facebook Seed Swap Groups",
    url: "https://facebook.com/search/groups/?q=seed%20swap",
    description: "Find local seed swap groups on Facebook",
    type: "social",
  },
];

// Tips for finding local swaps
const SEARCH_TIPS = [
  "Search for '[your city] seed swap' or '[your city] seed library'",
  "Check with local Master Gardener programs",
  "Visit local farmers markets - many host seed swaps in spring",
  "Contact your local extension office",
  "Look for local gardening clubs or societies",
  "Check community centers and libraries for events",
];

export default function SeedSwapsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [zipCode, setZipCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const text = await res.text();
        if (text) {
          setSettings(JSON.parse(text));
        }
      } catch {
        // Settings not available
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = () => {
    const query = zipCode
      ? `seed swap near ${zipCode}`
      : searchQuery
      ? `seed swap ${searchQuery}`
      : "seed swap near me";

    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
  };

  const handleMapSearch = () => {
    const query = zipCode
      ? `seed library near ${zipCode}`
      : "seed library near me";

    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, "_blank");
  };

  if (loading) {
    return (
      <div className={ui.page}>
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Loading...
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
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>🌱</span> Find Seed Swaps
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Discover local seed libraries, swaps, and gardening communities
              {settings?.zone && ` • Zone ${settings.zone}`}
            </p>
          </div>
          <Link href="/garden" className="text-sm underline text-slate-600 hover:text-slate-800">
            Back to garden
          </Link>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Find Local Resources</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Enter your ZIP code
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g., 90210"
                className="w-full border rounded-lg px-3 py-2"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Or search by city/state
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Portland, Oregon"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleSearch}
              className={`${ui.btn} ${ui.btnPrimary}`}
            >
              🔍 Search for Seed Swaps
            </button>
            <button
              onClick={handleMapSearch}
              className={`${ui.btn} ${ui.btnSecondary}`}
            >
              🗺️ Find on Map
            </button>
          </div>
        </div>

        {/* Online Resources */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Online Seed Swap Communities</h2>

          <div className="grid gap-3">
            {SEED_RESOURCES.map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
              >
                <span className="text-xl">
                  {resource.type === "organization" ? "🏢" :
                   resource.type === "directory" ? "📚" :
                   resource.type === "community" ? "👥" : "💬"}
                </span>
                <div>
                  <h3 className="font-medium text-slate-900">{resource.name}</h3>
                  <p className="text-sm text-slate-600">{resource.description}</p>
                </div>
                <span className="ml-auto text-slate-400">→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h2 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <span>💡</span> Tips for Finding Local Seed Swaps
          </h2>

          <ul className="space-y-2">
            {SEARCH_TIPS.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-sm text-amber-700">
              <strong>Pro tip:</strong> Spring (February-April) is peak seed swap season!
              Many communities hold annual events before planting season begins.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/seeds" className="text-emerald-600 hover:text-emerald-700 underline">
            View my seed inventory →
          </Link>
          <Link href="/plants" className="text-emerald-600 hover:text-emerald-700 underline">
            Browse my plants →
          </Link>
        </div>
      </div>
    </div>
  );
}
