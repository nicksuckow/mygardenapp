"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Plant = {
  id: number;
  name: string;
  spacingInches: number;
};

type Placement = {
  id: number;
  x: number;
  y: number;
  plant: Plant;
};

type Bed = {
  id: number;
  name: string;
  widthInches: number;
  heightInches: number;
  cellInches: number;
  placements: Placement[];
};

export default function BedLayoutClient({ bedId }: { bedId: number }) {
  const [bed, setBed] = useState<Bed | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const res = await fetch(`/api/beds/${bedId}`);
    const text = await res.text();

    if (!res.ok) {
      setError(`Failed to load bed (${res.status}): ${text}`);
      return;
    }

    setBed(text ? JSON.parse(text) : null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bedId]);

  const cols = useMemo(() => {
    if (!bed) return 0;
    return Math.max(1, Math.floor(bed.widthInches / bed.cellInches));
  }, [bed]);

  const rows = useMemo(() => {
    if (!bed) return 0;
    return Math.max(1, Math.floor(bed.heightInches / bed.cellInches));
  }, [bed]);

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold">Bed</h1>
          <Link className="text-sm underline" href="/beds">
            Back to beds
          </Link>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Error</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs">{error}</pre>
        </div>
      </div>
    );
  }

  if (!bed) return <p className="text-sm text-gray-600">Loading…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{bed.name}</h1>
          <p className="text-sm text-gray-600">
            {bed.widthInches}" × {bed.heightInches}" — grid {bed.cellInches}" ({cols}×{rows})
          </p>
        </div>
        <Link className="text-sm underline" href="/beds">
          Back to beds
        </Link>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-gray-600">
          Layout editor will go here (we’ll paste the DnD grid next).
        </p>
      </div>
    </div>
  );
}
