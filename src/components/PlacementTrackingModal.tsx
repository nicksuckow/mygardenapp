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
    spacingInches: number;
    plantingDepthInches: number | null;
    startIndoorsWeeksBeforeFrost: number | null;
    transplantWeeksAfterFrost: number | null;
    directSowWeeksRelativeToFrost: number | null;
    // Full text planting instructions
    startIndoorsInstructions: string | null;
    transplantInstructions: string | null;
    directSowInstructions: string | null;
    daysToMaturityMin: number | null;
    daysToMaturityMax: number | null;
    notes: string | null;
    // Verdantly/additional fields
    scientificName: string | null;
    growthForm: string | null;
    growthHabit: string | null;
    growthRate: string | null;
    averageHeightCm: number | null;
    minTemperatureC: number | null;
    maxTemperatureC: number | null;
    lightRequirement: number | null;
    soilNutriments: number | null;
    soilHumidity: number | null;
    edible: boolean;
    ediblePart: string | null;
    cycle: string | null;
    watering: string | null;
    sunlight: string | null;
    floweringSeason: string | null;
    harvestSeason: string | null;
    careLevel: string | null;
    maintenance: string | null;
    indoor: boolean;
    droughtTolerant: boolean;
    medicinal: boolean;
    poisonousToHumans: number | null;
    poisonousToPets: number | null;
    description: string | null;
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
              {/* Plant description */}
              {placement.plant.description && (
                <p className="text-sm text-slate-600">{placement.plant.description}</p>
              )}

              {/* Plant details grid */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="font-medium text-slate-700 mb-2 text-sm">Plant Details</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {placement.plant.scientificName && (
                    <>
                      <span className="text-slate-500">Scientific name:</span>
                      <span className="text-slate-700 italic">{placement.plant.scientificName}</span>
                    </>
                  )}
                  <span className="text-slate-500">Spacing:</span>
                  <span className="text-slate-700">{placement.plant.spacingInches}"</span>
                  {placement.plant.plantingDepthInches && (
                    <>
                      <span className="text-slate-500">Planting depth:</span>
                      <span className="text-slate-700">{placement.plant.plantingDepthInches}"</span>
                    </>
                  )}
                  {placement.plant.cycle && (
                    <>
                      <span className="text-slate-500">Cycle:</span>
                      <span className="text-slate-700">{placement.plant.cycle}</span>
                    </>
                  )}
                  {placement.plant.growthForm && (
                    <>
                      <span className="text-slate-500">Growth form:</span>
                      <span className="text-slate-700">{placement.plant.growthForm}</span>
                    </>
                  )}
                  {placement.plant.growthHabit && (
                    <>
                      <span className="text-slate-500">Growth habit:</span>
                      <span className="text-slate-700">{placement.plant.growthHabit}</span>
                    </>
                  )}
                  {placement.plant.growthRate && (
                    <>
                      <span className="text-slate-500">Growth rate:</span>
                      <span className="text-slate-700">{placement.plant.growthRate}</span>
                    </>
                  )}
                  {placement.plant.averageHeightCm && (
                    <>
                      <span className="text-slate-500">Mature height:</span>
                      <span className="text-slate-700">{Math.round(placement.plant.averageHeightCm / 2.54)}"</span>
                    </>
                  )}
                </div>
              </div>

              {/* Growing requirements */}
              {(placement.plant.sunlight ||
                placement.plant.watering ||
                placement.plant.lightRequirement !== null ||
                placement.plant.soilHumidity !== null ||
                placement.plant.soilNutriments !== null ||
                placement.plant.minTemperatureC !== null ||
                placement.plant.careLevel) && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <div className="font-medium text-green-800 mb-2 text-sm">Growing Requirements</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {placement.plant.sunlight && (
                      <>
                        <span className="text-green-700">Sunlight:</span>
                        <span className="text-green-900">{placement.plant.sunlight}</span>
                      </>
                    )}
                    {placement.plant.lightRequirement !== null && (
                      <>
                        <span className="text-green-700">Light level:</span>
                        <span className="text-green-900">{placement.plant.lightRequirement}/10</span>
                      </>
                    )}
                    {placement.plant.watering && (
                      <>
                        <span className="text-green-700">Watering:</span>
                        <span className="text-green-900">{placement.plant.watering}</span>
                      </>
                    )}
                    {placement.plant.soilHumidity !== null && (
                      <>
                        <span className="text-green-700">Soil humidity:</span>
                        <span className="text-green-900">{placement.plant.soilHumidity}/10</span>
                      </>
                    )}
                    {placement.plant.soilNutriments !== null && (
                      <>
                        <span className="text-green-700">Soil nutrients:</span>
                        <span className="text-green-900">{placement.plant.soilNutriments}/10</span>
                      </>
                    )}
                    {(placement.plant.minTemperatureC !== null || placement.plant.maxTemperatureC !== null) && (
                      <>
                        <span className="text-green-700">Temperature:</span>
                        <span className="text-green-900">
                          {placement.plant.minTemperatureC !== null && `${Math.round(placement.plant.minTemperatureC * 9/5 + 32)}°F`}
                          {placement.plant.minTemperatureC !== null && placement.plant.maxTemperatureC !== null && " - "}
                          {placement.plant.maxTemperatureC !== null && `${Math.round(placement.plant.maxTemperatureC * 9/5 + 32)}°F`}
                        </span>
                      </>
                    )}
                    {placement.plant.careLevel && (
                      <>
                        <span className="text-green-700">Care level:</span>
                        <span className="text-green-900">{placement.plant.careLevel}</span>
                      </>
                    )}
                    {placement.plant.maintenance && (
                      <>
                        <span className="text-green-700">Maintenance:</span>
                        <span className="text-green-900">{placement.plant.maintenance}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Characteristics badges */}
              {(placement.plant.edible ||
                placement.plant.indoor ||
                placement.plant.droughtTolerant ||
                placement.plant.medicinal ||
                placement.plant.poisonousToHumans ||
                placement.plant.poisonousToPets) && (
                <div className="flex flex-wrap gap-2">
                  {placement.plant.edible && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Edible{placement.plant.ediblePart && `: ${placement.plant.ediblePart}`}
                    </span>
                  )}
                  {placement.plant.indoor && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      Indoor
                    </span>
                  )}
                  {placement.plant.droughtTolerant && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                      Drought tolerant
                    </span>
                  )}
                  {placement.plant.medicinal && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      Medicinal
                    </span>
                  )}
                  {placement.plant.poisonousToHumans === 1 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      Toxic to humans
                    </span>
                  )}
                  {placement.plant.poisonousToPets === 1 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      Toxic to pets
                    </span>
                  )}
                </div>
              )}

              {/* Seasons */}
              {(placement.plant.floweringSeason || placement.plant.harvestSeason) && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <div className="font-medium text-amber-800 mb-2 text-sm">Seasons</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {placement.plant.floweringSeason && (
                      <>
                        <span className="text-amber-700">Flowering:</span>
                        <span className="text-amber-900">{placement.plant.floweringSeason}</span>
                      </>
                    )}
                    {placement.plant.harvestSeason && (
                      <>
                        <span className="text-amber-700">Harvest:</span>
                        <span className="text-amber-900">{placement.plant.harvestSeason}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Planting instructions */}
              {(placement.plant.startIndoorsInstructions ||
                placement.plant.transplantInstructions ||
                placement.plant.directSowInstructions ||
                placement.plant.startIndoorsWeeksBeforeFrost ||
                placement.plant.transplantWeeksAfterFrost ||
                placement.plant.directSowWeeksRelativeToFrost ||
                placement.plant.daysToMaturityMin) && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                  <div className="font-medium text-blue-800 mb-2">Planting Instructions</div>
                  {(placement.plant.startIndoorsInstructions || placement.plant.startIndoorsWeeksBeforeFrost) && (
                    <div className="text-blue-700 mb-1">
                      <span className="font-medium">Start indoors:</span>{" "}
                      {placement.plant.startIndoorsInstructions ||
                        `${placement.plant.startIndoorsWeeksBeforeFrost} weeks before last frost`}
                    </div>
                  )}
                  {(placement.plant.transplantInstructions || placement.plant.transplantWeeksAfterFrost) && (
                    <div className="text-blue-700 mb-1">
                      <span className="font-medium">Transplant:</span>{" "}
                      {placement.plant.transplantInstructions ||
                        `${placement.plant.transplantWeeksAfterFrost} weeks after last frost`}
                    </div>
                  )}
                  {(placement.plant.directSowInstructions || placement.plant.directSowWeeksRelativeToFrost) && (
                    <div className="text-blue-700 mb-1">
                      <span className="font-medium">Direct sow:</span>{" "}
                      {placement.plant.directSowInstructions ||
                        `${placement.plant.directSowWeeksRelativeToFrost! > 0 ? "+" : ""}${placement.plant.directSowWeeksRelativeToFrost} weeks from last frost`}
                    </div>
                  )}
                  {placement.plant.daysToMaturityMin && (
                    <div className="text-blue-700">
                      <span className="font-medium">Days to maturity:</span>{" "}
                      {placement.plant.daysToMaturityMin}
                      {placement.plant.daysToMaturityMax && ` - ${placement.plant.daysToMaturityMax}`} days
                    </div>
                  )}
                </div>
              )}

              {/* Plant notes from Verdantly */}
              {placement.plant.notes && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="font-medium text-slate-700 mb-2 text-sm">Plant Notes</div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{placement.plant.notes}</p>
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
