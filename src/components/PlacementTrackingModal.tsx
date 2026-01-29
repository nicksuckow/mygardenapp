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
  harvestYield: number | null;
  harvestYieldUnit: string | null;
  notes: string | null;
  // Succession tracking
  successionGroupId: string | null;
  successionNumber: number | null;
  expectedHarvestDate: string | null;
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
    averageHeightInches: number | null;
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
    // Succession config
    successionEnabled: boolean;
    successionIntervalDays: number | null;
    successionMaxCount: number | null;
  };
  bed: {
    id: number;
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
  const [harvestYield, setHarvestYield] = useState<string>("");
  const [harvestYieldUnit, setHarvestYieldUnit] = useState<string>("lbs");
  const [notes, setNotes] = useState<string>("");
  const [creatingSuccession, setCreatingSuccession] = useState(false);

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
      setHarvestYield("");
      setHarvestYieldUnit("lbs");
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
      setHarvestYield(data.harvestYield ? String(data.harvestYield) : "");
      setHarvestYieldUnit(data.harvestYieldUnit || "lbs");
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
          harvestYield: harvestYield ? parseFloat(harvestYield) : null,
          harvestYieldUnit: harvestYield ? harvestYieldUnit : null,
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

  async function handleArchive() {
    if (!placementId) return;
    if (!harvestEndedDate) {
      setError("Please mark harvest as ended before archiving");
      return;
    }
    if (!confirm("Archive this planting to history? This will remove it from the bed and save it to your crop rotation history.")) return;

    setSaving(true);
    setError(null);
    try {
      // First save current state
      const saveRes = await fetch(`/api/placements/${placementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedsStartedDate: seedsStartedDate || null,
          transplantedDate: transplantedDate || null,
          directSowedDate: directSowedDate || null,
          harvestStartedDate: harvestStartedDate || null,
          harvestEndedDate: harvestEndedDate || null,
          harvestYield: harvestYield ? parseFloat(harvestYield) : null,
          harvestYieldUnit: harvestYield ? harvestYieldUnit : null,
          notes: notes || null,
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save placement data before archiving");

      // Then archive
      const res = await fetch(`/api/placements/${placementId}/archive`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to archive");

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to archive placement");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateSuccession() {
    if (!placementId || !placement) return;

    setCreatingSuccession(true);
    setError(null);
    try {
      const res = await fetch("/api/succession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePlacementId: placementId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create succession");
      }

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create succession");
    } finally {
      setCreatingSuccession(false);
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
          <div className="text-center py-8 text-terracotta">{error}</div>
        ) : placement ? (
          <>
            <h2 className="text-lg font-semibold mb-1">
              {placement.plant.name}
              {placement.plant.variety && ` (${placement.plant.variety})`}
            </h2>
            <p className="text-sm text-earth-warm mb-4">
              {placement.bed.name} • {placement.count} plant{placement.count > 1 ? "s" : ""}
              {placement.successionNumber && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                  Sowing #{placement.successionNumber}
                </span>
              )}
            </p>

            <div className="space-y-4">
              {/* Succession Info */}
              {(placement.successionGroupId || placement.plant.successionEnabled) && (
                <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                  <div className="font-medium text-violet-800 mb-2 text-sm flex items-center gap-2">
                    <span>🔄</span> Succession Planting
                  </div>
                  {placement.successionGroupId ? (
                    <div className="text-sm text-violet-700 space-y-1">
                      <p>
                        This is <strong>Sowing #{placement.successionNumber}</strong> in a succession series.
                      </p>
                      {placement.expectedHarvestDate && (
                        <p>
                          Expected harvest: {new Date(placement.expectedHarvestDate).toLocaleDateString()}
                        </p>
                      )}
                      {placement.plant.successionIntervalDays && (
                        <p className="text-violet-600">
                          Next sowing due {placement.plant.successionIntervalDays} days after this one
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-violet-700">
                      This plant is configured for succession planting every {placement.plant.successionIntervalDays} days.
                    </p>
                  )}

                  {/* Add Next Succession Button */}
                  {placement.plant.successionEnabled && (
                    <button
                      onClick={handleCreateSuccession}
                      disabled={creatingSuccession || saving}
                      className={`${ui.btn} bg-violet-600 hover:bg-violet-700 text-white w-full mt-3`}
                    >
                      {creatingSuccession
                        ? "Creating..."
                        : `+ Add Succession #${(placement.successionNumber ?? 0) + 1}`}
                    </button>
                  )}
                </div>
              )}

              {/* Plant description */}
              {placement.plant.description && (
                <p className="text-sm text-earth-warm">{placement.plant.description}</p>
              )}

              {/* Plant details grid */}
              <div className="rounded-lg bg-cream-50 border border-cream-200 p-3">
                <div className="font-medium text-earth-deep mb-2 text-sm">Plant Details</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {placement.plant.scientificName && (
                    <>
                      <span className="text-earth-warm">Scientific name:</span>
                      <span className="text-earth-deep italic">{placement.plant.scientificName}</span>
                    </>
                  )}
                  <span className="text-earth-warm">Spacing:</span>
                  <span className="text-earth-deep">{placement.plant.spacingInches}"</span>
                  {placement.plant.plantingDepthInches && (
                    <>
                      <span className="text-earth-warm">Planting depth:</span>
                      <span className="text-earth-deep">{placement.plant.plantingDepthInches}"</span>
                    </>
                  )}
                  {placement.plant.cycle && (
                    <>
                      <span className="text-earth-warm">Cycle:</span>
                      <span className="text-earth-deep">{placement.plant.cycle}</span>
                    </>
                  )}
                  {placement.plant.growthForm && (
                    <>
                      <span className="text-earth-warm">Growth form:</span>
                      <span className="text-earth-deep">{placement.plant.growthForm}</span>
                    </>
                  )}
                  {placement.plant.growthHabit && (
                    <>
                      <span className="text-earth-warm">Growth habit:</span>
                      <span className="text-earth-deep">{placement.plant.growthHabit}</span>
                    </>
                  )}
                  {placement.plant.growthRate && (
                    <>
                      <span className="text-earth-warm">Growth rate:</span>
                      <span className="text-earth-deep">{placement.plant.growthRate}</span>
                    </>
                  )}
                  {placement.plant.averageHeightInches && (
                    <>
                      <span className="text-earth-warm">Mature height:</span>
                      <span className="text-earth-deep">{Math.round(placement.plant.averageHeightInches)}"</span>
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
                <div className="rounded-lg bg-sage/20 border border-sage p-3">
                  <div className="font-medium text-sage-dark mb-2 text-sm">Growing Requirements</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {placement.plant.sunlight && (
                      <>
                        <span className="text-sage-dark">Sunlight:</span>
                        <span className="text-sage-dark">{placement.plant.sunlight}</span>
                      </>
                    )}
                    {placement.plant.lightRequirement !== null && (
                      <>
                        <span className="text-sage-dark">Light level:</span>
                        <span className="text-sage-dark">{placement.plant.lightRequirement}/10</span>
                      </>
                    )}
                    {placement.plant.watering && (
                      <>
                        <span className="text-sage-dark">Watering:</span>
                        <span className="text-sage-dark">{placement.plant.watering}</span>
                      </>
                    )}
                    {placement.plant.soilHumidity !== null && (
                      <>
                        <span className="text-sage-dark">Soil humidity:</span>
                        <span className="text-sage-dark">{placement.plant.soilHumidity}/10</span>
                      </>
                    )}
                    {placement.plant.soilNutriments !== null && (
                      <>
                        <span className="text-sage-dark">Soil nutrients:</span>
                        <span className="text-sage-dark">{placement.plant.soilNutriments}/10</span>
                      </>
                    )}
                    {(placement.plant.minTemperatureC !== null || placement.plant.maxTemperatureC !== null) && (
                      <>
                        <span className="text-sage-dark">Temperature:</span>
                        <span className="text-sage-dark">
                          {placement.plant.minTemperatureC !== null && `${Math.round(placement.plant.minTemperatureC * 9/5 + 32)}°F`}
                          {placement.plant.minTemperatureC !== null && placement.plant.maxTemperatureC !== null && " - "}
                          {placement.plant.maxTemperatureC !== null && `${Math.round(placement.plant.maxTemperatureC * 9/5 + 32)}°F`}
                        </span>
                      </>
                    )}
                    {placement.plant.careLevel && (
                      <>
                        <span className="text-sage-dark">Care level:</span>
                        <span className="text-sage-dark">{placement.plant.careLevel}</span>
                      </>
                    )}
                    {placement.plant.maintenance && (
                      <>
                        <span className="text-sage-dark">Maintenance:</span>
                        <span className="text-sage-dark">{placement.plant.maintenance}</span>
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
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-sage/20 text-sage-dark">
                      Edible{placement.plant.ediblePart && `: ${placement.plant.ediblePart}`}
                    </span>
                  )}
                  {placement.plant.indoor && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-sage/20 text-sage-dark">
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
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-terracotta/20 text-terracotta-dark">
                      Toxic to humans
                    </span>
                  )}
                  {placement.plant.poisonousToPets === 1 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-terracotta/20 text-terracotta-dark">
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
                <div className="rounded-lg bg-sage/10 border border-sage/30 p-3 text-sm">
                  <div className="font-medium text-sage-dark mb-2">Planting Instructions</div>
                  {(placement.plant.startIndoorsInstructions || placement.plant.startIndoorsWeeksBeforeFrost) && (
                    <div className="text-sage-dark mb-1">
                      <span className="font-medium">Start indoors:</span>{" "}
                      {placement.plant.startIndoorsInstructions ||
                        `${placement.plant.startIndoorsWeeksBeforeFrost} weeks before last frost`}
                    </div>
                  )}
                  {(placement.plant.transplantInstructions || placement.plant.transplantWeeksAfterFrost) && (
                    <div className="text-sage-dark mb-1">
                      <span className="font-medium">Transplant:</span>{" "}
                      {placement.plant.transplantInstructions ||
                        `${placement.plant.transplantWeeksAfterFrost} weeks after last frost`}
                    </div>
                  )}
                  {(placement.plant.directSowInstructions || placement.plant.directSowWeeksRelativeToFrost) && (
                    <div className="text-sage-dark mb-1">
                      <span className="font-medium">Direct sow:</span>{" "}
                      {placement.plant.directSowInstructions ||
                        `${placement.plant.directSowWeeksRelativeToFrost! > 0 ? "+" : ""}${placement.plant.directSowWeeksRelativeToFrost} weeks from last frost`}
                    </div>
                  )}
                  {placement.plant.daysToMaturityMin && (
                    <div className="text-sage-dark">
                      <span className="font-medium">Days to maturity:</span>{" "}
                      {placement.plant.daysToMaturityMin}
                      {placement.plant.daysToMaturityMax && ` - ${placement.plant.daysToMaturityMax}`} days
                    </div>
                  )}
                </div>
              )}

              {/* Plant notes from Verdantly */}
              {placement.plant.notes && (
                <div className="rounded-lg bg-cream-50 border border-cream-200 p-3">
                  <div className="font-medium text-earth-deep mb-2 text-sm">Plant Notes</div>
                  <p className="text-sm text-earth-warm whitespace-pre-wrap">{placement.plant.notes}</p>
                </div>
              )}

              {/* Spring planting tasks */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-earth-deep">Spring Planting Tasks</h3>

                <div>
                  <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
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
                      className="w-5 h-5 rounded border-cream-200 text-sage-dark focus:ring-sage"
                    />
                    <span className="text-base">Seeds Started Indoors</span>
                  </label>
                  {seedsStartedDate && (
                    <input
                      type="date"
                      value={seedsStartedDate}
                      onChange={(e) => setSeedsStartedDate(e.target.value)}
                      className="ml-8 mt-1 text-base rounded-lg border border-cream-200 px-3 py-2 min-h-[44px]"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
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
                      className="w-5 h-5 rounded border-cream-200 text-sage-dark focus:ring-sage"
                    />
                    <span className="text-base">Transplanted Outdoors</span>
                  </label>
                  {transplantedDate && (
                    <input
                      type="date"
                      value={transplantedDate}
                      onChange={(e) => setTransplantedDate(e.target.value)}
                      className="ml-8 mt-1 text-base rounded-lg border border-cream-200 px-3 py-2 min-h-[44px]"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
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
                      className="w-5 h-5 rounded border-cream-200 text-sage-dark focus:ring-sage"
                    />
                    <span className="text-base">Direct Sowed</span>
                  </label>
                  {directSowedDate && (
                    <input
                      type="date"
                      value={directSowedDate}
                      onChange={(e) => setDirectSowedDate(e.target.value)}
                      className="ml-8 mt-1 text-base rounded-lg border border-cream-200 px-3 py-2 min-h-[44px]"
                    />
                  )}
                </div>
              </div>

              {/* Harvest tracking */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-earth-deep">Harvest Tracking</h3>

                <div>
                  <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
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
                      className="w-5 h-5 rounded border-cream-200 text-sage-dark focus:ring-sage"
                    />
                    <span className="text-base">Harvest Started</span>
                  </label>
                  {harvestStartedDate && (
                    <input
                      type="date"
                      value={harvestStartedDate}
                      onChange={(e) => setHarvestStartedDate(e.target.value)}
                      className="ml-8 mt-1 text-base rounded-lg border border-cream-200 px-3 py-2 min-h-[44px]"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
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
                      className="w-5 h-5 rounded border-cream-200 text-sage-dark focus:ring-sage"
                    />
                    <span className="text-base">Harvest Ended</span>
                  </label>
                  {harvestEndedDate && (
                    <input
                      type="date"
                      value={harvestEndedDate}
                      onChange={(e) => setHarvestEndedDate(e.target.value)}
                      className="ml-8 mt-1 text-base rounded-lg border border-cream-200 px-3 py-2 min-h-[44px]"
                    />
                  )}
                </div>

                {/* Yield tracking */}
                {(harvestStartedDate || harvestEndedDate) && (
                  <div className="pt-3 border-t border-cream-200">
                    <label className="block text-base font-medium text-earth-deep mb-2">
                      Total Harvest Yield
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={harvestYield}
                        onChange={(e) => setHarvestYield(e.target.value)}
                        placeholder="Amount"
                        className="w-28 text-base rounded-lg border border-cream-200 px-3 py-2 min-h-[44px]"
                      />
                      <select
                        value={harvestYieldUnit}
                        onChange={(e) => setHarvestYieldUnit(e.target.value)}
                        className="text-base rounded-lg border border-cream-200 px-3 py-2 min-h-[44px]"
                      >
                        <option value="lbs">lbs</option>
                        <option value="oz">oz</option>
                        <option value="kg">kg</option>
                        <option value="g">grams</option>
                        <option value="count">count</option>
                        <option value="bunches">bunches</option>
                        <option value="heads">heads</option>
                        <option value="pints">pints</option>
                        <option value="quarts">quarts</option>
                      </select>
                    </div>
                    <p className="text-xs text-earth-warm mt-1">
                      Track your cumulative harvest from this planting
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-base font-medium text-earth-deep mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this planting..."
                  className="w-full text-base rounded-lg border border-cream-200 px-3 py-3"
                  rows={4}
                />
              </div>

              {/* Actions - stack on mobile, row on larger screens */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
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
                  className={`${ui.btn} ${ui.btnSecondary} flex-1 sm:flex-none`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className={`${ui.btn} ${ui.btnDanger} flex-1 sm:flex-none`}
                >
                  Delete
                </button>
              </div>

              {/* Archive button - shown for completed harvests */}
              {harvestEndedDate && (
                <div className="pt-3 border-t border-cream-200">
                  <button
                    onClick={handleArchive}
                    disabled={saving}
                    className={`${ui.btn} w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white`}
                  >
                    Archive to History
                  </button>
                  <p className="text-xs text-earth-warm mt-2 text-center">
                    Save this planting to your crop rotation history and clear the spot for next season
                  </p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
