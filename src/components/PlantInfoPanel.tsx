"use client";

import { ui } from "@/lib/uiStyles";

export type FullPlantData = {
  id: number;
  name: string;
  variety: string | null;
  spacingInches: number;
  plantingDepthInches: number | null;
  daysToMaturityMin: number | null;
  daysToMaturityMax: number | null;
  startIndoorsWeeksBeforeFrost: number | null;
  transplantWeeksAfterFrost: number | null;
  directSowWeeksRelativeToFrost: number | null;
  notes: string | null;

  // Extended fields
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
};

type PlantInfoPanelProps = {
  plant: FullPlantData;
  compact?: boolean; // If true, show condensed version
};

function fmtInches(v: number) {
  return Number(v.toFixed(2)).toString();
}

export default function PlantInfoPanel({ plant, compact = false }: PlantInfoPanelProps) {
  if (compact) {
    // Compact version for tooltips/small spaces
    return (
      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-slate-900">{plant.name}</h3>
          {plant.variety && (
            <p className="text-xs text-slate-600">{plant.variety}</p>
          )}
          {plant.scientificName && (
            <p className="text-xs italic text-slate-600">{plant.scientificName}</p>
          )}
        </div>

        {plant.description && (
          <p className="text-xs text-slate-700 line-clamp-2">{plant.description}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {plant.cycle && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {plant.cycle}
            </span>
          )}
          {plant.edible && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Edible
            </span>
          )}
          {plant.careLevel && (
            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              {plant.careLevel} care
            </span>
          )}
        </div>

        <div className="text-xs text-slate-700 space-y-1">
          {(plant.watering || plant.sunlight) && (
            <p>
              {plant.watering && `💧 ${plant.watering}`}
              {plant.watering && plant.sunlight && " • "}
              {plant.sunlight && `☀️ ${plant.sunlight}`}
            </p>
          )}
          <p>
            Spacing: {plant.spacingInches}"
            {plant.averageHeightInches && ` • Height: ${Math.round(plant.averageHeightInches)}"`}
          </p>
        </div>
      </div>
    );
  }

  // Full version for modals/sidebars
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{plant.name}</h3>
        {plant.variety && (
          <p className="text-sm text-slate-600">{plant.variety}</p>
        )}
        {plant.scientificName && (
          <p className="text-sm italic text-slate-600">{plant.scientificName}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {plant.cycle && (
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
            {plant.cycle}
          </span>
        )}
        {plant.edible && (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            Edible{plant.ediblePart ? `: ${plant.ediblePart}` : ""}
          </span>
        )}
        {plant.careLevel && (
          <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
            {plant.careLevel} care
          </span>
        )}
        {plant.indoor && (
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
            Indoor
          </span>
        )}
        {plant.medicinal && (
          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">
            Medicinal
          </span>
        )}
        {plant.droughtTolerant && (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
            Drought tolerant
          </span>
        )}
        {(plant.poisonousToHumans === 1 || plant.poisonousToPets === 1) && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
            ⚠️ Toxic
          </span>
        )}
      </div>

      {/* Description */}
      {plant.description && (
        <div className={`${ui.card} bg-slate-50 p-3`}>
          <p className="text-sm text-slate-700">{plant.description}</p>
        </div>
      )}

      {/* Growing Requirements */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Physical Characteristics */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Physical</h4>
          <div className="text-xs text-slate-700 space-y-1">
            <p>📏 Spacing: {plant.spacingInches}"</p>
            {plant.plantingDepthInches != null && (
              <p>🌱 Depth: {fmtInches(plant.plantingDepthInches)}"</p>
            )}
            {plant.averageHeightInches && (
              <p>📐 Height: {Math.round(plant.averageHeightInches)}"</p>
            )}
            {(plant.growthForm || plant.growthHabit || plant.growthRate) && (
              <p>🌿 {[plant.growthForm, plant.growthHabit, plant.growthRate].filter(Boolean).join(" • ")}</p>
            )}
          </div>
        </div>

        {/* Growing Conditions */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Conditions</h4>
          <div className="text-xs text-slate-700 space-y-1">
            {plant.sunlight && <p>☀️ {plant.sunlight}</p>}
            {plant.watering && <p>💧 {plant.watering}</p>}
            {(plant.minTemperatureC != null || plant.maxTemperatureC != null) && (
              <p>
                🌡️ {plant.minTemperatureC != null ? `${Math.round(plant.minTemperatureC * 9/5 + 32)}°F` : "?"}
                {" – "}
                {plant.maxTemperatureC != null ? `${Math.round(plant.maxTemperatureC * 9/5 + 32)}°F` : "?"}
              </p>
            )}
            {(plant.lightRequirement != null || plant.soilHumidity != null) && (
              <p>
                {plant.lightRequirement != null && `Light: ${plant.lightRequirement}/10 `}
                {plant.lightRequirement != null && plant.soilHumidity != null && "• "}
                {plant.soilHumidity != null && `Moisture: ${plant.soilHumidity}/10`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timing Information */}
      {(plant.daysToMaturityMin != null ||
        plant.startIndoorsWeeksBeforeFrost != null ||
        plant.transplantWeeksAfterFrost != null ||
        plant.directSowWeeksRelativeToFrost != null ||
        plant.floweringSeason ||
        plant.harvestSeason) && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Timing</h4>
          <div className="text-xs text-slate-700 space-y-1">
            {(plant.daysToMaturityMin != null || plant.daysToMaturityMax != null) && (
              <p>
                ⏱️ Days to Maturity: {plant.daysToMaturityMin ?? "?"}
                {plant.daysToMaturityMax ? `–${plant.daysToMaturityMax}` : ""} days
              </p>
            )}
            {plant.startIndoorsWeeksBeforeFrost != null && (
              <p>🏠 Start indoors: {plant.startIndoorsWeeksBeforeFrost}w before frost</p>
            )}
            {plant.transplantWeeksAfterFrost != null && (
              <p>🌱 Transplant: {plant.transplantWeeksAfterFrost}w after frost</p>
            )}
            {plant.directSowWeeksRelativeToFrost != null && (
              <p>
                🌾 Direct sow: {plant.directSowWeeksRelativeToFrost >= 0 ? "+" : ""}
                {plant.directSowWeeksRelativeToFrost}w relative to frost
              </p>
            )}
            {plant.floweringSeason && <p>🌸 Flowers: {plant.floweringSeason}</p>}
            {plant.harvestSeason && <p>🌾 Harvest: {plant.harvestSeason}</p>}
          </div>
        </div>
      )}

      {/* Care & Maintenance */}
      {plant.maintenance && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Maintenance</h4>
          <p className="text-xs text-slate-700">{plant.maintenance}</p>
        </div>
      )}

      {/* Notes */}
      {plant.notes && (
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-700 font-medium hover:text-slate-900">
            Additional Notes
          </summary>
          <div className="mt-2 text-slate-600 whitespace-pre-line bg-slate-50 rounded p-2">
            {plant.notes}
          </div>
        </details>
      )}
    </div>
  );
}
