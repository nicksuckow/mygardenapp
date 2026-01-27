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
// Data merged from multiple sources including Wikipedia companion planting dataset
export const companionData: PlantCompanions[] = [
  {
    name: "tomato",
    aliases: ["tomatoes"],
    goodCompanions: [
      { name: "basil", reason: "Repels pests and improves flavor - plant 10\" apart for 20% yield increase" },
      { name: "carrot", reason: "Loosens soil for tomato roots" },
      { name: "parsley", reason: "Attracts beneficial insects" },
      { name: "marigold", reason: "Repels nematodes and aphids" },
      { name: "borage", reason: "Repels tomato hornworm" },
      { name: "chive", reason: "Repels aphids" },
      { name: "garlic", reason: "Repels spider mites" },
      { name: "lettuce", reason: "Good ground cover, benefits from shade" },
      { name: "spinach", reason: "Benefits from partial shade" },
      { name: "pepper", reason: "Similar growing requirements" },
      { name: "asparagus", reason: "Tomatoes repel asparagus beetle" },
      { name: "celery", reason: "Good companion" },
      { name: "bee balm", reason: "Attracts pollinators" },
      { name: "nasturtium", reason: "Trap crop for aphids" },
      { name: "oregano", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "cabbage", reason: "Compete for nutrients" },
      { name: "broccoli", reason: "Compete for nutrients" },
      { name: "cauliflower", reason: "Compete for nutrients" },
      { name: "corn", reason: "Both attract corn earworm/tomato hornworm" },
      { name: "fennel", reason: "Inhibits tomato growth" },
      { name: "kohlrabi", reason: "Stunts tomato growth" },
      { name: "walnut", reason: "Releases juglone growth inhibitor" },
      { name: "dill", reason: "Attracts tomato hornworm when mature" },
      { name: "potato", reason: "Share diseases and pests" },
      { name: "brassica", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "pepper",
    aliases: ["peppers", "bell pepper", "hot pepper", "chili", "capsicum"],
    goodCompanions: [
      { name: "tomato", reason: "Similar growing requirements" },
      { name: "basil", reason: "Repels pests and provides humidity peppers like" },
      { name: "carrot", reason: "Loosens soil" },
      { name: "onion", reason: "Repels pests" },
      { name: "spinach", reason: "Good ground cover" },
      { name: "parsley", reason: "Attracts beneficial insects" },
      { name: "marjoram", reason: "Provides humidity peppers like" },
      { name: "okra", reason: "Similar growing requirements" },
      { name: "geranium", reason: "Repels pests" },
      { name: "petunia", reason: "Repels aphids" },
      { name: "sunflower", reason: "Attracts pollinators" },
      { name: "eggplant", reason: "Similar growing requirements" },
    ],
    badCompanions: [
      { name: "fennel", reason: "Inhibits growth" },
      { name: "kohlrabi", reason: "Stunts growth" },
      { name: "bean", reason: "Nitrogen can reduce pepper yield" },
      { name: "kale", reason: "Brassicas compete for nutrients" },
      { name: "cabbage", reason: "Brassicas compete for nutrients" },
      { name: "brussels sprouts", reason: "Brassicas compete for nutrients" },
    ],
  },
  {
    name: "carrot",
    aliases: ["carrots"],
    goodCompanions: [
      { name: "tomato", reason: "Shade helps carrots in summer (may stunt carrots slightly)" },
      { name: "onion", reason: "Repels carrot fly" },
      { name: "leek", reason: "Leeks repel carrot fly, carrots repel leek moth" },
      { name: "rosemary", reason: "Repels carrot fly" },
      { name: "sage", reason: "Repels carrot fly" },
      { name: "lettuce", reason: "Quick harvest before carrots mature" },
      { name: "radish", reason: "Marks rows and loosens soil" },
      { name: "chive", reason: "Repels aphids and carrot fly" },
      { name: "bean", reason: "Different root depths" },
      { name: "shallot", reason: "Repels carrot fly" },
      { name: "wormwood", reason: "Repels carrot fly" },
      { name: "flax", reason: "Good companion" },
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
      { name: "radish", reason: "Sow 2-3 seeds with cucumbers to repel cucumber beetles" },
      { name: "dill", reason: "Attracts beneficial insects" },
      { name: "lettuce", reason: "Good ground cover" },
      { name: "marigold", reason: "Repels pests" },
      { name: "nasturtium", reason: "Trap crop for aphids" },
      { name: "kohlrabi", reason: "Good companions" },
      { name: "beet", reason: "Different root depths" },
      { name: "carrot", reason: "Different root depths" },
      { name: "onion", reason: "Repels pests" },
      { name: "garlic", reason: "Repels pests" },
      { name: "chamomile", reason: "Attracts beneficial insects" },
      { name: "amaranth", reason: "Reduces cucumber beetles by 75%" },
      { name: "celery", reason: "Good companion" },
    ],
    badCompanions: [
      { name: "potato", reason: "Compete for nutrients and space" },
      { name: "melon", reason: "Can cross-pollinate and share diseases" },
      { name: "sage", reason: "Inhibits growth" },
      { name: "aromatic herb", reason: "Strong scents may inhibit growth" },
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
    aliases: ["beans", "green bean", "pole bean", "bush bean", "snap bean", "string bean"],
    goodCompanions: [
      { name: "corn", reason: "Three sisters - corn provides support, beans fix nitrogen" },
      { name: "squash", reason: "Three sisters planting" },
      { name: "cucumber", reason: "Beans fix nitrogen" },
      { name: "carrot", reason: "Different root depths" },
      { name: "cabbage", reason: "Beans fix nitrogen" },
      { name: "lettuce", reason: "Beans provide light shade" },
      { name: "radish", reason: "Quick harvest companion" },
      { name: "marigold", reason: "Repels pests" },
      { name: "celery", reason: "Good companions" },
      { name: "strawberry", reason: "Good companions" },
      { name: "potato", reason: "Beans fix nitrogen, potatoes repel Mexican bean beetle" },
      { name: "eggplant", reason: "Beans fix nitrogen" },
    ],
    badCompanions: [
      { name: "onion", reason: "Onions stunt bean growth" },
      { name: "garlic", reason: "Stunts bean growth" },
      { name: "pepper", reason: "Nitrogen can reduce pepper yield" },
      { name: "fennel", reason: "Inhibits growth" },
      { name: "sunflower", reason: "Compete for nutrients (pole beans)" },
      { name: "beet", reason: "Pole beans stunt beet growth" },
      { name: "kohlrabi", reason: "Stunts growth (pole beans)" },
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
      { name: "cucumber", reason: "Repels pests" },
      { name: "dill", reason: "Attracts beneficial insects" },
      { name: "marigold", reason: "Repels pests" },
      { name: "chamomile", reason: "Improves flavor" },
      { name: "summer savory", reason: "Good companions" },
    ],
    badCompanions: [
      { name: "bean", reason: "Stunts bean growth" },
      { name: "pea", reason: "Stunts pea growth" },
      { name: "asparagus", reason: "Compete for space" },
      { name: "lentil", reason: "Stunts growth" },
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
      { name: "bush bean", reason: "Good companions" },
      { name: "catnip", reason: "Repels pests" },
      { name: "mint", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "pole bean", reason: "Stunts growth" },
      { name: "runner bean", reason: "Stunts growth" },
    ],
  },
  {
    name: "asparagus",
    aliases: [],
    goodCompanions: [
      { name: "tomato", reason: "Tomatoes repel asparagus beetle" },
      { name: "parsley", reason: "Good companions" },
      { name: "basil", reason: "Attracts ladybugs together" },
      { name: "marigold", reason: "Repels pests" },
      { name: "nasturtium", reason: "Trap crop for aphids" },
      { name: "dill", reason: "Attracts beneficial insects" },
      { name: "coriander", reason: "Attracts beneficial insects" },
      { name: "comfrey", reason: "Accumulates nutrients" },
    ],
    badCompanions: [
      { name: "onion", reason: "Compete for space" },
      { name: "garlic", reason: "Stunts asparagus growth" },
      { name: "potato", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "brussels sprouts",
    aliases: ["brussels sprout", "brussel sprouts"],
    goodCompanions: [
      { name: "sage", reason: "Repels cabbage moth" },
      { name: "thyme", reason: "Repels cabbage worm" },
      { name: "clover", reason: "Fixes nitrogen" },
      { name: "dill", reason: "Attracts beneficial wasps" },
      { name: "marigold", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "strawberry", reason: "Attract same pests" },
      { name: "tomato", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "cauliflower",
    aliases: [],
    goodCompanions: [
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "celery", reason: "Repels cabbage moth" },
      { name: "spinach", reason: "Mutually beneficial at 60cm spacing" },
      { name: "pea", reason: "Peas fix nitrogen" },
      { name: "marigold", reason: "Repels pests" },
      { name: "sunflower", reason: "Attracts pollinators" },
    ],
    badCompanions: [
      { name: "tomato", reason: "Compete for nutrients" },
      { name: "strawberry", reason: "Both heavy feeders" },
    ],
  },
  {
    name: "celery",
    aliases: [],
    goodCompanions: [
      { name: "bean", reason: "Good companions" },
      { name: "cabbage", reason: "Celery repels cabbage moth" },
      { name: "broccoli", reason: "Celery repels cabbage moth" },
      { name: "cauliflower", reason: "Celery repels cabbage moth" },
      { name: "leek", reason: "Good companions" },
      { name: "tomato", reason: "Good companions" },
      { name: "cosmos", reason: "Attracts beneficial insects" },
      { name: "snapdragon", reason: "Attracts beneficial insects" },
    ],
    badCompanions: [
      { name: "corn", reason: "Compete for nutrients" },
      { name: "aster", reason: "Can transmit aster yellows disease" },
      { name: "parsley", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "chard",
    aliases: ["swiss chard"],
    goodCompanions: [
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "cabbage", reason: "Good brassica companion" },
      { name: "onion", reason: "Repels pests" },
      { name: "lettuce", reason: "Good companions" },
    ],
    badCompanions: [
      { name: "cucumber", reason: "Compete for nutrients" },
      { name: "melon", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "eggplant",
    aliases: ["aubergine"],
    goodCompanions: [
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "pepper", reason: "Similar growing requirements" },
      { name: "tomato", reason: "Similar growing requirements" },
      { name: "marigold", reason: "Repels nematodes" },
      { name: "catnip", reason: "Repels flea beetles" },
      { name: "dill", reason: "Attracts beneficial insects" },
      { name: "thyme", reason: "Repels pests" },
      { name: "tarragon", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "fennel", reason: "Inhibits growth" },
    ],
  },
  {
    name: "kohlrabi",
    aliases: [],
    goodCompanions: [
      { name: "beet", reason: "Good companions" },
      { name: "cucumber", reason: "Good companions" },
      { name: "onion", reason: "Good companions" },
      { name: "lettuce", reason: "Good companions" },
    ],
    badCompanions: [
      { name: "tomato", reason: "Stunts tomato growth" },
      { name: "pole bean", reason: "Stunts growth" },
      { name: "strawberry", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "leek",
    aliases: ["leeks"],
    goodCompanions: [
      { name: "carrot", reason: "Leeks repel carrot fly, carrots repel leek moth" },
      { name: "celery", reason: "Good companions" },
      { name: "onion", reason: "Similar growing requirements" },
      { name: "tomato", reason: "Good companions" },
    ],
    badCompanions: [
      { name: "bean", reason: "Stunts bean growth" },
      { name: "pea", reason: "Stunts pea growth" },
      { name: "chard", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "okra",
    aliases: [],
    goodCompanions: [
      { name: "pepper", reason: "Similar growing requirements" },
      { name: "tomato", reason: "Okra provides shade" },
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "lettuce", reason: "Good ground cover" },
      { name: "squash", reason: "Good companions" },
      { name: "sweet potato", reason: "Mutually beneficial" },
    ],
    badCompanions: [
      { name: "squash vine borer host", reason: "Can attract squash vine borers" },
    ],
  },
  {
    name: "parsnip",
    aliases: ["parsnips"],
    goodCompanions: [
      { name: "radish", reason: "Quick harvest marks rows" },
      { name: "onion", reason: "Repels pests" },
      { name: "garlic", reason: "Repels pests" },
      { name: "fruit tree", reason: "Root contains myristricin toxic to fruit pests" },
    ],
    badCompanions: [
      { name: "carrot", reason: "Attract same pests, compete for space" },
      { name: "celery", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "potato",
    aliases: ["potatoes"],
    goodCompanions: [
      { name: "bean", reason: "Beans fix nitrogen, potatoes repel Mexican bean beetle" },
      { name: "corn", reason: "Good companions" },
      { name: "cabbage", reason: "Good companions" },
      { name: "horseradish", reason: "Increases disease resistance" },
      { name: "marigold", reason: "Repels pests" },
      { name: "pea", reason: "Peas fix nitrogen" },
      { name: "garlic", reason: "More effective than fungicides on late blight" },
      { name: "thyme", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "tomato", reason: "Share diseases and pests" },
      { name: "cucumber", reason: "Compete for nutrients and space" },
      { name: "pumpkin", reason: "Compete for nutrients" },
      { name: "squash", reason: "Compete for nutrients" },
      { name: "sunflower", reason: "Compete for nutrients" },
      { name: "raspberry", reason: "Share diseases" },
    ],
  },
  {
    name: "sweet potato",
    aliases: ["sweet potatoes"],
    goodCompanions: [
      { name: "okra", reason: "Mutually beneficial" },
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "summer savory", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "squash", reason: "Compete for space" },
    ],
  },
  {
    name: "turnip",
    aliases: ["turnips"],
    goodCompanions: [
      { name: "pea", reason: "Intercropping increases profit" },
      { name: "broccoli", reason: "Acts as trap crop for broccoli pests" },
      { name: "hairy vetch", reason: "Fixes nitrogen" },
    ],
    badCompanions: [
      { name: "mustard", reason: "Hedge mustard inhibits growth" },
      { name: "knotweed", reason: "Inhibits growth" },
      { name: "potato", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "melon",
    aliases: ["melons", "cantaloupe", "watermelon", "honeydew"],
    goodCompanions: [
      { name: "corn", reason: "Good ground cover under corn" },
      { name: "sunflower", reason: "Attracts pollinators" },
      { name: "nasturtium", reason: "Trap crop for aphids" },
      { name: "radish", reason: "Deters beetles" },
      { name: "marigold", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "cucumber", reason: "Can cross-pollinate and share diseases" },
      { name: "potato", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "pumpkin",
    aliases: ["pumpkins"],
    goodCompanions: [
      { name: "corn", reason: "Three sisters - provides shade for ground" },
      { name: "bean", reason: "Three sisters - beans fix nitrogen" },
      { name: "radish", reason: "Trap crop for flea beetles" },
      { name: "nasturtium", reason: "Repels squash bugs" },
      { name: "marigold", reason: "Repels pests" },
      { name: "oregano", reason: "Repels pests" },
    ],
    badCompanions: [
      { name: "potato", reason: "Compete for nutrients" },
    ],
  },
  {
    name: "zucchini",
    aliases: [],
    goodCompanions: [
      { name: "corn", reason: "Three sisters planting" },
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "radish", reason: "Deters squash beetles" },
      { name: "nasturtium", reason: "Trap crop for aphids, repels squash bugs" },
      { name: "marigold", reason: "Repels pests" },
      { name: "borage", reason: "Attracts pollinators" },
    ],
    badCompanions: [
      { name: "potato", reason: "Compete for space and nutrients" },
    ],
  },
  {
    name: "kale",
    aliases: [],
    goodCompanions: [
      { name: "bean", reason: "Beans fix nitrogen" },
      { name: "celery", reason: "Repels cabbage moth" },
      { name: "dill", reason: "Attracts beneficial wasps" },
      { name: "onion", reason: "Repels pests" },
      { name: "garlic", reason: "Repels pests" },
      { name: "marigold", reason: "Repels pests" },
      { name: "nasturtium", reason: "Trap crop for aphids" },
    ],
    badCompanions: [
      { name: "tomato", reason: "Compete for nutrients" },
      { name: "strawberry", reason: "Both heavy feeders" },
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
