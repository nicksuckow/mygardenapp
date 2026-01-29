"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlacementTrackingModal from "@/components/PlacementTrackingModal";
import { getCompanionSuggestions, checkCompatibility, findPlantCompanions } from "@/lib/companionPlanting";

// Companion alert type
type CompanionAlert = {
  plantName: string;
  goodPairs: { plant: string; reason: string }[];
  badPairs: { plant: string; reason: string }[];
};

type Plant = {
  id: number;
  name: string;
  spacingInches: number;
  averageHeightInches?: number | null;
  attractsPollinators?: boolean;
  pollinatorTypes?: string | null;
  waterZone?: string | null;
  // Succession config
  successionEnabled?: boolean;
  successionIntervalDays?: number | null;
  successionMaxCount?: number | null;
};

type Placement = {
  id: number;
  x: number;
  y: number;
  w?: number | null;
  h?: number | null;
  seedsStartedDate?: string | null;
  transplantedDate?: string | null;
  directSowedDate?: string | null;
  harvestStartedDate?: string | null;
  harvestEndedDate?: string | null;
  // Succession tracking
  successionGroupId?: string | null;
  successionNumber?: number | null;
  expectedHarvestDate?: string | null;
  plant: Plant;
};

type Bed = {
  id: number;
  name: string;
  widthInches: number;
  heightInches: number;
  cellInches: number;
  placements: Placement[];
  microClimate?: string | null;
};

// Micro-climate options with icons and labels
const MICROCLIMATE_OPTIONS = [
  { value: "full-sun", label: "Full Sun", icon: "☀️", description: "6+ hours direct sunlight" },
  { value: "partial-shade", label: "Partial Shade", icon: "⛅", description: "3-6 hours sunlight" },
  { value: "full-shade", label: "Full Shade", icon: "🌑", description: "Less than 3 hours sunlight" },
  { value: "south-facing", label: "South-Facing", icon: "🧭", description: "Warm, sun-catching wall" },
  { value: "north-facing", label: "North-Facing", icon: "❄️", description: "Cool, shaded area" },
  { value: "windy", label: "Windy", icon: "💨", description: "Exposed to wind" },
  { value: "sheltered", label: "Sheltered", icon: "🛡️", description: "Protected from wind" },
  { value: "wet", label: "Wet/Damp", icon: "💧", description: "Retains moisture" },
  { value: "dry", label: "Dry", icon: "🏜️", description: "Drains quickly" },
] as const;

async function readJson<T>(
  res: Response
): Promise<{ ok: true; data: T } | { ok: false; status: number; text: string }> {
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, text };
  return { ok: true, data: (text ? JSON.parse(text) : null) as T };
}

// Helper function to get status color based on spring tracking
function getStatusColor(placement: Placement): string {
  if (placement.harvestEndedDate) return "#a855f7"; // purple - harvest complete
  if (placement.harvestStartedDate) return "#f59e0b"; // orange - harvesting
  if (placement.transplantedDate || placement.directSowedDate) return "#10b981"; // green - growing
  if (placement.seedsStartedDate) return "#3b82f6"; // blue - seeds started
  return "#94a3b8"; // gray - planned only
}

// Get background color for status (more saturated to be visually distinct)
function getStatusBgColor(placement: Placement): string {
  if (placement.harvestEndedDate) return "#c4b5fd"; // violet-300
  if (placement.harvestStartedDate) return "#fcd34d"; // amber-300
  if (placement.transplantedDate || placement.directSowedDate) return "#6ee7b7"; // emerald-300
  if (placement.seedsStartedDate) return "#93c5fd"; // blue-300
  return "#cbd5e1"; // slate-300
}

// Custom SVG icons for plants without good emoji matches
function CustomPlantIcon({ type, size }: { type: string; size: number }) {
  const iconSize = size * 0.85;

  switch (type) {
    case "zinnia":
      // Zinnia: multi-layered dahlia-like flower with pointed petals
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          {/* Outer petals - red/pink */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="20"
              rx="8"
              ry="18"
              fill="#E11D48"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Middle petals - slightly smaller */}
          {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="28"
              rx="6"
              ry="14"
              fill="#F43F5E"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Center */}
          <circle cx="50" cy="50" r="12" fill="#FCD34D" />
          <circle cx="50" cy="50" r="6" fill="#F59E0B" />
        </svg>
      );

    case "dahlia":
      // Dahlia: spherical flower with many layered petals
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          {/* Outer petals */}
          {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="18"
              rx="7"
              ry="16"
              fill="#A855F7"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Inner petals */}
          {[11.25, 33.75, 56.25, 78.75, 101.25, 123.75, 146.25, 168.75, 191.25, 213.75, 236.25, 258.75, 281.25, 303.75, 326.25, 348.75].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="30"
              rx="5"
              ry="12"
              fill="#C084FC"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Center */}
          <circle cx="50" cy="50" r="10" fill="#FDE047" />
        </svg>
      );

    case "peony":
      // Peony: ruffled, layered soft petals
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          {/* Outer ruffled petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path
              key={angle}
              d="M50 50 Q40 25 50 15 Q60 25 50 50"
              fill="#FB7185"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Middle petals */}
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
            <path
              key={angle}
              d="M50 50 Q42 32 50 25 Q58 32 50 50"
              fill="#FDA4AF"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Inner petals */}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="38"
              rx="5"
              ry="8"
              fill="#FECDD3"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Center */}
          <circle cx="50" cy="50" r="8" fill="#FEF08A" />
        </svg>
      );

    case "cosmos":
      // Cosmos: simple 8-petal daisy-like flower
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="22"
              rx="10"
              ry="22"
              fill="#EC4899"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="12" fill="#FCD34D" />
        </svg>
      );

    case "impatiens":
      // Impatiens: 5 petals, flat face
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="22"
              rx="14"
              ry="20"
              fill="#F472B6"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="10" fill="#FEF9C3" />
          <circle cx="50" cy="50" r="4" fill="#F59E0B" />
        </svg>
      );

    case "begonia":
      // Begonia: asymmetric layered petals
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          {[0, 90, 180, 270].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="25"
              rx="16"
              ry="20"
              fill="#FB923C"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {[45, 135, 225, 315].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="32"
              rx="12"
              ry="14"
              fill="#FDBA74"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="8" fill="#FEF08A" />
        </svg>
      );

    case "geranium":
      // Geranium: cluster of small 5-petal flowers
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          {/* Center flower */}
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={`c${angle}`}
              cx="50"
              cy="40"
              rx="7"
              ry="10"
              fill="#EF4444"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Surrounding small flowers */}
          {[0, 120, 240].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <circle cx="50" cy="22" r="10" fill="#F87171" />
            </g>
          ))}
          <circle cx="50" cy="50" r="6" fill="#FEF08A" />
        </svg>
      );

    case "snapdragon":
      // Snapdragon: vertical spike of flowers
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          {/* Flower spikes */}
          <ellipse cx="50" cy="15" rx="12" ry="10" fill="#8B5CF6" />
          <ellipse cx="42" cy="28" rx="10" ry="8" fill="#A78BFA" />
          <ellipse cx="58" cy="28" rx="10" ry="8" fill="#A78BFA" />
          <ellipse cx="50" cy="40" rx="12" ry="10" fill="#8B5CF6" />
          <ellipse cx="42" cy="52" rx="10" ry="8" fill="#A78BFA" />
          <ellipse cx="58" cy="52" rx="10" ry="8" fill="#A78BFA" />
          <ellipse cx="50" cy="65" rx="12" ry="10" fill="#8B5CF6" />
          {/* Stem hint */}
          <rect x="48" y="75" width="4" height="15" fill="#22C55E" />
        </svg>
      );

    case "coleus":
      // Coleus: colorful leaves (foliage plant)
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
          <ellipse cx="50" cy="30" rx="18" ry="25" fill="#7C3AED" />
          <ellipse cx="30" cy="50" rx="15" ry="22" fill="#DC2626" transform="rotate(-30 30 50)" />
          <ellipse cx="70" cy="50" rx="15" ry="22" fill="#DC2626" transform="rotate(30 70 50)" />
          <ellipse cx="40" cy="65" rx="12" ry="18" fill="#16A34A" transform="rotate(-15 40 65)" />
          <ellipse cx="60" cy="65" rx="12" ry="18" fill="#16A34A" transform="rotate(15 60 65)" />
        </svg>
      );

    default:
      return null;
  }
}

// Custom icon types that have SVG representations
const customIconTypes: { keywords: string[]; type: string; shortName: string }[] = [
  { keywords: ["zinnia"], type: "zinnia", shortName: "Zinnia" },
  { keywords: ["dahlia"], type: "dahlia", shortName: "Dahlia" },
  { keywords: ["peony"], type: "peony", shortName: "Peony" },
  { keywords: ["cosmos"], type: "cosmos", shortName: "Cosmos" },
  { keywords: ["impatiens"], type: "impatiens", shortName: "Impatiens" },
  { keywords: ["begonia"], type: "begonia", shortName: "Begonia" },
  { keywords: ["geranium"], type: "geranium", shortName: "Geranium" },
  { keywords: ["snapdragon"], type: "snapdragon", shortName: "Snapdragon" },
  { keywords: ["coleus"], type: "coleus", shortName: "Coleus" },
];

// Map plant names to appropriate emojis and short names
const plantIconMap: { keywords: string[]; icon: string; shortName: string }[] = [
  // Vegetables
  { keywords: ["tomato"], icon: "🍅", shortName: "Tomato" },
  { keywords: ["carrot"], icon: "🥕", shortName: "Carrot" },
  { keywords: ["corn", "maize"], icon: "🌽", shortName: "Corn" },
  { keywords: ["lettuce"], icon: "🥬", shortName: "Lettuce" },
  { keywords: ["salad", "greens"], icon: "🥬", shortName: "Greens" },
  { keywords: ["broccoli"], icon: "🥦", shortName: "Broccoli" },
  { keywords: ["cucumber"], icon: "🥒", shortName: "Cucumber" },
  { keywords: ["jalapeno"], icon: "🌶️", shortName: "Jalapeño" },
  { keywords: ["habanero"], icon: "🌶️", shortName: "Habanero" },
  { keywords: ["chili"], icon: "🌶️", shortName: "Chili" },
  { keywords: ["pepper"], icon: "🌶️", shortName: "Pepper" },
  { keywords: ["eggplant", "aubergine"], icon: "🍆", shortName: "Eggplant" },
  { keywords: ["potato"], icon: "🥔", shortName: "Potato" },
  { keywords: ["onion"], icon: "🧅", shortName: "Onion" },
  { keywords: ["garlic"], icon: "🧄", shortName: "Garlic" },
  { keywords: ["bean", "legume"], icon: "🫘", shortName: "Bean" },
  { keywords: ["pea"], icon: "🫛", shortName: "Pea" },
  { keywords: ["mushroom"], icon: "🍄", shortName: "Mushroom" },
  { keywords: ["avocado"], icon: "🥑", shortName: "Avocado" },
  { keywords: ["cabbage"], icon: "🥬", shortName: "Cabbage" },
  { keywords: ["bok choy"], icon: "🥬", shortName: "Bok Choy" },
  { keywords: ["zucchini"], icon: "🥒", shortName: "Zucchini" },
  { keywords: ["squash", "courgette"], icon: "🥒", shortName: "Squash" },
  { keywords: ["pumpkin"], icon: "🎃", shortName: "Pumpkin" },
  { keywords: ["radish"], icon: "🥕", shortName: "Radish" },
  { keywords: ["turnip"], icon: "🥕", shortName: "Turnip" },
  { keywords: ["beet"], icon: "🥕", shortName: "Beet" },
  { keywords: ["asparagus"], icon: "🌿", shortName: "Asparagus" },
  { keywords: ["celery"], icon: "🥬", shortName: "Celery" },
  { keywords: ["artichoke"], icon: "🌿", shortName: "Artichoke" },
  { keywords: ["leek"], icon: "🧅", shortName: "Leek" },
  { keywords: ["kale"], icon: "🥬", shortName: "Kale" },
  { keywords: ["spinach"], icon: "🥬", shortName: "Spinach" },

  // Fruits
  { keywords: ["strawberry"], icon: "🍓", shortName: "Strawberry" },
  { keywords: ["blueberry"], icon: "🫐", shortName: "Blueberry" },
  { keywords: ["raspberry"], icon: "🫐", shortName: "Raspberry" },
  { keywords: ["blackberry"], icon: "🫐", shortName: "Blackberry" },
  { keywords: ["berry"], icon: "🫐", shortName: "Berry" },
  { keywords: ["apple"], icon: "🍎", shortName: "Apple" },
  { keywords: ["pear"], icon: "🍐", shortName: "Pear" },
  { keywords: ["peach"], icon: "🍑", shortName: "Peach" },
  { keywords: ["nectarine"], icon: "🍑", shortName: "Nectarine" },
  { keywords: ["cherry"], icon: "🍒", shortName: "Cherry" },
  { keywords: ["grape"], icon: "🍇", shortName: "Grape" },
  { keywords: ["watermelon"], icon: "🍉", shortName: "Watermelon" },
  { keywords: ["cantaloupe"], icon: "🍈", shortName: "Cantaloupe" },
  { keywords: ["honeydew"], icon: "🍈", shortName: "Honeydew" },
  { keywords: ["melon"], icon: "🍈", shortName: "Melon" },
  { keywords: ["pineapple"], icon: "🍍", shortName: "Pineapple" },
  { keywords: ["banana"], icon: "🍌", shortName: "Banana" },
  { keywords: ["lemon"], icon: "🍋", shortName: "Lemon" },
  { keywords: ["lime"], icon: "🍋", shortName: "Lime" },
  { keywords: ["orange"], icon: "🍊", shortName: "Orange" },
  { keywords: ["tangerine"], icon: "🍊", shortName: "Tangerine" },
  { keywords: ["citrus"], icon: "🍊", shortName: "Citrus" },
  { keywords: ["mango"], icon: "🥭", shortName: "Mango" },
  { keywords: ["coconut"], icon: "🥥", shortName: "Coconut" },
  { keywords: ["kiwi"], icon: "🥝", shortName: "Kiwi" },

  // Herbs
  { keywords: ["basil"], icon: "🌿", shortName: "Basil" },
  { keywords: ["mint"], icon: "🌿", shortName: "Mint" },
  { keywords: ["oregano"], icon: "🌿", shortName: "Oregano" },
  { keywords: ["thyme"], icon: "🌿", shortName: "Thyme" },
  { keywords: ["rosemary"], icon: "🌿", shortName: "Rosemary" },
  { keywords: ["sage"], icon: "🌿", shortName: "Sage" },
  { keywords: ["parsley"], icon: "🌿", shortName: "Parsley" },
  { keywords: ["cilantro"], icon: "🌿", shortName: "Cilantro" },
  { keywords: ["dill"], icon: "🌿", shortName: "Dill" },
  { keywords: ["chive"], icon: "🌿", shortName: "Chive" },
  { keywords: ["herb"], icon: "🌿", shortName: "Herb" },

  // Flowers
  { keywords: ["sunflower"], icon: "🌻", shortName: "Sunflower" },
  { keywords: ["rose"], icon: "🌹", shortName: "Rose" },
  { keywords: ["tulip"], icon: "🌷", shortName: "Tulip" },
  { keywords: ["hibiscus"], icon: "🌺", shortName: "Hibiscus" },
  { keywords: ["cherry blossom", "sakura"], icon: "🌸", shortName: "Sakura" },
  { keywords: ["daisy"], icon: "🌼", shortName: "Daisy" },
  { keywords: ["chamomile"], icon: "🌼", shortName: "Chamomile" },
  { keywords: ["lavender"], icon: "💜", shortName: "Lavender" },
  { keywords: ["marigold"], icon: "🌼", shortName: "Marigold" },
  { keywords: ["calendula"], icon: "🌼", shortName: "Calendula" },
  { keywords: ["petunia"], icon: "🌸", shortName: "Petunia" },
  { keywords: ["pansy"], icon: "🌸", shortName: "Pansy" },
  { keywords: ["violet"], icon: "🌸", shortName: "Violet" },
  { keywords: ["flower", "blossom"], icon: "🌸", shortName: "Flower" },

  // Grains/seeds
  { keywords: ["wheat"], icon: "🌾", shortName: "Wheat" },
  { keywords: ["barley"], icon: "🌾", shortName: "Barley" },
  { keywords: ["oat"], icon: "🌾", shortName: "Oat" },
  { keywords: ["grain"], icon: "🌾", shortName: "Grain" },
  { keywords: ["rice"], icon: "🍚", shortName: "Rice" },
  { keywords: ["seed"], icon: "🌱", shortName: "Seed" },
  { keywords: ["chestnut"], icon: "🌰", shortName: "Chestnut" },
  { keywords: ["acorn"], icon: "🌰", shortName: "Acorn" },
  { keywords: ["nut"], icon: "🌰", shortName: "Nut" },
];

function getPlantIconAndName(plantName: string): { icon: string; shortName: string; customType?: string } {
  const name = plantName.toLowerCase();

  // Check custom SVG icons first
  for (const entry of customIconTypes) {
    for (const keyword of entry.keywords) {
      if (name.includes(keyword)) {
        return { icon: "", shortName: entry.shortName, customType: entry.type };
      }
    }
  }

  // Then check emoji icons
  for (const entry of plantIconMap) {
    for (const keyword of entry.keywords) {
      if (name.includes(keyword)) {
        return { icon: entry.icon, shortName: entry.shortName };
      }
    }
  }

  // Default
  return { icon: "🌱", shortName: plantName };
}

function getPlantIcon(plantName: string): string {
  const result = getPlantIconAndName(plantName);
  return result.customType ? "🌸" : result.icon; // Fallback emoji for custom types when just icon is needed
}

// Plant card component for the palette
function PlantCard({
  plant,
  onDragStart,
  onDragEnd,
  onTouchStart,
  isDragging,
}: {
  plant: Plant;
  onDragStart: (plant: Plant) => void;
  onDragEnd: () => void;
  onTouchStart: (plant: Plant, e: React.TouchEvent) => void;
  isDragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("plantId", plant.id.toString());
        e.dataTransfer.setData("type", "new");
        e.dataTransfer.effectAllowed = "copy";
        onDragStart(plant);
      }}
      onDragEnd={onDragEnd}
      onTouchStart={(e) => onTouchStart(plant, e)}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-700 font-medium text-sm flex-shrink-0">
        {plant.name.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{plant.name}</p>
        <p className="text-xs text-slate-500">{plant.spacingInches}&quot; spacing</p>
      </div>
    </div>
  );
}

// Mini-map component
function MiniMap({
  bed,
  placements,
  zoom,
  panOffset,
  containerSize,
  canvasSize,
  onNavigate,
  shouldRotate,
}: {
  bed: Bed;
  placements: Placement[];
  zoom: number;
  panOffset: { x: number; y: number };
  containerSize: { width: number; height: number };
  canvasSize: { width: number; height: number };
  onNavigate: (x: number, y: number) => void;
  shouldRotate: boolean;
}) {
  // Larger mini-map for better touch usability
  const MINI_MAP_WIDTH = 140;

  // Use display dimensions (swapped if rotated)
  const displayWidth = shouldRotate ? bed.heightInches : bed.widthInches;
  const displayHeight = shouldRotate ? bed.widthInches : bed.heightInches;

  const scale = MINI_MAP_WIDTH / displayWidth;
  const miniMapHeight = displayHeight * scale;

  // Transform coordinates for rotated view
  const toDisplayCoords = (x: number, y: number) => {
    if (shouldRotate) {
      return { x: y, y: bed.widthInches - x - bed.cellInches };
    }
    return { x, y };
  };

  // Calculate viewport rectangle
  const viewportWidth = (containerSize.width / (canvasSize.width * zoom)) * MINI_MAP_WIDTH;
  const viewportHeight = (containerSize.height / (canvasSize.height * zoom)) * miniMapHeight;
  const viewportX = (-panOffset.x / (canvasSize.width * zoom)) * MINI_MAP_WIDTH;
  const viewportY = (-panOffset.y / (canvasSize.height * zoom)) * miniMapHeight;

  const navigateToPoint = (clientX: number, clientY: number, rect: DOMRect) => {
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Convert to pan offset
    const targetX = -(clickX / MINI_MAP_WIDTH) * canvasSize.width * zoom + containerSize.width / 2;
    const targetY = -(clickY / miniMapHeight) * canvasSize.height * zoom + containerSize.height / 2;

    onNavigate(targetX, targetY);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    navigateToPoint(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent scroll
    const touch = e.touches[0];
    if (touch) {
      navigateToPoint(touch.clientX, touch.clientY, e.currentTarget.getBoundingClientRect());
    }
  };

  // Only show mini-map when zoomed in enough
  if (zoom < 1.5) return null;

  return (
    <div
      className="absolute bottom-3 right-3 rounded-lg shadow-lg cursor-pointer overflow-hidden"
      style={{
        width: MINI_MAP_WIDTH,
        height: miniMapHeight,
        background: "linear-gradient(145deg, #8B7355 0%, #6B5344 100%)",
        padding: "3px",
      }}
      onClick={handleClick}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
    >
      {/* Inner soil area */}
      <div
        className="w-full h-full rounded relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #5A4A3A 0%, #4D3F32 100%)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
      {/* Grid dots */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: `${bed.cellInches * scale}px ${bed.cellInches * scale}px`,
        }}
      />

      {/* Placements */}
      {placements.map((p) => {
        const size = (p.w ?? p.plant.spacingInches) * scale;
        const displayPos = toDisplayCoords(p.x, p.y);
        return (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: displayPos.x * scale,
              top: displayPos.y * scale,
              width: size,
              height: size,
              backgroundColor: getStatusColor(p),
              opacity: 0.8,
            }}
          />
        );
      })}

      {/* Viewport indicator */}
      <div
        className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
        style={{
          left: Math.max(0, viewportX),
          top: Math.max(0, viewportY),
          width: Math.min(viewportWidth, MINI_MAP_WIDTH - Math.max(0, viewportX)),
          height: Math.min(viewportHeight, miniMapHeight - Math.max(0, viewportY)),
        }}
      />
      </div>
    </div>
  );
}

export default function BedLayoutClient({ bedId }: { bedId: number }) {
  const [bed, setBed] = useState<Bed | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drag and drop state
  const [draggedPlant, setDraggedPlant] = useState<Plant | null>(null);
  const [draggedPlacement, setDraggedPlacement] = useState<Placement | null>(null);
  const [validDropZones, setValidDropZones] = useState<{ x: number; y: number }[]>([]);
  const [dropPosition, setDropPosition] = useState<{ x: number; y: number } | null>(null);

  // Touch drag state
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Animation state
  const [recentlyPlaced, setRecentlyPlaced] = useState<number | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasAutoFit, setHasAutoFit] = useState(false);

  // Undo state for deleted placements
  const [deletedPlacement, setDeletedPlacement] = useState<{
    placement: Placement;
    timer: NodeJS.Timeout;
    expiresAt: number;
  } | null>(null);
  const UNDO_TIMEOUT = 10000; // 10 seconds to undo

  // Plant search state
  const [plantSearch, setPlantSearch] = useState("");
  const [isPlantDropdownOpen, setIsPlantDropdownOpen] = useState(false);
  const [selectedPlantForDrag, setSelectedPlantForDrag] = useState<Plant | null>(null);
  const [isHoveringBed, setIsHoveringBed] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Companion planting alert state
  const [companionAlert, setCompanionAlert] = useState<CompanionAlert | null>(null);

  // Crop rotation history state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{
    id: number;
    plantName: string;
    plantType: string | null;
    x: number;
    y: number;
    w: number;
    h: number;
    seasonYear: number;
    seasonName: string;
    harvestYield: number | null;
    harvestYieldUnit: string | null;
  }[]>([]);
  const [historyYears, setHistoryYears] = useState<number[]>([]);
  const [selectedHistoryYear, setSelectedHistoryYear] = useState<number | null>(null);

  // Bed name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Micro-climate editing state
  const [isEditingMicroClimate, setIsEditingMicroClimate] = useState(false);
  const [selectedMicroClimates, setSelectedMicroClimates] = useState<string[]>([]);
  const [savingMicroClimate, setSavingMicroClimate] = useState(false);

  // Display mode state - persisted to localStorage
  const [showPlantIcons, setShowPlantIcons] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("showPlantIcons") === "true";
    }
    return false;
  });

  // Companion indicator toggle - persisted to localStorage
  const [showCompanionIndicators, setShowCompanionIndicators] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("showCompanionIndicators") === "true";
    }
    return false;
  });

  // Height/shadow visualization toggle
  const [showHeightIndicators, setShowHeightIndicators] = useState(false);

  // Pollinator indicator toggle - persisted to localStorage
  const [showPollinatorIndicators, setShowPollinatorIndicators] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("showPollinatorIndicators") === "true";
    }
    return false;
  });

  // Water zone indicator toggle - persisted to localStorage
  const [showWaterZoneIndicators, setShowWaterZoneIndicators] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("showWaterZoneIndicators") === "true";
    }
    return false;
  });

  // Persist icon toggle to localStorage
  useEffect(() => {
    localStorage.setItem("showPlantIcons", showPlantIcons.toString());
  }, [showPlantIcons]);

  // Persist companion indicator toggle to localStorage
  useEffect(() => {
    localStorage.setItem("showCompanionIndicators", showCompanionIndicators.toString());
  }, [showCompanionIndicators]);

  // Persist pollinator indicator toggle to localStorage
  useEffect(() => {
    localStorage.setItem("showPollinatorIndicators", showPollinatorIndicators.toString());
  }, [showPollinatorIndicators]);

  // Persist water zone indicator toggle to localStorage
  useEffect(() => {
    localStorage.setItem("showWaterZoneIndicators", showWaterZoneIndicators.toString());
  }, [showWaterZoneIndicators]);

  const BASE_PIXELS_PER_INCH = 4;
  const PIXELS_PER_INCH = BASE_PIXELS_PER_INCH * zoom;
  const LONG_PRESS_DURATION = 400;

  // Track container size for mini-map and auto-fit
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Auto-fit zoom to container when bed loads
  useEffect(() => {
    if (!bed || hasAutoFit || containerSize.width === 0 || containerSize.height === 0) return;

    // Calculate display dimensions
    const isRotated = bed.heightInches > bed.widthInches;
    const displayW = isRotated ? bed.heightInches : bed.widthInches;
    const displayH = isRotated ? bed.widthInches : bed.heightInches;

    // Calculate bed dimensions in pixels at zoom 1
    const bedPixelWidth = displayW * BASE_PIXELS_PER_INCH;
    const bedPixelHeight = displayH * BASE_PIXELS_PER_INCH;

    // Calculate zoom to fill container (with some padding)
    const padding = 16;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;

    const zoomToFitWidth = availableWidth / bedPixelWidth;
    const zoomToFitHeight = availableHeight / bedPixelHeight;

    // Use the smaller zoom to ensure it fits both dimensions, allow up to 10x for small beds
    const fitZoom = Math.min(zoomToFitWidth, zoomToFitHeight, 10);

    setZoom(Math.max(0.5, fitZoom)); // Minimum 0.5x
    setHasAutoFit(true);
  }, [bed, containerSize, hasAutoFit]);

  const loadBed = useCallback(async () => {
    const res = await fetch(`/api/beds/${bedId}`, { cache: "no-store" });
    const parsed = await readJson<Bed | null>(res);
    if (!parsed.ok)
      throw new Error(`Failed to load bed (${parsed.status}): ${parsed.text}`);
    setBed(parsed.data);
  }, [bedId]);

  const loadPlants = useCallback(async () => {
    const res = await fetch(`/api/plants`, { cache: "no-store" });
    const parsed = await readJson<Plant[]>(res);
    if (!parsed.ok)
      throw new Error(`Failed to load plants (${parsed.status}): ${parsed.text}`);
    setPlants(parsed.data ?? []);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/beds/${bedId}/history`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setHistoryYears(data.years || []);
        if (data.years?.length > 0 && !selectedHistoryYear) {
          setSelectedHistoryYear(data.years[0]);
        }
      }
    } catch {
      // History is optional, don't show error
    }
  }, [bedId, selectedHistoryYear]);

  const refresh = useCallback(async () => {
    setMessage("");
    try {
      await Promise.all([loadBed(), loadPlants(), loadHistory()]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load.");
    }
  }, [loadBed, loadPlants, loadHistory]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const placements = useMemo(() => bed?.placements ?? [], [bed]);

  // Auto-rotate beds that are taller than wide to fill screen better
  const shouldRotate = useMemo(() => {
    if (!bed) return false;
    return bed.heightInches > bed.widthInches;
  }, [bed]);

  // Transform coordinates for rotated view (data coords -> display coords)
  const toDisplayCoords = useCallback(
    (x: number, y: number) => {
      if (!bed || !shouldRotate) return { x, y };
      return { x: y, y: bed.widthInches - x - bed.cellInches };
    },
    [bed, shouldRotate]
  );

  // Transform coordinates for rotated view (display coords -> data coords)
  const fromDisplayCoords = useCallback(
    (dx: number, dy: number) => {
      if (!bed || !shouldRotate) return { x: dx, y: dy };
      return { x: bed.widthInches - dy - bed.cellInches, y: dx };
    },
    [bed, shouldRotate]
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    if (!bed) return map;
    for (const p of bed.placements)
      map.set(p.plant.name, (map.get(p.plant.name) ?? 0) + 1);
    return map;
  }, [bed]);

  const companionSuggestions = useMemo(() => {
    const plantNames = Array.from(counts.keys());
    if (plantNames.length < 2) return { goodPairs: [], badPairs: [] };
    return getCompanionSuggestions(plantNames);
  }, [counts]);

  // Compute companion relationships for each placement (for visual indicators)
  // Updates in real-time when dragging plants to show how companions would change
  const companionStatus = useMemo(() => {
    const status = new Map<number, { hasGood: boolean; hasBad: boolean; goodWith: string[]; badWith: string[] }>();

    // Build the effective placements list, considering any plant being dragged
    let effectivePlacements = placements;

    // If dragging a new plant to be placed, add a virtual placement
    if (draggedPlant && dropPosition && !draggedPlacement) {
      effectivePlacements = [
        ...placements,
        {
          id: -1, // Virtual ID for the plant being placed
          x: dropPosition.x,
          y: dropPosition.y,
          plant: draggedPlant,
        } as Placement,
      ];
    }

    // If moving an existing placement, update its position in calculations
    if (draggedPlacement && dropPosition) {
      effectivePlacements = placements.map(p =>
        p.id === draggedPlacement.id
          ? { ...p, x: dropPosition.x, y: dropPosition.y }
          : p
      );
    }

    for (const p of effectivePlacements) {
      const goodWith: string[] = [];
      const badWith: string[] = [];

      for (const other of effectivePlacements) {
        if (other.id === p.id) continue;

        const result = checkCompatibility(p.plant.name, other.plant.name);
        if (result.type === "good" && !goodWith.includes(other.plant.name)) {
          goodWith.push(other.plant.name);
        } else if (result.type === "bad" && !badWith.includes(other.plant.name)) {
          badWith.push(other.plant.name);
        }
      }

      status.set(p.id, {
        hasGood: goodWith.length > 0,
        hasBad: badWith.length > 0,
        goodWith,
        badWith,
      });
    }

    return status;
  }, [placements, draggedPlant, draggedPlacement, dropPosition]);

  // Calculate harmony score for the bed (0-100%)
  // Good companions add points, bad companions subtract (weighted more heavily)
  const harmonyScore = useMemo(() => {
    if (placements.length < 2) return null; // Need at least 2 plants for relationships

    let goodCount = 0;
    let badCount = 0;
    const checkedPairs = new Set<string>();

    for (const p of placements) {
      for (const other of placements) {
        if (p.id >= other.id) continue; // Avoid checking same pair twice

        const pairKey = `${Math.min(p.id, other.id)}-${Math.max(p.id, other.id)}`;
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        const result = checkCompatibility(p.plant.name, other.plant.name);
        if (result.type === "good") goodCount++;
        else if (result.type === "bad") badCount++;
      }
    }

    const totalPairs = checkedPairs.size;
    if (totalPairs === 0) return null;

    // Score: good pairs add 1 point, bad pairs subtract 2 points
    // Normalize to 0-100 scale
    const rawScore = goodCount - (badCount * 2);
    const maxPossibleScore = totalPairs; // If all were good
    const minPossibleScore = -totalPairs * 2; // If all were bad

    // Normalize to 0-100
    const normalized = ((rawScore - minPossibleScore) / (maxPossibleScore - minPossibleScore)) * 100;
    return {
      score: Math.round(Math.max(0, Math.min(100, normalized))),
      goodCount,
      badCount,
      neutralCount: totalPairs - goodCount - badCount,
      totalPairs,
    };
  }, [placements]);

  // Calculate space efficiency for the bed
  const spaceEfficiency = useMemo(() => {
    if (!bed) return null;

    const bedArea = bed.widthInches * bed.heightInches; // Total bed area in sq inches

    // Calculate total planted area (using plant spacing as diameter)
    let plantedArea = 0;
    for (const p of placements) {
      const spacing = p.w ?? p.plant.spacingInches ?? 12;
      // Calculate area as a circle (pi * r^2) - more accurate for plant coverage
      const radius = spacing / 2;
      plantedArea += Math.PI * radius * radius;
    }

    // Efficiency percentage (capped at 100% since plants can overlap visually)
    const efficiency = Math.min(100, Math.round((plantedArea / bedArea) * 100));

    // Estimate how many more plants could fit
    // Use average plant spacing if we have plants, otherwise default to 12"
    const avgSpacing = placements.length > 0
      ? placements.reduce((sum, p) => sum + (p.w ?? p.plant.spacingInches ?? 12), 0) / placements.length
      : 12;
    const avgPlantArea = Math.PI * (avgSpacing / 2) * (avgSpacing / 2);
    const remainingArea = Math.max(0, bedArea - plantedArea);
    const potentialAdditionalPlants = Math.floor(remainingArea / avgPlantArea);

    return {
      efficiency,
      plantedArea: Math.round(plantedArea),
      totalArea: bedArea,
      plantCount: placements.length,
      potentialAdditionalPlants,
      avgSpacing: Math.round(avgSpacing),
    };
  }, [bed, placements]);

  // Calculate pollinator stats for the bed
  const pollinatorStats = useMemo(() => {
    if (placements.length === 0) return null;

    const pollinatorPlants = placements.filter(p => p.plant.attractsPollinators);
    const pollinatorCount = pollinatorPlants.length;

    // Collect all pollinator types
    const pollinatorTypesSet = new Set<string>();
    for (const p of pollinatorPlants) {
      if (p.plant.pollinatorTypes) {
        p.plant.pollinatorTypes.split(",").forEach(type => pollinatorTypesSet.add(type.trim()));
      }
    }

    return {
      count: pollinatorCount,
      percentage: Math.round((pollinatorCount / placements.length) * 100),
      types: Array.from(pollinatorTypesSet),
      plants: pollinatorPlants.map(p => p.plant.name),
    };
  }, [placements]);

  // Calculate water zone stats for the bed
  const waterZoneStats = useMemo(() => {
    if (placements.length === 0) return null;

    const zones = { low: 0, medium: 0, high: 0, unknown: 0 };

    for (const p of placements) {
      const zone = p.plant.waterZone;
      if (zone === "low" || zone === "medium" || zone === "high") {
        zones[zone]++;
      } else {
        zones.unknown++;
      }
    }

    // Check if there's a mix of conflicting water needs (high and low together)
    const hasConflict = zones.high > 0 && zones.low > 0;

    return {
      ...zones,
      hasConflict,
      total: placements.length,
    };
  }, [placements]);

  // Calculate shadow warnings - tall plants south of shorter plants
  // In northern hemisphere, sun comes from the south, so tall plants on south side shade north
  const shadowWarnings = useMemo(() => {
    if (!showHeightIndicators) return new Map<number, { shadedBy: string[]; shades: string[] }>();

    const warnings = new Map<number, { shadedBy: string[]; shades: string[] }>();

    // Initialize all placements
    for (const p of placements) {
      warnings.set(p.id, { shadedBy: [], shades: [] });
    }

    // Check each pair of plants for potential shading
    // Assuming bed Y increases downward (south is higher Y values in bed coordinates)
    for (const p1 of placements) {
      const height1 = p1.plant.averageHeightInches ?? 20; // Default 20" if unknown

      for (const p2 of placements) {
        if (p1.id === p2.id) continue;

        const height2 = p2.plant.averageHeightInches ?? 20;
        const heightDiff = height1 - height2;

        // If p1 is significantly taller (>12" difference)
        if (heightDiff > 12) {
          // Check if p1 is south of p2 (higher Y = south in bed view)
          // Also check if they're close enough horizontally to cause shading
          const spacing1 = p1.w ?? p1.plant.spacingInches ?? 12;
          const spacing2 = p2.w ?? p2.plant.spacingInches ?? 12;
          const maxShadowDistance = Math.max(spacing1, spacing2) * 2; // Shadow can extend 2x plant spacing

          const dx = Math.abs(p1.x - p2.x);
          const dy = p1.y - p2.y; // Positive if p1 is south of p2

          // p1 shades p2 if p1 is south of p2 (positive dy) and within horizontal range
          if (dy > 0 && dy < maxShadowDistance && dx < maxShadowDistance) {
            const w1 = warnings.get(p1.id)!;
            const w2 = warnings.get(p2.id)!;
            w1.shades.push(p2.plant.name);
            w2.shadedBy.push(p1.plant.name);
          }
        }
      }
    }

    return warnings;
  }, [placements, showHeightIndicators]);

  // Get height category for visual indicator
  const getHeightCategory = (heightInches: number | null | undefined): "short" | "medium" | "tall" | "unknown" => {
    if (heightInches == null) return "unknown";
    if (heightInches < 12) return "short";   // Under 1 foot
    if (heightInches < 40) return "medium";  // 1-3 feet
    return "tall";                            // Over 3 feet
  };

  // Fuzzy filter plants based on search query
  const filteredPlants = useMemo(() => {
    if (!plantSearch.trim()) return plants;
    const query = plantSearch.toLowerCase();
    return plants.filter((plant) => {
      const name = plant.name.toLowerCase();
      // Exact substring match
      if (name.includes(query)) return true;
      // Fuzzy match: check if all query chars appear in order
      let qi = 0;
      for (let i = 0; i < name.length && qi < query.length; i++) {
        if (name[i] === query[qi]) qi++;
      }
      return qi === query.length;
    });
  }, [plants, plantSearch]);

  // Calculate open spots (areas where a plant could potentially fit)
  const openSpots = useMemo(() => {
    if (!bed) return [];

    const spots: { x: number; y: number }[] = [];
    const checkSize = bed.cellInches;

    for (let x = 0; x <= bed.widthInches - checkSize; x += bed.cellInches) {
      for (let y = 0; y <= bed.heightInches - checkSize; y += bed.cellInches) {
        const centerX = x + checkSize / 2;
        const centerY = y + checkSize / 2;

        let isOccupied = false;
        for (const p of placements) {
          const pw = p.w ?? p.plant.spacingInches;
          const ph = p.h ?? p.plant.spacingInches;
          const pCenterX = p.x + pw / 2;
          const pCenterY = p.y + ph / 2;

          const dist = Math.sqrt(
            Math.pow(centerX - pCenterX, 2) + Math.pow(centerY - pCenterY, 2)
          );

          if (dist < pw / 2 + checkSize / 2) {
            isOccupied = true;
            break;
          }
        }

        if (!isOccupied) {
          spots.push({ x, y });
        }
      }
    }

    return spots;
  }, [bed, placements]);

  // Check if a position is valid for placing a plant (optionally excluding a placement being moved)
  const isPositionValid = useCallback(
    (x: number, y: number, plantToPlace: Plant, excludePlacementId?: number): boolean => {
      if (!bed) return false;

      const w = plantToPlace.spacingInches;
      const h = plantToPlace.spacingInches;
      if (x + w > bed.widthInches || y + h > bed.heightInches) return false;
      if (x < 0 || y < 0) return false;

      const newCenterX = x + w / 2;
      const newCenterY = y + h / 2;

      for (const p of placements) {
        // Skip the placement being moved
        if (excludePlacementId && p.id === excludePlacementId) continue;

        const pw = p.w ?? p.plant.spacingInches;
        const ph = p.h ?? p.plant.spacingInches;
        const existingCenterX = p.x + pw / 2;
        const existingCenterY = p.y + ph / 2;

        const distanceX = Math.abs(newCenterX - existingCenterX);
        const distanceY = Math.abs(newCenterY - existingCenterY);
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        const requiredSpacing = Math.max(plantToPlace.spacingInches, p.plant.spacingInches);
        if (distance < requiredSpacing) return false;
      }

      return true;
    },
    [bed, placements]
  );

  // Calculate all valid drop zones for a plant
  const calculateValidZones = useCallback(
    (plant: Plant, excludePlacementId?: number) => {
      if (!bed) return;

      const zones: { x: number; y: number }[] = [];
      const step = Math.max(1, Math.floor(bed.cellInches / 2));

      for (let x = 0; x <= bed.widthInches - plant.spacingInches; x += step) {
        for (let y = 0; y <= bed.heightInches - plant.spacingInches; y += step) {
          if (isPositionValid(x, y, plant, excludePlacementId)) {
            zones.push({ x, y });
          }
        }
      }

      setValidDropZones(zones);
    },
    [bed, isPositionValid]
  );

  // Calculate valid zones when a plant is selected and hovering over bed
  useEffect(() => {
    if (selectedPlantForDrag && isHoveringBed && !draggedPlant) {
      calculateValidZones(selectedPlantForDrag);
    } else if (!selectedPlantForDrag && !draggedPlant) {
      setValidDropZones([]);
      setHoverPosition(null);
    }
  }, [selectedPlantForDrag, isHoveringBed, draggedPlant, calculateValidZones]);

  // Handle drag start from palette (new plant)
  const handleDragStart = useCallback(
    (plant: Plant) => {
      setDraggedPlant(plant);
      setDraggedPlacement(null);
      calculateValidZones(plant);
      setMessage("");
    },
    [calculateValidZones]
  );

  // Handle drag start from existing placement (reposition)
  const handlePlacementDragStart = useCallback(
    (placement: Placement, e: React.DragEvent) => {
      e.dataTransfer.setData("placementId", placement.id.toString());
      e.dataTransfer.setData("type", "move");
      e.dataTransfer.effectAllowed = "move";
      setDraggedPlacement(placement);
      setDraggedPlant(placement.plant);
      calculateValidZones(placement.plant, placement.id);
      setMessage("");
    },
    [calculateValidZones]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedPlant(null);
    setDraggedPlacement(null);
    setValidDropZones([]);
    setDropPosition(null);
  }, []);

  // Get position from mouse/touch event relative to canvas (returns data coordinates)
  // If plantSpacing is provided, offset so the plant would be centered on the cursor
  const getCanvasPosition = useCallback(
    (clientX: number, clientY: number, plantSpacing?: number) => {
      if (!canvasRef.current || !bed) return null;

      const rect = canvasRef.current.getBoundingClientRect();
      const pixelX = (clientX - rect.left - panOffset.x) / zoom;
      const pixelY = (clientY - rect.top - panOffset.y) / zoom;

      // Convert from pixels to display inches (use exact position, not floored)
      let displayInchX = pixelX / BASE_PIXELS_PER_INCH;
      let displayInchY = pixelY / BASE_PIXELS_PER_INCH;

      // If plant spacing provided, offset so cursor is at center of plant
      if (plantSpacing) {
        displayInchX -= plantSpacing / 2;
        displayInchY -= plantSpacing / 2;
      }

      // Floor to grid alignment
      displayInchX = Math.floor(displayInchX);
      displayInchY = Math.floor(displayInchY);

      // Convert from display coordinates to data coordinates
      const dataCoords = fromDisplayCoords(displayInchX, displayInchY);

      return {
        x: Math.max(0, Math.min(dataCoords.x, bed.widthInches - bed.cellInches)),
        y: Math.max(0, Math.min(dataCoords.y, bed.heightInches - bed.cellInches)),
      };
    },
    [bed, zoom, panOffset, fromDisplayCoords]
  );

  // Find nearest valid zone to a position
  const findNearestValidZone = useCallback(
    (pos: { x: number; y: number }) => {
      if (validDropZones.length === 0) return null;

      let nearest = validDropZones[0];
      let minDist = Infinity;

      for (const zone of validDropZones) {
        const dist = Math.sqrt(
          Math.pow(zone.x - pos.x, 2) + Math.pow(zone.y - pos.y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          nearest = zone;
        }
      }

      if (minDist > (draggedPlant?.spacingInches ?? 12) * 2) return null;
      return nearest;
    },
    [validDropZones, draggedPlant]
  );

  // Place new plant at position
  const placeAt = useCallback(
    async (x: number, y: number, plantId: number) => {
      setMessage("");

      const res = await fetch(`/api/beds/${bedId}/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId, x, y }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          setMessage(j?.error ?? `Place failed (${res.status})`);
        } catch {
          setMessage(`Place failed (${res.status})`);
        }
        return null;
      }

      const data = await res.json();
      await loadBed();

      // Trigger animation
      if (data?.id) {
        setRecentlyPlaced(data.id);
        setTimeout(() => setRecentlyPlaced(null), 500);
      }

      // Check for companion planting relationships
      const placedPlant = plants.find(p => p.id === plantId);
      if (placedPlant) {
        const existingPlantNames = new Set(placements.map(p => p.plant.name));
        // Only check if there are other plants and this isn't a duplicate
        if (existingPlantNames.size > 0) {
          const goodPairs: { plant: string; reason: string }[] = [];
          const badPairs: { plant: string; reason: string }[] = [];

          existingPlantNames.forEach(existingName => {
            if (existingName !== placedPlant.name) {
              const result = checkCompatibility(placedPlant.name, existingName);
              if (result.type === "good") {
                goodPairs.push({ plant: existingName, reason: result.reason });
              } else if (result.type === "bad") {
                badPairs.push({ plant: existingName, reason: result.reason });
              }
            }
          });

          // Show alert if there are any companion relationships
          if (goodPairs.length > 0 || badPairs.length > 0) {
            setCompanionAlert({
              plantName: placedPlant.name,
              goodPairs,
              badPairs,
            });
          }
        } else {
          // First plant - check if it has companion data to inform user
          const companionInfo = findPlantCompanions(placedPlant.name);
          if (companionInfo) {
            setCompanionAlert({
              plantName: placedPlant.name,
              goodPairs: companionInfo.goodCompanions.slice(0, 3).map(c => ({ plant: c.name, reason: c.reason })),
              badPairs: companionInfo.badCompanions.slice(0, 3).map(c => ({ plant: c.name, reason: c.reason })),
            });
          }
        }
      }

      return data;
    },
    [bedId, loadBed, plants, placements]
  );

  // Move existing placement to new position
  const movePlacement = useCallback(
    async (placementId: number, x: number, y: number) => {
      setMessage("");

      const res = await fetch(`/api/placements/${placementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          setMessage(j?.error ?? `Move failed (${res.status})`);
        } catch {
          setMessage(`Move failed (${res.status})`);
        }
        return;
      }

      await loadBed();

      // Trigger animation
      setRecentlyPlaced(placementId);
      setTimeout(() => setRecentlyPlaced(null), 500);
    },
    [loadBed]
  );

  // Clear any existing undo timer
  const clearUndoTimer = useCallback(() => {
    if (deletedPlacement?.timer) {
      clearTimeout(deletedPlacement.timer);
    }
    setDeletedPlacement(null);
  }, [deletedPlacement]);

  // Delete a placement (with undo support)
  const deletePlacement = useCallback(
    async (placementId: number) => {
      setMessage("");

      // Find the placement to store for undo
      const placementToDelete = placements.find((p) => p.id === placementId);
      if (!placementToDelete) {
        setMessage("Placement not found");
        return;
      }

      const res = await fetch(`/api/placements/${placementId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          setMessage(j?.error ?? `Delete failed (${res.status})`);
        } catch {
          setMessage(`Delete failed (${res.status})`);
        }
        return;
      }

      // Clear any existing undo timer
      if (deletedPlacement?.timer) {
        clearTimeout(deletedPlacement.timer);
      }

      // Set up new undo with timer
      const timer = setTimeout(() => {
        setDeletedPlacement(null);
      }, UNDO_TIMEOUT);

      setDeletedPlacement({
        placement: placementToDelete,
        timer,
        expiresAt: Date.now() + UNDO_TIMEOUT,
      });

      await loadBed();
    },
    [loadBed, placements, deletedPlacement]
  );

  // Undo the last deletion
  const undoDelete = useCallback(async () => {
    if (!deletedPlacement) return;

    const { placement } = deletedPlacement;
    clearUndoTimer();

    // Recreate the placement
    const res = await fetch(`/api/beds/${bedId}/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plantId: placement.plant.id,
        x: placement.x,
        y: placement.y,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        setMessage(j?.error ?? "Failed to restore plant");
      } catch {
        setMessage("Failed to restore plant");
      }
      return;
    }

    setMessage(`Restored ${placement.plant.name}`);
    await loadBed();
  }, [deletedPlacement, clearUndoTimer, bedId, loadBed]);

  // Save bed name
  const saveBedName = useCallback(async () => {
    if (!editedName.trim() || editedName.trim() === bed?.name) {
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      const res = await fetch(`/api/beds/${bedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to update bed name");
        setSavingName(false);
        return;
      }

      await loadBed();
      setIsEditingName(false);
    } catch {
      setMessage("Failed to update bed name");
    } finally {
      setSavingName(false);
    }
  }, [editedName, bed?.name, bedId, loadBed]);

  // Save micro-climate settings
  const saveMicroClimate = useCallback(async () => {
    const newValue = selectedMicroClimates.length > 0 ? selectedMicroClimates.join(",") : null;
    const currentValue = bed?.microClimate || null;

    if (newValue === currentValue) {
      setIsEditingMicroClimate(false);
      return;
    }

    setSavingMicroClimate(true);
    try {
      const res = await fetch(`/api/beds/${bedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ microClimate: newValue }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to update micro-climate");
        setSavingMicroClimate(false);
        return;
      }

      await loadBed();
      setIsEditingMicroClimate(false);
    } catch {
      setMessage("Failed to update micro-climate");
    } finally {
      setSavingMicroClimate(false);
    }
  }, [selectedMicroClimates, bed?.microClimate, bedId, loadBed]);

  // Delete all placements of a specific plant type
  const deleteAllOfPlant = useCallback(
    async (plantName: string) => {
      setMessage("");

      const toDelete = placements.filter((p) => p.plant.name === plantName);
      if (toDelete.length === 0) return;

      // Delete all in parallel
      const results = await Promise.all(
        toDelete.map((p) =>
          fetch(`/api/placements/${p.id}`, { method: "DELETE" })
        )
      );

      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        setMessage(`Failed to delete ${failed} of ${toDelete.length} plants`);
      }

      await loadBed();
    },
    [placements, loadBed]
  );

  // Canvas drag events
  const handleCanvasDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = draggedPlacement ? "move" : "copy";

      // Pass plant spacing to center the preview on the cursor
      const pos = getCanvasPosition(e.clientX, e.clientY, draggedPlant?.spacingInches);
      if (pos) {
        const nearest = findNearestValidZone(pos);
        setDropPosition(nearest);
      }
    },
    [getCanvasPosition, findNearestValidZone, draggedPlacement, draggedPlant]
  );

  const handleCanvasDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const type = e.dataTransfer.getData("type");

      if (!dropPosition) {
        handleDragEnd();
        return;
      }

      if (type === "move") {
        const placementId = parseInt(e.dataTransfer.getData("placementId"), 10);
        if (placementId) {
          await movePlacement(placementId, dropPosition.x, dropPosition.y);
        }
      } else {
        const plantId = parseInt(e.dataTransfer.getData("plantId"), 10);
        if (plantId) {
          await placeAt(dropPosition.x, dropPosition.y, plantId);
        }
      }

      handleDragEnd();
    },
    [dropPosition, placeAt, movePlacement, handleDragEnd]
  );

  const handleCanvasDragLeave = useCallback(() => {
    setDropPosition(null);
  }, []);

  // Touch events for mobile - new plant
  const handleTouchStart = useCallback(
    (plant: Plant, e: React.TouchEvent) => {
      e.preventDefault();

      touchTimerRef.current = setTimeout(() => {
        setDraggedPlant(plant);
        setDraggedPlacement(null);
        setIsTouchDragging(true);
        calculateValidZones(plant);
        if (navigator.vibrate) navigator.vibrate(50);
      }, LONG_PRESS_DURATION);
    },
    [calculateValidZones]
  );

  // Touch events for mobile - existing placement
  const handlePlacementTouchStart = useCallback(
    (placement: Placement, e: React.TouchEvent) => {
      e.stopPropagation();

      touchTimerRef.current = setTimeout(() => {
        setDraggedPlacement(placement);
        setDraggedPlant(placement.plant);
        setIsTouchDragging(true);
        calculateValidZones(placement.plant, placement.id);
        if (navigator.vibrate) navigator.vibrate(50);
      }, LONG_PRESS_DURATION);
    },
    [calculateValidZones]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isTouchDragging || !draggedPlant) return;

      const touch = e.touches[0];
      // Pass plant spacing to center the preview on the touch point
      const pos = getCanvasPosition(touch.clientX, touch.clientY, draggedPlant.spacingInches);
      if (pos) {
        const nearest = findNearestValidZone(pos);
        setTouchPosition(pos);
        setDropPosition(nearest);
      }
    },
    [isTouchDragging, draggedPlant, getCanvasPosition, findNearestValidZone]
  );

  const handleTouchEnd = useCallback(async () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    if (isTouchDragging && draggedPlant && dropPosition) {
      if (draggedPlacement) {
        await movePlacement(draggedPlacement.id, dropPosition.x, dropPosition.y);
      } else {
        await placeAt(dropPosition.x, dropPosition.y, draggedPlant.id);
      }
    }

    setIsTouchDragging(false);
    setTouchPosition(null);
    handleDragEnd();
  }, [isTouchDragging, draggedPlant, draggedPlacement, dropPosition, placeAt, movePlacement, handleDragEnd]);

  // Cancel touch drag on scroll
  useEffect(() => {
    const cancelTouch = () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    };
    window.addEventListener("scroll", cancelTouch);
    return () => window.removeEventListener("scroll", cancelTouch);
  }, []);

  // Pan handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button === 1 || e.shiftKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    },
    [panOffset]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
      // Track hover position when a plant is selected (for click-to-place)
      // Pass plant spacing to center the preview on the cursor
      if (selectedPlantForDrag && !draggedPlant && !isPanning) {
        const pos = getCanvasPosition(e.clientX, e.clientY, selectedPlantForDrag.spacingInches);
        if (pos) {
          const nearest = findNearestValidZone(pos);
          setHoverPosition(nearest);
          setDropPosition(nearest);
        }
      }
    },
    [isPanning, panStart, selectedPlantForDrag, draggedPlant, getCanvasPosition, findNearestValidZone]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle mouse enter/leave for showing valid zones when plant selected
  const handleCanvasMouseEnter = useCallback(() => {
    if (selectedPlantForDrag) {
      setIsHoveringBed(true);
    }
  }, [selectedPlantForDrag]);

  const handleCanvasMouseLeave = useCallback(() => {
    setIsHoveringBed(false);
    if (!draggedPlant) {
      setHoverPosition(null);
      setDropPosition(null);
    }
  }, [draggedPlant]);

  // Handle click to place when a plant is selected
  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't place if we were panning, dragging, or clicking on a placement
      if (isPanning || draggedPlant) return;

      // Only place if we have a selected plant and a valid hover position
      if (selectedPlantForDrag && hoverPosition) {
        e.stopPropagation();
        await placeAt(hoverPosition.x, hoverPosition.y, selectedPlantForDrag.id);
      }
    },
    [isPanning, draggedPlant, selectedPlantForDrag, hoverPosition, placeAt]
  );

  // Mini-map navigation
  const handleMiniMapNavigate = useCallback((x: number, y: number) => {
    setPanOffset({ x, y });
  }, []);

  // Center the view on a specific placement
  const centerOnPlacement = useCallback(
    (placement: Placement) => {
      if (containerSize.width === 0 || containerSize.height === 0) return;

      const size = placement.w ?? placement.plant.spacingInches;
      const displayPos = toDisplayCoords(placement.x, placement.y);

      // Calculate the center of the plant in pixels
      const plantCenterX = (displayPos.x + size / 2) * PIXELS_PER_INCH;
      const plantCenterY = (displayPos.y + size / 2) * PIXELS_PER_INCH;

      // Calculate pan offset to center the plant
      const targetX = containerSize.width / 2 - plantCenterX;
      const targetY = containerSize.height / 2 - plantCenterY;

      setPanOffset({ x: targetX, y: targetY });
    },
    [containerSize, toDisplayCoords, PIXELS_PER_INCH]
  );

  // Zoom handlers
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.5, 10)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.5, 0.5)), []);
  const handleZoomReset = useCallback(() => {
    if (!bed || containerSize.width === 0 || containerSize.height === 0) {
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    // Fit to container
    const isRotated = bed.heightInches > bed.widthInches;
    const displayW = isRotated ? bed.heightInches : bed.widthInches;
    const displayH = isRotated ? bed.widthInches : bed.heightInches;

    const bedPixelWidth = displayW * BASE_PIXELS_PER_INCH;
    const bedPixelHeight = displayH * BASE_PIXELS_PER_INCH;

    const padding = 16;
    const zoomToFitWidth = (containerSize.width - padding) / bedPixelWidth;
    const zoomToFitHeight = (containerSize.height - padding) / bedPixelHeight;

    // Allow up to 10x zoom for small beds to fill the space
    setZoom(Math.max(0.5, Math.min(zoomToFitWidth, zoomToFitHeight, 10)));
    setPanOffset({ x: 0, y: 0 });
  }, [bed, containerSize]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      setZoom((z) => (delta > 0 ? Math.min(z * 1.1, 10) : Math.max(z / 1.1, 0.5)));
    }
  }, []);

  if (!bed) {
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold">Bed</h1>
          <Link className="text-sm underline" href="/beds">
            Back to beds
          </Link>
        </div>
        <p className="text-sm text-gray-600">Loading...</p>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </div>
    );
  }

  const gridCols = Math.max(1, Math.floor(bed.widthInches / bed.cellInches));
  const gridRows = Math.max(1, Math.floor(bed.heightInches / bed.cellInches));

  // Display dimensions (swapped if rotated)
  const displayWidth = shouldRotate ? bed.heightInches : bed.widthInches;
  const displayHeight = shouldRotate ? bed.widthInches : bed.heightInches;
  const canvasWidth = displayWidth * BASE_PIXELS_PER_INCH;
  const canvasHeight = displayHeight * BASE_PIXELS_PER_INCH;

  // Calculate ideal container height based on bed aspect ratio
  // This ensures the bed fills the container without dead space
  const bedAspectRatio = displayHeight / displayWidth;
  // Assume container width is roughly the available space (will be refined by actual measurement)
  // Use aspect ratio to determine height: shorter beds get shorter containers
  const idealContainerHeight = Math.min(
    Math.max(200, Math.round(bedAspectRatio * 600)), // Scale based on aspect ratio
    600 // Max height
  );

  return (
    <div
      className="space-y-4 max-w-full overflow-x-hidden"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveBedName();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                className="text-xl font-semibold border-b-2 border-emerald-500 bg-transparent outline-none px-1"
                autoFocus
                disabled={savingName}
              />
              <button
                onClick={saveBedName}
                disabled={savingName}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {savingName ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                disabled={savingName}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1
              className="text-xl font-semibold cursor-pointer hover:text-emerald-700 group flex items-center gap-2"
              onClick={() => {
                setEditedName(bed.name);
                setIsEditingName(true);
              }}
              title="Click to edit bed name"
            >
              {bed.name}
              <svg
                className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </h1>
          )}
          <p className="text-sm text-gray-600">
            {bed.widthInches}&quot; x {bed.heightInches}&quot; — {bed.cellInches}&quot; grid ({gridCols}x{gridRows})
            {shouldRotate && (
              <span className="ml-2 text-xs text-slate-500">(rotated for display)</span>
            )}
          </p>

          {/* Micro-climate indicator/editor */}
          {isEditingMicroClimate ? (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border">
              <p className="text-xs font-medium text-slate-600 mb-2">Select micro-climate conditions:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {MICROCLIMATE_OPTIONS.map((option) => {
                  const isSelected = selectedMicroClimates.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMicroClimates(selectedMicroClimates.filter(v => v !== option.value));
                        } else {
                          setSelectedMicroClimates([...selectedMicroClimates, option.value]);
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded-full border transition-all ${
                        isSelected
                          ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                          : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                      }`}
                      title={option.description}
                    >
                      {option.icon} {option.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveMicroClimate}
                  disabled={savingMicroClimate}
                  className="text-xs px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingMicroClimate ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditingMicroClimate(false)}
                  disabled={savingMicroClimate}
                  className="text-xs px-3 py-1 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setSelectedMicroClimates(bed.microClimate ? bed.microClimate.split(",") : []);
                setIsEditingMicroClimate(true);
              }}
              className="mt-1 text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 group"
              title="Click to edit micro-climate conditions"
            >
              {bed.microClimate ? (
                <>
                  {bed.microClimate.split(",").map((v) => {
                    const option = MICROCLIMATE_OPTIONS.find(o => o.value === v);
                    return option ? (
                      <span key={v} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                        {option.icon} {option.label}
                      </span>
                    ) : null;
                  })}
                  <svg className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </>
              ) : (
                <span className="text-slate-400 hover:text-emerald-500">+ Add micro-climate conditions</span>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Harmony Score */}
          {harmonyScore && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{
                backgroundColor: harmonyScore.score >= 70 ? "#dcfce7" : harmonyScore.score >= 40 ? "#fef9c3" : "#fee2e2",
                borderColor: harmonyScore.score >= 70 ? "#22c55e" : harmonyScore.score >= 40 ? "#eab308" : "#ef4444",
              }}
              title={`${harmonyScore.goodCount} good pairs, ${harmonyScore.badCount} bad pairs, ${harmonyScore.neutralCount} neutral`}
            >
              <div className="flex items-center gap-1">
                <span className="text-lg">
                  {harmonyScore.score >= 70 ? "🤝" : harmonyScore.score >= 40 ? "🤔" : "⚠️"}
                </span>
                <span className="text-sm font-semibold" style={{
                  color: harmonyScore.score >= 70 ? "#15803d" : harmonyScore.score >= 40 ? "#a16207" : "#dc2626",
                }}>
                  {harmonyScore.score}%
                </span>
              </div>
              <span className="text-xs text-slate-600">Harmony</span>
            </div>
          )}

          {/* Space Efficiency */}
          {spaceEfficiency && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{
                backgroundColor: spaceEfficiency.efficiency >= 70 ? "#dbeafe" : spaceEfficiency.efficiency >= 40 ? "#fef3c7" : "#f1f5f9",
                borderColor: spaceEfficiency.efficiency >= 70 ? "#3b82f6" : spaceEfficiency.efficiency >= 40 ? "#f59e0b" : "#94a3b8",
              }}
              title={`${spaceEfficiency.plantCount} plants using ~${spaceEfficiency.plantedArea} sq in of ${spaceEfficiency.totalArea} sq in${spaceEfficiency.potentialAdditionalPlants > 0 ? `. Room for ~${spaceEfficiency.potentialAdditionalPlants} more plants` : ""}`}
            >
              <div className="flex items-center gap-1">
                <span className="text-lg">
                  {spaceEfficiency.efficiency >= 70 ? "🌱" : spaceEfficiency.efficiency >= 40 ? "🌿" : "📐"}
                </span>
                <span className="text-sm font-semibold" style={{
                  color: spaceEfficiency.efficiency >= 70 ? "#1d4ed8" : spaceEfficiency.efficiency >= 40 ? "#b45309" : "#475569",
                }}>
                  {spaceEfficiency.efficiency}%
                </span>
              </div>
              <span className="text-xs text-slate-600">Space Used</span>
              {spaceEfficiency.potentialAdditionalPlants > 0 && (
                <span className="text-xs text-slate-500 ml-1">
                  (+{spaceEfficiency.potentialAdditionalPlants} more)
                </span>
              )}
            </div>
          )}

          {/* Pollinator Stats */}
          {pollinatorStats && pollinatorStats.count > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-yellow-50 border-yellow-400"
              title={`Pollinator-friendly plants: ${pollinatorStats.plants.join(", ")}${pollinatorStats.types.length > 0 ? `. Attracts: ${pollinatorStats.types.join(", ")}` : ""}`}
            >
              <div className="flex items-center gap-1">
                <span className="text-lg">🐝</span>
                <span className="text-sm font-semibold text-yellow-700">
                  {pollinatorStats.count}
                </span>
              </div>
              <span className="text-xs text-yellow-700">
                Pollinator{pollinatorStats.count !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Water Zone Stats */}
          {waterZoneStats && (waterZoneStats.low > 0 || waterZoneStats.medium > 0 || waterZoneStats.high > 0) && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                waterZoneStats.hasConflict
                  ? "bg-orange-50 border-orange-400"
                  : "bg-blue-50 border-blue-300"
              }`}
              title={`Water needs: ${waterZoneStats.high} high, ${waterZoneStats.medium} medium, ${waterZoneStats.low} low${waterZoneStats.hasConflict ? " - Warning: mixed water needs!" : ""}`}
            >
              <span className="text-lg">💧</span>
              <div className="flex items-center gap-1 text-xs">
                {waterZoneStats.high > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white font-medium">
                    {waterZoneStats.high}H
                  </span>
                )}
                {waterZoneStats.medium > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-300 text-blue-900 font-medium">
                    {waterZoneStats.medium}M
                  </span>
                )}
                {waterZoneStats.low > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                    {waterZoneStats.low}L
                  </span>
                )}
              </div>
              {waterZoneStats.hasConflict && (
                <span className="text-xs text-orange-600 font-medium">Mixed!</span>
              )}
            </div>
          )}

          <Link className="text-sm underline" href="/beds">
            Back to beds
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr] overflow-hidden">
        {/* Plant Palette */}
        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-sm font-medium">Add plants to bed</p>

          {plants.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">No plants yet.</p>
              <Link className="text-sm underline" href="/plants">
                Go add plants →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search plants..."
                  value={plantSearch}
                  onChange={(e) => {
                    setPlantSearch(e.target.value);
                    setIsPlantDropdownOpen(true);
                  }}
                  onFocus={() => setIsPlantDropdownOpen(true)}
                  className="w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {plantSearch && (
                  <button
                    onClick={() => {
                      setPlantSearch("");
                      setIsPlantDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-800"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Click outside to close dropdown */}
              {isPlantDropdownOpen && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsPlantDropdownOpen(false)}
                />
              )}

              {/* Dropdown results */}
              {isPlantDropdownOpen && plantSearch && (
                <div className="relative z-20 border rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
                  {filteredPlants.length === 0 ? (
                    <p className="p-4 text-base text-gray-500">No plants found</p>
                  ) : (
                    filteredPlants.map((plant) => (
                      <button
                        key={plant.id}
                        onClick={() => {
                          setSelectedPlantForDrag(plant);
                          setPlantSearch("");
                          setIsPlantDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 min-h-[52px] hover:bg-slate-50 active:bg-slate-100 text-left border-b last:border-b-0 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-700 text-sm flex-shrink-0">
                          {plant.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-medium truncate">{plant.name}</p>
                          <p className="text-sm text-slate-500">{plant.spacingInches}&quot; spacing</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected plant to place */}
              {selectedPlantForDrag && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Click in bed or drag to place:</p>
                  <div className="relative">
                    <PlantCard
                      plant={selectedPlantForDrag}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onTouchStart={handleTouchStart}
                      isDragging={draggedPlant?.id === selectedPlantForDrag.id && !draggedPlacement}
                    />
                    <button
                      onClick={() => setSelectedPlantForDrag(null)}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-gray-500 active:bg-gray-600 active:scale-95 transition-all"
                      title="Clear selection"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {!selectedPlantForDrag && !isPlantDropdownOpen && (
                <p className="text-sm text-gray-500">
                  Search and select a plant to place in the bed
                </p>
              )}
            </div>
          )}

          <div className="rounded border p-2 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-900 font-medium">How to use:</p>
            <ul className="text-xs text-blue-800 mt-1 space-y-0.5 list-disc pl-4">
              <li>Search and select a plant above</li>
              <li>Click in bed to place (green zones show valid spots)</li>
              <li>Or drag the selected plant to bed</li>
              <li>Drag placed plants to reposition</li>
              <li>Hover plant and click X to delete</li>
              <li>Long-press on mobile to drag</li>
              <li>Click placed plants for details</li>
            </ul>
          </div>

          {message && <p className="text-sm text-red-600">{message}</p>}

          {/* Counts */}
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Plants in bed</p>
            {counts.size === 0 ? (
              <p className="text-sm text-gray-600">Nothing placed yet.</p>
            ) : (
              <ul className="mt-2 text-sm space-y-1">
                {Array.from(counts.entries()).map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between">
                    <span>
                      {name}: {count}
                    </span>
                    <button
                      onClick={() => deleteAllOfPlant(name)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      title={`Remove all ${name}`}
                    >
                      Remove all
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Companion Planting */}
          {(companionSuggestions.goodPairs.length > 0 ||
            companionSuggestions.badPairs.length > 0) && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Companion Planting</p>

              {companionSuggestions.badPairs.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-2">
                  <p className="text-xs font-medium text-rose-800 mb-1">Conflicts</p>
                  <ul className="text-xs text-rose-700 space-y-1">
                    {companionSuggestions.badPairs.map((pair, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{pair.plant1}</span> +{" "}
                        <span className="font-medium">{pair.plant2}</span>: {pair.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {companionSuggestions.goodPairs.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-2">
                  <p className="text-xs font-medium text-green-800 mb-1">Good Pairings</p>
                  <ul className="text-xs text-green-700 space-y-1">
                    {companionSuggestions.goodPairs.slice(0, 5).map((pair, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{pair.plant1}</span> +{" "}
                        <span className="font-medium">{pair.plant2}</span>: {pair.reason}
                      </li>
                    ))}
                    {companionSuggestions.goodPairs.length > 5 && (
                      <li className="text-green-600">
                        +{companionSuggestions.goodPairs.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Status Legend */}
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium mb-2">Status Colors</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-slate-300 border-2 border-slate-400" />
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-blue-300 border-2 border-blue-500" />
                <span>Seeds started</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-emerald-300 border-2 border-emerald-500" />
                <span>Growing</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-amber-300 border-2 border-amber-500" />
                <span>Harvesting</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-violet-300 border-2 border-purple-500" />
                <span>Complete</span>
              </div>
            </div>
          </div>

          {/* Crop Rotation History */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Crop Rotation History</p>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showHistory ? "Hide" : "Show"}
              </button>
            </div>

            {showHistory && (
              <div className="space-y-2">
                {historyYears.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No history yet. Archive completed harvests to track crop rotation.
                  </p>
                ) : (
                  <>
                    <select
                      value={selectedHistoryYear || ""}
                      onChange={(e) => setSelectedHistoryYear(Number(e.target.value))}
                      className="w-full text-sm rounded border border-slate-300 px-2 py-1"
                    >
                      {historyYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>

                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {history
                        .filter((h) => h.seasonYear === selectedHistoryYear)
                        .map((h) => (
                          <div
                            key={h.id}
                            className="text-xs p-2 rounded bg-slate-50 border border-slate-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{h.plantName}</span>
                              <span className="text-slate-500 capitalize">{h.seasonName}</span>
                            </div>
                            {h.plantType && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                {h.plantType}
                              </span>
                            )}
                            {h.harvestYield && (
                              <p className="text-slate-600 mt-1">
                                Yield: {h.harvestYield} {h.harvestYieldUnit}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 mt-2">
              Tip: Rotate plant families to prevent soil depletion and disease.
            </p>
          </div>
        </div>

        {/* Canvas */}
        <div className="rounded-lg border p-3 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-sm font-medium">
              Bed Layout
              {draggedPlant && (
                <span className="ml-2 text-emerald-600">
                  — {draggedPlacement ? "Moving" : "Placing"} {draggedPlant.name}
                </span>
              )}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Icon toggle */}
              <button
                onClick={() => setShowPlantIcons(!showPlantIcons)}
                className={`h-10 px-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
                  showPlantIcons
                    ? "bg-emerald-500 border-emerald-600 text-white"
                    : "hover:bg-gray-50 active:bg-gray-100"
                }`}
                title={showPlantIcons ? "Show text labels" : "Show plant icons"}
              >
                <span className="text-lg">{showPlantIcons ? "🍅" : "●"}</span>
                <span className="text-sm font-medium">{showPlantIcons ? "Icons On" : "Icons"}</span>
              </button>

              {/* Companion indicator toggle */}
              <button
                onClick={() => setShowCompanionIndicators(!showCompanionIndicators)}
                className={`h-10 px-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
                  showCompanionIndicators
                    ? "bg-purple-500 border-purple-600 text-white"
                    : "hover:bg-gray-50 active:bg-gray-100"
                }`}
                title={showCompanionIndicators ? "Hide companion indicators" : "Show companion indicators"}
              >
                <span className="text-lg">🤝</span>
                <span className="text-sm font-medium">{showCompanionIndicators ? "Companions" : "Companions"}</span>
              </button>

              {/* Height/shadow indicator toggle */}
              <button
                onClick={() => setShowHeightIndicators(!showHeightIndicators)}
                className={`h-10 px-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
                  showHeightIndicators
                    ? "bg-amber-500 border-amber-600 text-white"
                    : "hover:bg-gray-50 active:bg-gray-100"
                }`}
                title={showHeightIndicators ? "Hide height/shadow indicators" : "Show height/shadow warnings"}
              >
                <span className="text-lg">📏</span>
                <span className="text-sm font-medium">Heights</span>
              </button>

              {/* Pollinator indicator toggle */}
              <button
                onClick={() => setShowPollinatorIndicators(!showPollinatorIndicators)}
                className={`h-10 px-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
                  showPollinatorIndicators
                    ? "bg-yellow-500 border-yellow-600 text-white"
                    : "hover:bg-gray-50 active:bg-gray-100"
                }`}
                title={showPollinatorIndicators ? "Hide pollinator indicators" : "Show plants that attract pollinators"}
              >
                <span className="text-lg">🐝</span>
                <span className="text-sm font-medium">Pollinators</span>
              </button>

              {/* Water zone indicator toggle */}
              <button
                onClick={() => setShowWaterZoneIndicators(!showWaterZoneIndicators)}
                className={`h-10 px-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
                  showWaterZoneIndicators
                    ? "bg-blue-500 border-blue-600 text-white"
                    : "hover:bg-gray-50 active:bg-gray-100"
                }`}
                title={showWaterZoneIndicators ? "Hide water zone indicators" : "Show water needs by plant"}
              >
                <span className="text-lg">💧</span>
                <span className="text-sm font-medium">Water</span>
              </button>

              <span className="text-sm text-gray-600">{zoom.toFixed(1)}x</span>
              <div className="flex gap-2">
                <button
                  onClick={handleZoomOut}
                  className="w-10 h-10 text-lg border rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
                  title="Zoom out"
                >
                  −
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-4 h-10 text-sm border rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
                  title="Fit to screen"
                >
                  Fit
                </button>
                <button
                  onClick={handleZoomIn}
                  className="w-10 h-10 text-lg border rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
                  title="Zoom in"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Raised bed frame */}
          <div
            ref={containerRef}
            className="overflow-auto relative w-full"
            style={{
              height: `min(70vh, ${idealContainerHeight}px)`,
              minHeight: "150px",
              borderRadius: "12px",
              background: "linear-gradient(145deg, #8B7355 0%, #6B5344 50%, #5D4632 100%)",
              padding: "8px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Inner soil area */}
            <div
              className="w-full h-full overflow-auto rounded-lg relative flex items-center justify-center"
              style={{
                boxShadow: "inset 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
            <div
              ref={canvasRef}
              className={`relative ${isPanning ? "cursor-grabbing" : selectedPlantForDrag && hoverPosition ? "cursor-pointer" : "cursor-default"}`}
              style={{
                width: canvasWidth * zoom,
                height: canvasHeight * zoom,
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                background: `
                  radial-gradient(circle at 20% 30%, #5D4E37 0%, transparent 50%),
                  radial-gradient(circle at 80% 70%, #4A3F2E 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, #6B5B47 0%, transparent 70%),
                  linear-gradient(180deg, #5A4A3A 0%, #4D3F32 50%, #544436 100%)
                `,
                backgroundSize: "100% 100%",
              }}
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
              onDragLeave={handleCanvasDragLeave}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseEnter={handleCanvasMouseEnter}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={handleCanvasClick}
              onWheel={handleWheel}
            >
              {/* Grid dots overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                  backgroundSize: `${bed.cellInches * PIXELS_PER_INCH}px ${bed.cellInches * PIXELS_PER_INCH}px`,
                }}
              />

              {/* Open spots indicator (when not dragging) */}
              {!draggedPlant &&
                openSpots.map((spot, idx) => {
                  const displayPos = toDisplayCoords(spot.x, spot.y);
                  return (
                    <div
                      key={idx}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        left: displayPos.x * PIXELS_PER_INCH + (bed.cellInches * PIXELS_PER_INCH) / 2 - 4,
                        top: displayPos.y * PIXELS_PER_INCH + (bed.cellInches * PIXELS_PER_INCH) / 2 - 4,
                        width: 8,
                        height: 8,
                        backgroundColor: "rgba(134, 239, 172, 0.5)",
                        boxShadow: "0 0 6px rgba(74, 222, 128, 0.4)",
                      }}
                    />
                  );
                })}

              {/* Valid drop zones - show when dragging or when plant selected and hovering */}
              {(draggedPlant || (selectedPlantForDrag && isHoveringBed)) &&
                validDropZones.map((zone, idx) => {
                  const activePlant = draggedPlant || selectedPlantForDrag;
                  if (!activePlant) return null;
                  const displayPos = toDisplayCoords(zone.x, zone.y);
                  return (
                    <div
                      key={idx}
                      className="absolute rounded-full bg-emerald-400/30 border-2 border-emerald-300/60 border-dashed pointer-events-none transition-opacity duration-200"
                      style={{
                        left: displayPos.x * PIXELS_PER_INCH,
                        top: displayPos.y * PIXELS_PER_INCH,
                        width: activePlant.spacingInches * PIXELS_PER_INCH,
                        height: activePlant.spacingInches * PIXELS_PER_INCH,
                      }}
                    />
                  );
                })}

              {/* Drop/hover preview (snapped position) - shows when dragging OR when plant selected and hovering */}
              {((draggedPlant && dropPosition) || (selectedPlantForDrag && isHoveringBed && hoverPosition)) && (() => {
                const activePlant = draggedPlant || selectedPlantForDrag;
                const activePosition = dropPosition || hoverPosition;
                if (!activePlant || !activePosition) return null;

                const displayPos = toDisplayCoords(activePosition.x, activePosition.y);
                const previewSize = activePlant.spacingInches * PIXELS_PER_INCH;

                // Get companion status for the preview (virtual ID -1 for new placement, or actual ID for move)
                const previewId = draggedPlacement?.id ?? -1;
                const previewCompanion = companionStatus.get(previewId);
                const ringSize = Math.max(3, Math.min(6, previewSize / 12));
                let previewCompanionShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                let previewCompanionClass = "";

                if (showCompanionIndicators && previewCompanion) {
                  if (previewCompanion.hasGood && previewCompanion.hasBad) {
                    previewCompanionShadow = `0 0 0 ${ringSize}px #22c55e, 0 0 0 ${ringSize * 2}px #ef4444, 0 0 ${ringSize * 4}px ${ringSize * 2}px rgba(239, 68, 68, 0.6)`;
                    previewCompanionClass = "animate-pulse";
                  } else if (previewCompanion.hasBad) {
                    previewCompanionShadow = `0 0 0 ${ringSize}px #ef4444, 0 0 ${ringSize * 4}px ${ringSize * 2}px rgba(239, 68, 68, 0.7)`;
                    previewCompanionClass = "animate-pulse";
                  } else if (previewCompanion.hasGood) {
                    previewCompanionShadow = `0 0 0 ${ringSize}px #22c55e, 0 0 ${ringSize * 4}px ${ringSize * 2}px rgba(34, 197, 94, 0.7)`;
                  }
                }

                // Use slightly different styling for click-to-place preview vs drag preview
                const isClickMode = !draggedPlant && selectedPlantForDrag;

                return (
                  <div
                    className={`absolute rounded-full pointer-events-none flex items-center justify-center transition-all duration-150 ${previewCompanionClass} ${
                      isClickMode
                        ? "bg-emerald-400/50 border-2 border-emerald-400 cursor-pointer"
                        : "bg-emerald-400/70 border-3 border-emerald-300"
                    }`}
                    style={{
                      left: displayPos.x * PIXELS_PER_INCH,
                      top: displayPos.y * PIXELS_PER_INCH,
                      width: previewSize,
                      height: previewSize,
                      boxShadow: previewCompanionShadow,
                    }}
                  >
                    {showPlantIcons ? (() => {
                      const { icon, shortName, customType } = getPlantIconAndName(activePlant.name);
                      return (
                        <div className="flex flex-col items-center justify-center">
                          {customType ? (
                            <CustomPlantIcon type={customType} size={previewSize * 0.55} />
                          ) : (
                            <span
                              className="leading-none"
                              style={{
                                fontSize: previewSize * 0.5,
                              }}
                            >
                              {icon}
                            </span>
                          )}
                          <span
                            className="text-center leading-tight font-medium truncate w-full px-0.5 text-black"
                            style={{
                              fontSize: Math.max(6, Math.min(10, previewSize / 5)),
                            }}
                          >
                            {shortName}
                          </span>
                        </div>
                      );
                    })() : (
                      <span className="text-xs font-medium text-white text-center leading-tight drop-shadow">
                        {activePlant.name}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Existing placements as circles */}
              {placements.map((p) => {
                const size = (p.w ?? p.plant.spacingInches) * PIXELS_PER_INCH;
                const statusColor = getStatusColor(p);
                const bgColor = getStatusBgColor(p);
                const isBeingDragged = draggedPlacement?.id === p.id;
                const isRecentlyPlaced = recentlyPlaced === p.id;
                const displayPos = toDisplayCoords(p.x, p.y);
                const companion = companionStatus.get(p.id);

                // Build companion indicator styles - scale ring size based on plant size
                const ringSize = Math.max(3, Math.min(6, size / 12));
                let companionShadow = "";
                let companionClass = "";
                if (showCompanionIndicators && companion) {
                  if (companion.hasGood && companion.hasBad) {
                    // Both good and bad - split glow
                    companionShadow = `0 0 0 ${ringSize}px #22c55e, 0 0 0 ${ringSize * 2}px #ef4444, 0 0 ${ringSize * 4}px ${ringSize * 2}px rgba(239, 68, 68, 0.6)`;
                    companionClass = "animate-pulse";
                  } else if (companion.hasBad) {
                    // Only bad companions
                    companionShadow = `0 0 0 ${ringSize}px #ef4444, 0 0 ${ringSize * 4}px ${ringSize * 2}px rgba(239, 68, 68, 0.7)`;
                    companionClass = "animate-pulse";
                  } else if (companion.hasGood) {
                    // Only good companions
                    companionShadow = `0 0 0 ${ringSize}px #22c55e, 0 0 ${ringSize * 4}px ${ringSize * 2}px rgba(34, 197, 94, 0.7)`;
                  }
                }

                // Height/shadow warning data
                const shadowWarning = shadowWarnings.get(p.id);
                const heightCategory = getHeightCategory(p.plant.averageHeightInches);
                const hasShadeWarning = shadowWarning && (shadowWarning.shadedBy.length > 0 || shadowWarning.shades.length > 0);

                return (
                  <div
                    key={p.id}
                    className="absolute group"
                    style={{
                      left: displayPos.x * PIXELS_PER_INCH,
                      top: displayPos.y * PIXELS_PER_INCH,
                      width: size,
                      height: size,
                    }}
                  >
                    <button
                      draggable
                      onDragStart={(e) => handlePlacementDragStart(p, e)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handlePlacementTouchStart(p, e)}
                      className={`w-full h-full rounded-full border-2 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-all duration-300 ${
                        isBeingDragged
                          ? "opacity-30 scale-90"
                          : isRecentlyPlaced
                          ? "scale-110 ring-4 ring-emerald-400 ring-opacity-50"
                          : "hover:scale-105"
                      } ${companionClass}`}
                      style={{
                        borderColor: statusColor,
                        backgroundColor: bgColor,
                        boxShadow: companionShadow || undefined,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isBeingDragged) {
                          centerOnPlacement(p);
                          setSelectedPlacementId(p.id);
                        }
                      }}
                      title={`${p.plant.name}${
                        showCompanionIndicators && companion
                          ? (companion.hasGood ? `\n✓ Good with: ${companion.goodWith.join(", ")}` : "") +
                            (companion.hasBad ? `\n✗ Bad with: ${companion.badWith.join(", ")}` : "")
                          : ""
                      } - Drag to move, click for details`}
                    >
                      {showPlantIcons ? (() => {
                        const { icon, shortName, customType } = getPlantIconAndName(p.plant.name);
                        return (
                          <div className="flex flex-col items-center justify-center">
                            {customType ? (
                              <CustomPlantIcon type={customType} size={size * 0.55} />
                            ) : (
                              <span
                                className="leading-none"
                                style={{
                                  fontSize: size * 0.5, // Icon takes ~50% for room for name
                                }}
                              >
                                {icon}
                              </span>
                            )}
                            <span
                              className="text-center leading-tight font-medium truncate w-full px-0.5 text-black"
                              style={{
                                fontSize: Math.max(6, Math.min(10, size / 5)),
                              }}
                            >
                              {shortName}
                            </span>
                          </div>
                        );
                      })() : (
                        <span
                          className="text-center leading-tight font-medium truncate px-1"
                          style={{
                            fontSize: Math.max(8, Math.min(12, size / 4)),
                            color: statusColor,
                          }}
                        >
                          {p.plant.name}
                        </span>
                      )}
                    </button>
                    {/* Delete button - visible on mobile, hover-show on desktop */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove ${p.plant.name} from this bed?`)) {
                          deletePlacement(p.id);
                        }
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shadow-md opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-600 active:bg-red-700 active:scale-95 transition-all z-10"
                      title={`Remove ${p.plant.name}`}
                    >
                      ×
                    </button>

                    {/* Height indicator badge */}
                    {showHeightIndicators && (
                      <div
                        className={`absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold shadow-sm flex items-center gap-0.5 ${
                          heightCategory === "tall"
                            ? "bg-amber-500 text-white"
                            : heightCategory === "medium"
                            ? "bg-yellow-400 text-yellow-900"
                            : heightCategory === "short"
                            ? "bg-green-400 text-green-900"
                            : "bg-gray-300 text-gray-600"
                        }`}
                        title={`Height: ${p.plant.averageHeightInches ? `${Math.round(p.plant.averageHeightInches)}"` : "Unknown"}`}
                      >
                        {heightCategory === "tall" ? "↑↑" : heightCategory === "medium" ? "↑" : heightCategory === "short" ? "↓" : "?"}
                      </div>
                    )}

                    {/* Shadow warning indicator */}
                    {showHeightIndicators && hasShadeWarning && (
                      <div
                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs shadow-sm animate-pulse"
                        title={
                          shadowWarning?.shadedBy.length
                            ? `May be shaded by: ${shadowWarning.shadedBy.join(", ")}`
                            : `May shade: ${shadowWarning?.shades.join(", ")}`
                        }
                      >
                        ☀️
                      </div>
                    )}

                    {/* Pollinator indicator badge */}
                    {showPollinatorIndicators && p.plant.attractsPollinators && (
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center text-xs shadow-sm"
                        title={`Attracts: ${p.plant.pollinatorTypes || "pollinators"}`}
                      >
                        🐝
                      </div>
                    )}

                    {/* Water zone indicator badge */}
                    {showWaterZoneIndicators && p.plant.waterZone && (
                      <div
                        className={`absolute -bottom-1 ${showPollinatorIndicators && p.plant.attractsPollinators ? "right-5" : "-right-1"} px-1.5 py-0.5 rounded-full text-[8px] font-bold shadow-sm ${
                          p.plant.waterZone === "high"
                            ? "bg-blue-500 text-white"
                            : p.plant.waterZone === "medium"
                            ? "bg-blue-300 text-blue-900"
                            : "bg-blue-100 text-blue-700"
                        }`}
                        title={`Water needs: ${p.plant.waterZone}`}
                      >
                        {p.plant.waterZone === "high" ? "💧💧" : p.plant.waterZone === "medium" ? "💧" : "·"}
                      </div>
                    )}

                    {/* Succession number badge */}
                    {p.successionNumber && (
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-500 text-white shadow-sm"
                        title={`Succession sowing #${p.successionNumber}`}
                      >
                        #{p.successionNumber}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Touch drag indicator */}
              {isTouchDragging && touchPosition && draggedPlant && (
                <div
                  className="fixed rounded-full bg-emerald-400/80 border-2 border-emerald-600 pointer-events-none flex items-center justify-center shadow-xl z-50 animate-pulse"
                  style={{
                    width: 60,
                    height: 60,
                    left: touchPosition.x * PIXELS_PER_INCH + panOffset.x - 30,
                    top: touchPosition.y * PIXELS_PER_INCH + panOffset.y - 30,
                  }}
                >
                  {showPlantIcons ? (() => {
                    const { icon, customType } = getPlantIconAndName(draggedPlant.name);
                    return customType ? (
                      <CustomPlantIcon type={customType} size={50} />
                    ) : (
                      <span style={{ fontSize: 42 }}>{icon}</span>
                    );
                  })() : (
                    <span className="text-xs font-medium text-emerald-900">
                      {draggedPlant.name.charAt(0)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mini-map */}
            <MiniMap
              bed={bed}
              placements={placements}
              zoom={zoom}
              panOffset={panOffset}
              containerSize={containerSize}
              canvasSize={{ width: canvasWidth, height: canvasHeight }}
              onNavigate={handleMiniMapNavigate}
              shouldRotate={shouldRotate}
            />
            </div>
          </div>

          {draggedPlant && (
            <p className="mt-2 text-xs text-emerald-600">
              {draggedPlacement ? "Drop" : "Place"} {draggedPlant.name} on a highlighted zone
            </p>
          )}
        </div>
      </div>

      {/* Placement tracking modal */}
      <PlacementTrackingModal
        isOpen={!!selectedPlacementId}
        placementId={selectedPlacementId}
        onClose={() => setSelectedPlacementId(null)}
        onSave={() => {
          setSelectedPlacementId(null);
          refresh();
        }}
      />

      {/* Companion planting alert */}
      {companionAlert && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-white rounded-lg shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b">
              <span className="font-medium text-sm">
                Companion Info for {companionAlert.plantName}
              </span>
              <button
                onClick={() => setCompanionAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {companionAlert.badPairs.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                    <span>⚠️</span> Avoid planting near:
                  </p>
                  <ul className="text-xs text-rose-600 space-y-1 pl-5">
                    {companionAlert.badPairs.map((pair, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{pair.plant}</span>
                        <span className="text-rose-500"> — {pair.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {companionAlert.goodPairs.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <span>✓</span> Good companions:
                  </p>
                  <ul className="text-xs text-emerald-600 space-y-1 pl-5">
                    {companionAlert.goodPairs.map((pair, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{pair.plant}</span>
                        <span className="text-emerald-500"> — {pair.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {companionAlert.goodPairs.length === 0 && companionAlert.badPairs.length === 0 && (
                <p className="text-xs text-slate-500">No known companion relationships.</p>
              )}
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t">
              <button
                onClick={() => setCompanionAlert(null)}
                className="w-full text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo delete toast */}
      {deletedPlacement && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-slate-800 text-white rounded-lg shadow-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">
                Removed {deletedPlacement.placement.plant.name}
              </p>
              <p className="text-xs text-slate-300">
                Click undo to restore
              </p>
            </div>
            <button
              onClick={undoDelete}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors"
            >
              Undo
            </button>
            <button
              onClick={clearUndoTimer}
              className="text-slate-400 hover:text-white text-lg leading-none ml-1"
              title="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
