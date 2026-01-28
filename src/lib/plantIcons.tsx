// Custom SVG icons for plants without good emoji matches
export function CustomPlantIcon({ type, size }: { type: string; size: number }) {
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
export const customIconTypes: { keywords: string[]; type: string; shortName: string }[] = [
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
export const plantIconMap: { keywords: string[]; icon: string; shortName: string }[] = [
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

export function getPlantIconAndName(plantName: string): { icon: string; shortName: string; customType?: string } {
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

export function getPlantIcon(plantName: string): string {
  const result = getPlantIconAndName(plantName);
  return result.customType ? "🌸" : result.icon;
}
