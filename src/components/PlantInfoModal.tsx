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
            <h2 className="text-lg font-semibold text-earth-deep">Plant Information</h2>
            {(bedName || placementInfo) && (
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-earth-warm">
                {bedName && (
                  <span className="rounded-full bg-sage/20 px-2 py-0.5 text-sage-dark font-medium">
                    Bed: {bedName}
                  </span>
                )}
                {placementInfo && (
                  <>
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 text-earth-deep font-medium">
                      Count: {placementInfo.count}
                    </span>
                    {placementInfo.status && placementInfo.status !== "planned" && (
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          placementInfo.status === "planted"
                            ? "bg-sage/20 text-sage-dark"
                            : placementInfo.status === "growing"
                            ? "bg-sage/20 text-sage-dark"
                            : placementInfo.status === "harvesting"
                            ? "bg-orange-100 text-orange-700"
                            : placementInfo.status === "harvested"
                            ? "bg-purple-100 text-purple-700"
                            : placementInfo.status === "removed"
                            ? "bg-terracotta/20 text-terracotta-dark"
                            : "bg-cream-100 text-earth-deep"
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
            className="ml-3 rounded p-1 hover:bg-cream-100"
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
