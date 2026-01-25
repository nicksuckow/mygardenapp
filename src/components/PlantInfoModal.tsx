"use client";

import { ui } from "@/lib/uiStyles";
import PlantInfoPanel, { type FullPlantData } from "./PlantInfoPanel";

type PlantInfoModalProps = {
  isOpen: boolean;
  plant: FullPlantData | null;
  bedName?: string;
  placementInfo?: {
    count: number;
    status: string | null;
  };
  onClose: () => void;
};

export default function PlantInfoModal({
  isOpen,
  plant,
  bedName,
  placementInfo,
  onClose,
}: PlantInfoModalProps) {
  if (!isOpen || !plant) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`${ui.card} ${ui.cardPad} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Plant Information</h2>
            {(bedName || placementInfo) && (
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                {bedName && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 font-medium">
                    Bed: {bedName}
                  </span>
                )}
                {placementInfo && (
                  <>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                      Count: {placementInfo.count}
                    </span>
                    {placementInfo.status && placementInfo.status !== "planned" && (
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          placementInfo.status === "planted"
                            ? "bg-blue-100 text-blue-700"
                            : placementInfo.status === "growing"
                            ? "bg-green-100 text-green-700"
                            : placementInfo.status === "harvesting"
                            ? "bg-orange-100 text-orange-700"
                            : placementInfo.status === "harvested"
                            ? "bg-purple-100 text-purple-700"
                            : placementInfo.status === "removed"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {placementInfo.status.charAt(0).toUpperCase() + placementInfo.status.slice(1)}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 rounded p-1 hover:bg-slate-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plant info panel */}
        <PlantInfoPanel plant={plant} />

        {/* Close button at bottom */}
        <div className="mt-6 flex justify-end">
          <button
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
