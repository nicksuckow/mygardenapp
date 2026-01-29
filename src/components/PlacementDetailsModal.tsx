"use client";

import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";
import PlantInfoPanel, { type FullPlantData } from "./PlantInfoPanel";

type PlacementDetailsModalProps = {
  isOpen: boolean;
  placementId: number | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: (placementId: number) => void;
};

type PlacementData = {
  id: number;
  status: string | null;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  actualHarvestStartDate: string | null;
  actualHarvestEndDate: string | null;
  notes: string | null;
  bed: { id: number; name: string };
  plant: FullPlantData; // Full plant data
  count: number;
  x: number;
  y: number;
};

export default function PlacementDetailsModal({
  isOpen,
  placementId,
  onClose,
  onSave,
  onDelete,
}: PlacementDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [placement, setPlacement] = useState<PlacementData | null>(null);

  // Form state
  const [status, setStatus] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [actualHarvestStartDate, setActualHarvestStartDate] = useState("");
  const [actualHarvestEndDate, setActualHarvestEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // Load placement data when modal opens
  useEffect(() => {
    if (!isOpen || !placementId) {
      setPlacement(null);
      setError("");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/placements/${placementId}`, { cache: "no-store" });
        const text = await res.text();

        if (!res.ok) {
          try {
            const errorData = JSON.parse(text);
            setError(errorData.error || `Failed to load placement (${res.status})`);
          } catch {
            setError(`Failed to load placement (${res.status})`);
          }
          return;
        }

        const data: PlacementData = JSON.parse(text);
        setPlacement(data);

        // Set form fields
        setStatus(data.status || "planned");
        setPlantingDate(data.plantingDate ? data.plantingDate.slice(0, 10) : "");
        setActualHarvestStartDate(data.actualHarvestStartDate ? data.actualHarvestStartDate.slice(0, 10) : "");
        setActualHarvestEndDate(data.actualHarvestEndDate ? data.actualHarvestEndDate.slice(0, 10) : "");
        setNotes(data.notes || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load placement");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, placementId]);

  const handleSave = async () => {
    if (!placementId) return;

    try {
      setSaving(true);
      setError("");

      const updateData: Record<string, unknown> = {
        status,
        plantingDate: plantingDate || null,
        actualHarvestStartDate: actualHarvestStartDate || null,
        actualHarvestEndDate: actualHarvestEndDate || null,
        notes: notes.trim() || null,
      };

      const res = await fetch(`/api/placements/${placementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const text = await res.text();

      if (!res.ok) {
        try {
          const errorData = JSON.parse(text);
          setError(errorData.error || `Failed to save (${res.status})`);
        } catch {
          setError(`Failed to save (${res.status})`);
        }
        return;
      }

      // Success - close modal and refresh parent
      onSave();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save placement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!placementId) return;

    // Ask for confirmation
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${placement?.plant.name} placement? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      onDelete(placementId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete placement");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (saving || deleting) return; // Prevent closing while saving or deleting
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className={`${ui.card} ${ui.cardPad} max-w-lg w-full m-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Plant Details</h2>

        {loading ? (
          <p className="text-sm text-earth-warm">Loading...</p>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 mb-4">
            {error}
          </div>
        ) : placement ? (
          <div className="space-y-4">
            {/* Placement location info */}
            <div className="rounded-lg border border-cream-200 bg-cream-50 px-3 py-2">
              <p className="text-xs text-earth-warm">
                Bed: <span className="font-medium">{placement.bed.name}</span> | Position: ({Math.round(placement.x)}", {Math.round(placement.y)}") | Count: <span className="font-medium">{placement.count}</span>
              </p>
            </div>

            {/* Plant information - expandable */}
            <details className="rounded-lg border border-cream-200 bg-cream-50" open>
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-earth-deep hover:bg-cream-100 rounded-t-lg">
                📋 Plant Information: {placement.plant.name}
              </summary>
              <div className="px-3 py-3 border-t border-cream-200">
                <PlantInfoPanel plant={placement.plant} />
              </div>
            </details>

            {/* Status dropdown */}
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Status</span>
              <select
                className="rounded border px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="planned">Planned</option>
                <option value="planted">Planted</option>
                <option value="growing">Growing</option>
                <option value="harvesting">Harvesting</option>
                <option value="harvested">Harvested</option>
                <option value="removed">Removed</option>
              </select>
            </label>

            {/* Planting date */}
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Planting date</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
              />
              <span className="text-xs text-earth-warm">Date you actually planted this</span>
            </label>

            {/* Expected harvest date (read-only) */}
            {placement.expectedHarvestDate && (
              <div className="grid gap-1.5">
                <span className="text-sm font-medium text-earth-deep">Expected harvest date</span>
                <input
                  className="rounded border border-cream-200 bg-cream-100 px-3 py-2 text-sm text-earth-warm"
                  type="date"
                  value={placement.expectedHarvestDate.slice(0, 10)}
                  readOnly
                  disabled
                />
                <span className="text-xs text-earth-warm">
                  Calculated from planting date + days to maturity
                </span>
              </div>
            )}

            {/* Actual harvest start date */}
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Actual harvest start date</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="date"
                value={actualHarvestStartDate}
                onChange={(e) => setActualHarvestStartDate(e.target.value)}
              />
              <span className="text-xs text-earth-warm">When you started harvesting</span>
            </label>

            {/* Actual harvest end date */}
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Actual harvest end date</span>
              <input
                className="rounded border px-3 py-2 text-sm"
                type="date"
                value={actualHarvestEndDate}
                onChange={(e) => setActualHarvestEndDate(e.target.value)}
              />
              <span className="text-xs text-earth-warm">When harvesting finished</span>
            </label>

            {/* Notes */}
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                className="rounded border px-3 py-2 text-sm min-h-[80px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations or notes about this plant..."
              />
            </label>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className={`${ui.btn} ${ui.btnPrimary}`}
                  onClick={handleSave}
                  disabled={saving || deleting}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  className={`${ui.btn} ${ui.btnSecondary}`}
                  onClick={handleClose}
                  disabled={saving || deleting}
                >
                  Cancel
                </button>
              </div>

              <button
                className={`${ui.btn} ${ui.btnDanger}`}
                onClick={handleDelete}
                disabled={saving || deleting}
                title="Delete this plant placement"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
