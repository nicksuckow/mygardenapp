// Companion planting data - common garden vegetables and their relationships
// Sources: Various gardening guides, university extension services

export type CompanionRelation = {
  companion: string;
  type: "good" | "bad";
  reason: string;
};

export type PlantCompanions = {
  name: string;
  aliases: string[]; // alternative names to match
  goodCompanions: { name: string; reason: string }[];
  badCompanions: { name: string; reason: string }[];
};

// Normalize plant names for matching
export function normalizePlantName(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, ""); // Remove trailing 's' for plurals
}

// Check if a plant name matches a base name (fuzzy matching)
// e.g., "Abraham Lincoln Tomato" should match "tomato"
function fuzzyMatchPlantName(plantName: string, baseName: string): boolean {
  const normalizedPlant = normalizePlantName(plantName);
  const normalizedBase = normalizePlantName(baseName);

  // Exact match
  if (normalizedPlant === normalizedBase) return true;

  // Plant name contains the base name (e.g., "cherry tomato" contains "tomato")
  if (normalizedPlant.includes(normalizedBase)) return true;

  // Check individual words in the plant name
  const plantWords = normalizedPlant.split(/\s+/);
  if (plantWords.some(word => word === normalizedBase)) return true;

  return false;
}

// Common companion planting relationships
export const companionData: PlantCompanions[] = [
  {
    name: "tomato",
    aliases: ["tomatoes"],
    goodCompanions: [
      { name: "basil", reason: "Repels pests and improves flavor" },
      { name: "carrot", reason: "Loosens soil for tomato roots" },
      { name: "parsley", reason: "Attracts beneficial insects" },
      { name: "marigold", reason: "Repels nematodes and aphids" },
      { name: "borage", reason: "Repels tomato hornworm" },
      { name: "chive", reason: "Repels aphids" },
      { name: "garlic", reason: "Repels spider mites" },
      { name: "lettuce", reason: "Good ground cover, benefits from shade" },
      { name: "spinach", reason: "Benefits from partial shade" },
      { name: "pepper", reason: "Similar growing requirements" },
    ],
    badCompanions: [
      { name: "cabbage", reason: "Compete for nutrients" },
      { name: "broccoli", reason: "Compete for nutrients" },
      { name: "cauliflower", reason: "Compete for nutrients" },
      { name: "corn", reason: "Both attract tomato hornworm" },
      { name: "fennel", reason: "Inhibits tomato growth" },
      { name: "kohlrabi", reason: "Stunts tomato growth" },
      { name: "walnut", reason: "Releases growth inhibitor" },
      { name: "dill", reason: "Mature dill inhibits tomato growth" },
    ],
  },
  {
    name: "pepper",
    aliases: ["peppers", "bell pepper", "hot pepper", "chili"],
    goodCompanions: [
      { name: "tomato", reason: "Similar growing requirements" },
      { name: "basil", reason: "Repels pests and improves flavor" },
      { name: "carrot", reason: "Loosens soil" },
      { name: "onion", reason: "Repels pests" },
      { name: "spinach", reason: "Good ground cover" },
      { name: "parsley", reason: "Attracts beneficial insects" },
    ],
    badCompanions: [
      { name: "fennel", reason: "Inhibits growth" },
      { name: "kohlrabi", reason: "Stunts growth" },
      { name: "bean", reason: "Nitrogen can reduce pepper yield" },
    ],
  },
  {
    name: "carrot",
    aliases: ["carrots"],
    goodCompanions: [
      { name: "tomato", reason: "Shade helps carrots in summer" },
      { name: "onion", reason: "Repels carrot fly" },
      { name: "leek", reason: "Repels carrot fly" },
      { name: "rosemary", reason: "Repels carrot fly" },
      { name: "sage", reason: "Repels carrot fly" },
      { name: "lettuce", reason: "Quick harvest before carrots mature" },
      { name: "radish", reason: "Marks rows and loosens soil" },
      { name: "chive", reason: "Repels aphids" },
    ],
    badCompanions: [
      { name: "dill", reason: "Can stunt carrot growth" },
      { name: "parsnip", reason: "Compete for space and attract same pests" },
      { name: "celery", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "lettuce",
    aliases: ["lettuces", "salad"],
    goodCompanions: [
      { name: "carrot", reason: "Different root depths" },
      { name: "radish", reason: "Quick harvest companion" },
      { name: "strawberry", reason: "Good companions" },
      { name: "chive", reason: "Repels aphids" },
      { name: "garlic", reason: "Repels aphids" },
      { name: "onion", reason: "Repels pests" },
      { name: "bean", reason: "Provides nitrogen" },
      { name: "pea", reason: "Provides nitrogen and light shade" },
    ],
    badCompanions: [
      { name: "celery", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "cucumber",
    aliases: ["cucumbers"],
    goodCompanions: [
      { name: "bean", reason: "Provides nitrogen" },
      { name: "pea", reason: "Provides nitrogen" },
      { name: "corn", reason: "Provides support and shade" },
      { name: "sunflower", reason: "Attracts pollinators" },
      { name: "radish", reason: "Deters cucumber beetles" },
      { name: "dill", reason: "Attracts beneficial insects" },
      { name: "lettuce", reason: "Good ground cover" },
      { name: "marigold", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "potato", reason: "Compete for nutrients and space" },
      { name: "melon", reason: "Can cross-pollinate and share diseases" },
      { name: "sage", reason: "Inhibits growth" },
    ],
  },
  {
    name: "squash",
    aliases: ["squashes", "zucchini", "pumpkin"],
    goodCompanions: [
      { name: "corn", reason: "Three sisters planting" },
      { name: "bean", reason: "Three sisters planting, provides nitrogen" },
      { name: "radish", reason: "Deters squash beetles" },
      { name: "marigold", reason: "Repels pests" },
      { name: "nasturtium", reason: "Trap crop for aphids" },
      { name: "borage", reason: "Attracts pollinators" },
    ],
    badCompanions: [
      { name: "potato", reason: "Compete for space and nutrients" },
    ],
  },
  {
    name: "bean",
    aliases: ["beans", "green bean", "pole bean", "bush bean"],
    goodCompanions: [
      { name: "corn", reason: "Provides support, beans fix nitrogen" },
      { name: "squash", reason: "Three sisters planting" },
      { name: "cucumber", reason: "Beans fix nitrogen" },
      { name: "carrot", reason: "Different root depths" },
      { name: "cabbage", reason: "Beans fix nitrogen" },
      { name: "lettuce", reason: "Beans provide light shade" },
      { name: "radish", reason: "Quick harvest companion" },
      { name: "marigold", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "onion", reason: "Onions stunt bean growth" },
      { name: "garlic", reason: "Stunts bean growth" },
      { name: "pepper", reason: "Nitrogen can reduce pepper yield" },
      { name: "fennel", reason: "Inhibits growth" },
    ],
  },
  {
    name: "pea",
    aliases: ["peas", "snap pea", "snow pea"],
    goodCompanions: [
      { name: "carrot", reason: "Peas fix nitrogen" },
      { name: "corn", reason: "Peas fix nitrogen" },
      { name: "cucumber", reason: "Peas fix nitrogen" },
      { name: "radish", reason: "Quick harvest companion" },
      { name: "spinach", reason: "Cool weather companions" },
      { name: "lettuce", reason: "Cool weather companions" },
      { name: "turnip", reason: "Different root depths" },
    ],
    badCompanions: [
      { name: "onion", reason: "Stunts pea growth" },
      { name: "garlic", reason: "Stunts pea growth" },
    ],
  },
  {
    name: "corn",
    aliases: ["sweet corn", "maize"],
    goodCompanions: [
      { name: "bean", reason: "Three sisters - beans fix nitrogen" },
      { name: "squash", reason: "Three sisters - squash shades ground" },
      { name: "pea", reason: "Peas fix nitrogen" },
      { name: "cucumber", reason: "Provides support" },
      { name: "melon", reason: "Good ground cover" },
      { name: "pumpkin", reason: "Three sisters variation" },
    ],
    badCompanions: [
      { name: "tomato", reason: "Both attract corn earworm" },
    ],
  },
  {
    name: "cabbage",
    aliases: ["cabbages"],
    goodCompanions: [
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "celery", reason: "Repels cabbage moth" },
      { name: "dill", reason: "Attracts beneficial wasps" },
      { name: "onion", reason: "Repels cabbage pests" },
      { name: "garlic", reason: "Repels cabbage pests" },
      { name: "thyme", reason: "Repels cabbage worm" },
      { name: "rosemary", reason: "Repels cabbage moth" },
      { name: "sage", reason: "Repels cabbage moth" },
    ],
    badCompanions: [
      { name: "tomato", reason: "Compete for nutrients" },
      { name: "strawberry", reason: "Attract same pests" },
      { name: "grape", reason: "Inhibits growth" },
    ],
  },
  {
    name: "broccoli",
    aliases: [],
    goodCompanions: [
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "celery", reason: "Repels cabbage moth" },
      { name: "onion", reason: "Repels pests" },
      { name: "garlic", reason: "Repels pests" },
      { name: "rosemary", reason: "Repels cabbage moth" },
      { name: "dill", reason: "Attracts beneficial insects" },
      { name: "chamomile", reason: "Improves flavor" },
    ],
    badCompanions: [
      { name: "tomato", reason: "Compete for nutrients" },
      { name: "strawberry", reason: "Both heavy feeders" },
    ],
  },
  {
    name: "onion",
    aliases: ["onions"],
    goodCompanions: [
      { name: "carrot", reason: "Repels carrot fly" },
      { name: "lettuce", reason: "Good space utilization" },
      { name: "cabbage", reason: "Repels cabbage pests" },
      { name: "broccoli", reason: "Repels pests" },
      { name: "tomato", reason: "Repels pests" },
      { name: "pepper", reason: "Repels pests" },
      { name: "strawberry", reason: "Repels pests" },
      { name: "beet", reason: "Good companions" },
    ],
    badCompanions: [
      { name: "bean", reason: "Stunts bean growth" },
      { name: "pea", reason: "Stunts pea growth" },
      { name: "asparagus", reason: "Compete for space" },
    ],
  },
  {
    name: "garlic",
    aliases: [],
    goodCompanions: [
      { name: "tomato", reason: "Repels spider mites" },
      { name: "pepper", reason: "Repels pests" },
      { name: "cabbage", reason: "Repels cabbage pests" },
      { name: "carrot", reason: "Repels carrot fly" },
      { name: "rose", reason: "Repels aphids" },
      { name: "fruit tree", reason: "Repels borers" },
    ],
    badCompanions: [
      { name: "bean", reason: "Stunts bean growth" },
      { name: "pea", reason: "Stunts pea growth" },
      { name: "asparagus", reason: "Stunts growth" },
    ],
  },
  {
    name: "basil",
    aliases: [],
    goodCompanions: [
      { name: "tomato", reason: "Repels pests and improves flavor" },
      { name: "pepper", reason: "Repels pests" },
      { name: "oregano", reason: "Good herb companions" },
      { name: "asparagus", reason: "Repels asparagus beetle" },
    ],
    badCompanions: [
      { name: "sage", reason: "Different water needs" },
      { name: "rue", reason: "Inhibits basil growth" },
    ],
  },
  {
    name: "strawberry",
    aliases: ["strawberries"],
    goodCompanions: [
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "lettuce", reason: "Good ground cover" },
      { name: "spinach", reason: "Good ground cover" },
      { name: "onion", reason: "Repels pests" },
      { name: "thyme", reason: "Repels pests" },
      { name: "borage", reason: "Attracts pollinators" },
    ],
    badCompanions: [
      { name: "cabbage", reason: "Attract same pests" },
      { name: "broccoli", reason: "Both heavy feeders" },
      { name: "cauliflower", reason: "Both heavy feeders" },
    ],
  },
  {
    name: "radish",
    aliases: ["radishes"],
    goodCompanions: [
      { name: "carrot", reason: "Marks rows and loosens soil" },
      { name: "lettuce", reason: "Quick harvest companions" },
      { name: "cucumber", reason: "Deters cucumber beetles" },
      { name: "squash", reason: "Deters squash beetles" },
      { name: "bean", reason: "Quick harvest companion" },
      { name: "pea", reason: "Quick harvest companion" },
      { name: "spinach", reason: "Cool weather companions" },
    ],
    badCompanions: [
      { name: "hyssop", reason: "Inhibits growth" },
    ],
  },
  {
    name: "spinach",
    aliases: [],
    goodCompanions: [
      { name: "strawberry", reason: "Good ground cover" },
      { name: "pea", reason: "Cool weather companions" },
      { name: "bean", reason: "Beans provide light shade" },
      { name: "cabbage", reason: "Both cool weather crops" },
      { name: "radish", reason: "Quick harvest companion" },
      { name: "cauliflower", reason: "Good companions" },
    ],
    badCompanions: [],
  },
  {
    name: "beet",
    aliases: ["beets", "beetroot"],
    goodCompanions: [
      { name: "onion", reason: "Good companions" },
      { name: "garlic", reason: "Repels pests" },
      { name: "lettuce", reason: "Different root depths" },
      { name: "cabbage", reason: "Good companions" },
      { name: "broccoli", reason: "Good companions" },
      { name: "kohlrabi", reason: "Good companions" },
    ],
    badCompanions: [
      { name: "pole bean", reason: "Stunts growth" },
    ],
  },
];

// Find companion info for a plant (with fuzzy matching)
export function findPlantCompanions(plantName: string): PlantCompanions | undefined {
  // First try exact match
  const exactMatch = companionData.find(
    (p) => normalizePlantName(p.name) === normalizePlantName(plantName) ||
           p.aliases.some((a) => normalizePlantName(a) === normalizePlantName(plantName))
  );
  if (exactMatch) return exactMatch;

  // Then try fuzzy matching (e.g., "Abraham Lincoln Tomato" -> "tomato")
  return companionData.find(
    (p) => fuzzyMatchPlantName(plantName, p.name) ||
           p.aliases.some((a) => fuzzyMatchPlantName(plantName, a))
  );
}

// Check if two plants are compatible (with fuzzy matching)
export function checkCompatibility(
  plant1Name: string,
  plant2Name: string
): { type: "good" | "bad" | "neutral"; reason: string } {
  const plant1 = findPlantCompanions(plant1Name);
  const plant2 = findPlantCompanions(plant2Name);

  // Check if plant1 has plant2 as a companion (using fuzzy matching)
  if (plant1) {
    const goodMatch = plant1.goodCompanions.find(
      (c) => fuzzyMatchPlantName(plant2Name, c.name)
    );
    if (goodMatch) {
      return { type: "good", reason: goodMatch.reason };
    }

    const badMatch = plant1.badCompanions.find(
      (c) => fuzzyMatchPlantName(plant2Name, c.name)
    );
    if (badMatch) {
      return { type: "bad", reason: badMatch.reason };
    }
  }

  // Check if plant2 has plant1 as a companion (using fuzzy matching)
  if (plant2) {
    const goodMatch = plant2.goodCompanions.find(
      (c) => fuzzyMatchPlantName(plant1Name, c.name)
    );
    if (goodMatch) {
      return { type: "good", reason: goodMatch.reason };
    }

    const badMatch = plant2.badCompanions.find(
      (c) => fuzzyMatchPlantName(plant1Name, c.name)
    );
    if (badMatch) {
      return { type: "bad", reason: badMatch.reason };
    }
  }

  return { type: "neutral", reason: "No known interaction" };
}

// Get all companion suggestions for a list of plants
export function getCompanionSuggestions(plantNames: string[]): {
  goodPairs: { plant1: string; plant2: string; reason: string }[];
  badPairs: { plant1: string; plant2: string; reason: string }[];
} {
  const goodPairs: { plant1: string; plant2: string; reason: string }[] = [];
  const badPairs: { plant1: string; plant2: string; reason: string }[] = [];

  for (let i = 0; i < plantNames.length; i++) {
    for (let j = i + 1; j < plantNames.length; j++) {
      const result = checkCompatibility(plantNames[i], plantNames[j]);
      if (result.type === "good") {
        goodPairs.push({ plant1: plantNames[i], plant2: plantNames[j], reason: result.reason });
      } else if (result.type === "bad") {
        badPairs.push({ plant1: plantNames[i], plant2: plantNames[j], reason: result.reason });
      }
    }
  }

  return { goodPairs, badPairs };
}
