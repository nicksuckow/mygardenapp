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
          <div className="flex items-center gap-2 text-earth-warm">
            <div className="w-5 h-5 border-2 border-earth-warm/60 border-t-transparent rounded-full animate-spin" />
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
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 border border-cream-200 p-6 mb-6">
          {/* Decorative swap icon */}
          <div className="absolute top-0 right-0 opacity-10">
            <svg className="w-32 h-32 text-sage" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-gradient-to-br from-sage to-sage-dark text-white p-2.5 rounded-xl shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
                  Find Seed Swaps
                </h1>
                <p className="text-earth-warm text-sm mt-1">
                  Discover local seed libraries, swaps, and gardening communities
                  {settings?.zone && ` • Zone ${settings.zone}`}
                </p>
              </div>
            </div>
            <Link href="/garden" className="text-sm text-sage-dark hover:underline">
              Back to garden
            </Link>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-semibold text-earth-deep mb-4">Find Local Resources</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-earth-deep mb-1">
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
              <label className="block text-sm font-medium text-earth-deep mb-1">
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
          <h2 className="font-semibold text-earth-deep mb-4">Online Seed Swap Communities</h2>

          <div className="grid gap-3">
            {SEED_RESOURCES.map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-cream-50 transition-colors"
              >
                <span className="text-xl">
                  {resource.type === "organization" ? "🏢" :
                   resource.type === "directory" ? "📚" :
                   resource.type === "community" ? "👥" : "💬"}
                </span>
                <div>
                  <h3 className="font-medium text-earth-deep">{resource.name}</h3>
                  <p className="text-sm text-earth-warm">{resource.description}</p>
                </div>
                <span className="ml-auto text-earth-warm/60">→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-mustard-50 border border-mustard/30 rounded-lg p-6">
          <h2 className="font-semibold text-earth-deep mb-3 flex items-center gap-2">
            <span>💡</span> Tips for Finding Local Seed Swaps
          </h2>

          <ul className="space-y-2">
            {SEARCH_TIPS.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-earth-deep">
                <span className="text-mustard-dark mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-mustard/30">
            <p className="text-sm text-earth-warm">
              <strong>Pro tip:</strong> Spring (February-April) is peak seed swap season!
              Many communities hold annual events before planting season begins.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/seeds" className="text-sage-dark hover:text-sage-dark underline">
            View my seed inventory →
          </Link>
          <Link href="/plants" className="text-sage-dark hover:text-sage-dark underline">
            Browse my plants →
          </Link>
        </div>
      </div>
    </div>
  );
}
