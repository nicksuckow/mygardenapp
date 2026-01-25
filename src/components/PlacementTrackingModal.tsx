"use client";

import { useEffect, useState } from "react";
import { ui } from "@/lib/uiStyles";

type PlacementData = {
  id: number;
  count: number;
  seedsStartedDate: string | null;
  transplantedDate: string | null;
  directSowedDate: string | null;
  harvestStartedDate: string | null;
  harvestEndedDate: string | null;
  notes: string | null;
  plant: {
    name: string;
    variety: string | null;
    startIndoorsWeeksBeforeFrost: number | null;
    transplantWeeksAfterFrost: number | null;
    directSowWeeksRelativeToFrost: number | null;
    daysToMaturityMin: number | null;
    daysToMaturityMax: number | null;
  };
  bed: {
    name: string;
  };
};

type PlacementTrackingModalProps = {
  isOpen: boolean;
  placementId: number | null;
  onClose: () => void;
  onSave: () => void;
};

export default function PlacementTrackingModal({
  isOpen,
  placementId,
  onClose,
  onSave,
}: PlacementTrackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [placement, setPlacement] = useState<PlacementData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [seedsStartedDate, setSeedsStartedDate] = useState<string>("");
  const [transplantedDate, setTransplantedDate] = useState<string>("");
  const [directSowedDate, setDirectSowedDate] = useState<string>("");
  const [harvestStartedDate, setHarvestStartedDate] = useState<string>("");
  const [harvestEndedDate, setHarvestEndedDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen && placementId) {
      loadPlacement();
    } else {
      // Reset form when modal closes
      setPlacement(null);
      setError(null);
      setSeedsStartedDate("");
      setTransplantedDate("");
      setDirectSowedDate("");
      setHarvestStartedDate("");
      setHarvestEndedDate("");
      setNotes("");
    }
  }, [isOpen, placementId]);

  async function loadPlacement() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/placements/${placementId}`);
      if (!res.ok) throw new Error("Failed to load placement");
      const data = await res.json();
      setPlacement(data);

      // Populate form with existing data
      setSeedsStartedDate(data.seedsStartedDate ? data.seedsStartedDate.split("T")[0] : "");
      setTransplantedDate(data.transplantedDate ? data.transplantedDate.split("T")[0] : "");
      setDirectSowedDate(data.directSowedDate ? data.directSowedDate.split("T")[0] : "");
      setHarvestStartedDate(data.harvestStartedDate ? data.harvestStartedDate.split("T")[0] : "");
      setHarvestEndedDate(data.harvestEndedDate ? data.harvestEndedDate.split("T")[0] : "");
      setNotes(data.notes || "");
    } catch (err) {
      console.error(err);
      setError("Failed to load placement data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!placementId) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/placements/${placementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedsStartedDate: seedsStartedDate || null,
          transplantedDate: transplantedDate || null,
          directSowedDate: directSowedDate || null,
          harvestStartedDate: harvestStartedDate || null,
          harvestEndedDate: harvestEndedDate || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!placementId || !confirm("Remove this plant from the bed?")) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/placements/${placementId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to delete placement");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`${ui.card} ${ui.cardPad} max-w-lg w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : placement ? (
          <>
            <h2 className="text-lg font-semibold mb-1">
              {placement.plant.name}
              {placement.plant.variety && ` (${placement.plant.variety})`}
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              {placement.bed.name} • {placement.count} plant{placement.count > 1 ? "s" : ""}
            </p>

            <div className="space-y-4">
              {/* Expected timing info */}
              {(placement.plant.startIndoorsWeeksBeforeFrost ||
                placement.plant.transplantWeeksAfterFrost ||
                placement.plant.directSowWeeksRelativeToFrost) && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                  <div className="font-medium text-slate-700 mb-2">Expected Timing:</div>
                  {placement.plant.startIndoorsWeeksBeforeFrost && (
                    <div className="text-slate-600">
                      • Start indoors: {placement.plant.startIndoorsWeeksBeforeFrost} weeks before last frost
                    </div>
                  )}
                  {placement.plant.transplantWeeksAfterFrost && (
                    <div className="text-slate-600">
                      • Transplant: {placement.plant.transplantWeeksAfterFrost} weeks after last frost
                    </div>
                  )}
                  {placement.plant.directSowWeeksRelativeToFrost && (
                    <div className="text-slate-600">
                      • Direct sow: {placement.plant.directSowWeeksRelativeToFrost > 0 ? "+" : ""}
                      {placement.plant.directSowWeeksRelativeToFrost} weeks from last frost
                    </div>
                  )}
                  {placement.plant.daysToMaturityMin && (
                    <div className="text-slate-600">
                      • Days to maturity: {placement.plant.daysToMaturityMin}
                      {placement.plant.daysToMaturityMax && ` - ${placement.plant.daysToMaturityMax}`} days
                    </div>
                  )}
                </div>
              )}

              {/* Spring planting tasks */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Spring Planting Tasks</h3>

                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={!!seedsStartedDate}
                      onChange={(e) => {
                        if (e.target.checked && !seedsStartedDate) {
                          setSeedsStartedDate(new Date().toISOString().split("T")[0]);
                        } else if (!e.target.checked) {
                          setSeedsStartedDate("");
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Seeds Started Indoors</span>
                  </label>
                  {seedsStartedDate && (
                    <input
                      type="date"
                      value={seedsStartedDate}
                      onChange={(e) => setSeedsStartedDate(e.target.value)}
                      className="ml-6 text-sm rounded border border-slate-300 px-2 py-1"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={!!transplantedDate}
                      onChange={(e) => {
                        if (e.target.checked && !transplantedDate) {
                          setTransplantedDate(new Date().toISOString().split("T")[0]);
                        } else if (!e.target.checked) {
                          setTransplantedDate("");
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Transplanted Outdoors</span>
                  </label>
                  {transplantedDate && (
                    <input
                      type="date"
                      value={transplantedDate}
                      onChange={(e) => setTransplantedDate(e.target.value)}
                      className="ml-6 text-sm rounded border border-slate-300 px-2 py-1"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={!!directSowedDate}
                      onChange={(e) => {
                        if (e.target.checked && !directSowedDate) {
                          setDirectSowedDate(new Date().toISOString().split("T")[0]);
                        } else if (!e.target.checked) {
                          setDirectSowedDate("");
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Direct Sowed</span>
                  </label>
                  {directSowedDate && (
                    <input
                      type="date"
                      value={directSowedDate}
                      onChange={(e) => setDirectSowedDate(e.target.value)}
                      className="ml-6 text-sm rounded border border-slate-300 px-2 py-1"
                    />
                  )}
                </div>
              </div>

              {/* Harvest tracking */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Harvest Tracking</h3>

                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={!!harvestStartedDate}
                      onChange={(e) => {
                        if (e.target.checked && !harvestStartedDate) {
                          setHarvestStartedDate(new Date().toISOString().split("T")[0]);
                        } else if (!e.target.checked) {
                          setHarvestStartedDate("");
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Harvest Started</span>
                  </label>
                  {harvestStartedDate && (
                    <input
                      type="date"
                      value={harvestStartedDate}
                      onChange={(e) => setHarvestStartedDate(e.target.value)}
                      className="ml-6 text-sm rounded border border-slate-300 px-2 py-1"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={!!harvestEndedDate}
                      onChange={(e) => {
                        if (e.target.checked && !harvestEndedDate) {
                          setHarvestEndedDate(new Date().toISOString().split("T")[0]);
                        } else if (!e.target.checked) {
                          setHarvestEndedDate("");
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Harvest Ended</span>
                  </label>
                  {harvestEndedDate && (
                    <input
                      type="date"
                      value={harvestEndedDate}
                      onChange={(e) => setHarvestEndedDate(e.target.value)}
                      className="ml-6 text-sm rounded border border-slate-300 px-2 py-1"
                    />
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this planting..."
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`${ui.btn} ${ui.btnPrimary} flex-1`}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={onClose}
                  disabled={saving}
                  className={`${ui.btn} ${ui.btnSecondary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className={`${ui.btn} ${ui.btnDanger}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
