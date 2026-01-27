// Companion planting data extracted from various sources
// Source: Wikipedia Companion Planting page (via GenevieveMilliken/companion_plants dataset)

export interface CompanionPlantData {
  commonName: string;
  scientificName: string;
  helps: string[];
  helpedBy: string[];
  attracts: string[];
  repels: string[];
  avoid: string[];
  comments: string;
}

export const companionPlants: CompanionPlantData[] = [
  {
    commonName: "Alliums",
    scientificName: "Allium",
    helps: ["fruit trees", "tomatoes", "peppers", "potatoes", "brassicas", "carrots"],
    helpedBy: ["carrots", "tomatoes", "marigolds", "mints"],
    attracts: ["thrips"],
    repels: ["rabbits", "slugs", "aphids", "carrot fly", "cabbage loopers", "cabbage maggots", "cabbage worms", "Japanese beetles"],
    avoid: ["beans", "peas"],
    comments: "Alliums include onions, garlic, leeks, shallots, and chives."
  },
  {
    commonName: "Asparagus",
    scientificName: "Asparagus officinalis",
    helps: ["tomatoes", "parsley"],
    helpedBy: ["aster flowers", "dill", "coriander", "tomatoes", "parsley", "basil", "comfrey", "marigolds", "nasturtiums"],
    attracts: ["ladybugs (with basil)"],
    repels: [],
    avoid: ["onion", "garlic", "potatoes", "gladiolus"],
    comments: ""
  },
  {
    commonName: "Beans (bush)",
    scientificName: "Phaseolus vulgaris",
    helps: ["cucumber", "soybeans", "strawberries"],
    helpedBy: ["celery", "strawberries", "grains"],
    attracts: [],
    repels: [],
    avoid: ["fennel", "soybeans", "dry beans", "alfalfa"],
    comments: "Avoid planting after lettuce, potato, tomato, other legumes, crucifers, or cucurbits."
  },
  {
    commonName: "Beans (pole)",
    scientificName: "Phaseolus vulgaris",
    helps: [],
    helpedBy: ["radishes", "corn"],
    attracts: [],
    repels: [],
    avoid: ["sunflowers", "beets", "brassicas", "kohlrabi"],
    comments: "Corn stalks provide a natural pole for beans to climb, beans fix nitrogen for corn."
  },
  {
    commonName: "Beans (fava)",
    scientificName: "Vicia faba",
    helps: [],
    helpedBy: ["strawberries", "celery"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: ""
  },
  {
    commonName: "Beets",
    scientificName: "Beta vulgaris",
    helps: ["broccoli", "bush beans", "cabbage", "lettuce", "kohlrabi", "onions", "brassicas", "passion fruit"],
    helpedBy: ["bush beans", "onions", "kohlrabi", "catnip", "garlic", "lettuce", "brassicas", "mint"],
    attracts: [],
    repels: [],
    avoid: ["pole beans", "runner beans"],
    comments: "Good for adding minerals to soil through composting leaves (up to 25% magnesium)."
  },
  {
    commonName: "Brassicas",
    scientificName: "Brassica",
    helps: ["beets", "onions", "potatoes", "corn", "wheat"],
    helpedBy: ["beets", "spinach", "chard", "celery", "chamomile", "marigolds", "dill", "sage", "peas", "peppermint", "spearmint", "rosemary", "garlic", "onions", "potatoes", "geraniums", "nasturtium", "borage", "hyssop", "tansy", "thyme", "wormwood", "beans", "clover"],
    attracts: [],
    repels: ["wireworms"],
    avoid: ["mustards", "tomatoes", "peppers", "pole beans", "strawberries"],
    comments: "Includes broccoli, Brussels sprouts, cabbage, cauliflower, Chinese cabbage, kohlrabi, radish, and turnip."
  },
  {
    commonName: "Broccoli",
    scientificName: "Brassica oleracea",
    helps: ["lettuce"],
    helpedBy: ["mustard", "pac choi", "beets", "dill", "lettuce", "onions", "tomato", "turnip", "clover"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: "Intercropped with lettuce is more profitable than either alone. Turnip acts as trap crop."
  },
  {
    commonName: "Brussels sprouts",
    scientificName: "Brassica oleracea",
    helps: [],
    helpedBy: ["sage", "thyme", "clover", "barley"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: ""
  },
  {
    commonName: "Cabbage",
    scientificName: "Brassica oleracea",
    helps: ["beans", "celery"],
    helpedBy: ["beans", "clover", "calendula", "chamomile", "larkspur", "nasturtiums", "dill", "coriander", "hyssop", "onions", "beets", "marigolds", "mint", "rosemary", "sage", "thyme", "tomatoes"],
    attracts: ["snails", "slugs"],
    repels: [],
    avoid: ["grapes"],
    comments: "Nasturtiums repel cabbage moths. Sow clover after cabbage transplant."
  },
  {
    commonName: "Carrots",
    scientificName: "Daucus carota",
    helps: ["tomatoes", "alliums", "beans", "leeks", "lettuce", "onions", "passion fruit"],
    helpedBy: ["lettuce", "chives", "leeks", "onions", "shallots", "rosemary", "wormwood", "sage", "beans", "flax"],
    attracts: ["assassin bug", "lacewing", "parasitic wasp", "yellow jacket"],
    repels: ["leek moth", "onion fly"],
    avoid: ["dill", "parsnip", "radish"],
    comments: "Tomatoes grow better with carrots but may stunt carrot growth. Let carrots flower to attract beneficial insects."
  },
  {
    commonName: "Cauliflower",
    scientificName: "Brassica oleracea",
    helps: ["beans", "celery", "spinach", "peas"],
    helpedBy: ["Chinese cabbage", "marigolds", "sunflower", "spinach", "peas"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: "One row of spinach alternating at 60cm from cauliflower is mutually beneficial."
  },
  {
    commonName: "Celery",
    scientificName: "Apium graveolens",
    helps: ["bush beans", "brassicas", "cucumber"],
    helpedBy: ["cosmos", "daisies", "snapdragons", "leeks", "tomatoes", "cauliflower", "cabbage", "bush beans"],
    attracts: [],
    repels: ["whiteflies"],
    avoid: ["corn", "aster flowers"],
    comments: "Aster flowers can transmit aster yellows disease."
  },
  {
    commonName: "Chard",
    scientificName: "Beta vulgaris ssp. cicla",
    helps: ["brassicas", "passion fruit"],
    helpedBy: [],
    attracts: [],
    repels: [],
    avoid: [],
    comments: ""
  },
  {
    commonName: "Corn",
    scientificName: "Zea mays",
    helps: ["beans", "cucurbits", "soybeans", "tomatoes"],
    helpedBy: ["sunflowers", "dill", "beans", "peas", "soybeans", "peanuts", "cucurbits", "clover", "amaranth", "geranium", "pigweed", "lamb's quarters", "morning glory", "parsley", "potato", "mustard"],
    attracts: [],
    repels: [],
    avoid: ["tomato", "celery"],
    comments: "Three Sisters technique: provides trellis for beans, protected by cucurbits."
  },
  {
    commonName: "Cucumber",
    scientificName: "Cucumis sativus",
    helps: ["beans", "kohlrabi", "lettuce"],
    helpedBy: ["kohlrabi", "nasturtiums", "radishes", "marigolds", "sunflowers", "peas", "beans", "chamomile", "beets", "carrots", "dill", "onions", "garlic", "amaranth", "celery"],
    attracts: ["ground beetles"],
    repels: ["raccoons", "ants"],
    avoid: ["potato", "aromatic herbs"],
    comments: "Sow 2-3 radish seeds with cucumbers to repel cucumber beetles. Amaranth reduces beetles by 75%."
  },
  {
    commonName: "Eggplant",
    scientificName: "Solanum melongena",
    helps: ["beans", "peppers", "tomatoes", "passion fruit"],
    helpedBy: ["marigolds", "catnip", "dill", "pigweed", "green beans", "tarragon", "mints", "thyme"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: "Marigolds deter nematodes."
  },
  {
    commonName: "Kohlrabi",
    scientificName: "Brassica oleracea v. gongylodes",
    helps: ["onion", "beets", "cucumbers"],
    helpedBy: ["beets", "cucumbers"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: ""
  },
  {
    commonName: "Leek",
    scientificName: "Allium ampeloprasum v. porrum",
    helps: ["carrots", "celery", "onions", "tomato", "passion fruit"],
    helpedBy: ["carrots", "clover"],
    attracts: [],
    repels: [],
    avoid: ["Swiss chard"],
    comments: ""
  },
  {
    commonName: "Lettuce",
    scientificName: "Lactuca sativa",
    helps: ["beets", "beans", "okra", "onions", "radish", "broccoli", "carrots", "passion fruit"],
    helpedBy: ["radish", "beets", "dill", "kohlrabi", "onions", "beans", "carrots", "cucumbers", "strawberries", "broccoli", "thyme", "nasturtiums", "alyssum", "cilantro"],
    attracts: ["slugs", "snails"],
    repels: [],
    avoid: ["celery", "cabbage", "cress", "parsley"],
    comments: "Mints repel slugs. Intercropped with broccoli is more profitable than either alone."
  },
  {
    commonName: "Mustard",
    scientificName: "Sinapis alba",
    helps: ["beans", "broccoli", "cabbage", "cauliflower", "fruit trees", "grapes", "radish", "brussels sprouts", "turnips"],
    helpedBy: [],
    attracts: ["various pests (trap crop)"],
    repels: [],
    avoid: [],
    comments: "Acts as a trap crop in broccoli."
  },
  {
    commonName: "Nightshades",
    scientificName: "Solanaceae",
    helps: [],
    helpedBy: ["carrots", "alliums", "basil", "oregano"],
    attracts: [],
    repels: [],
    avoid: ["beans", "black walnuts", "corn", "fennel", "dill", "brassicas"],
    comments: "Includes tomatoes, tobacco, peppers, potatoes, and eggplant."
  },
  {
    commonName: "Okra",
    scientificName: "Abelmoschus esculentus",
    helps: ["sweet potato", "tomatoes", "peppers"],
    helpedBy: ["beans", "lettuce", "squash", "sweet potato", "peppers"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: "Okra and sweet potato are mutually beneficial."
  },
  {
    commonName: "Onion",
    scientificName: "Allium cepa",
    helps: ["beets", "beans", "brassicas", "cabbage", "broccoli", "carrots", "lettuce", "cucumbers", "peppers", "passion fruit", "strawberries"],
    helpedBy: ["carrots", "beets", "brassicas", "dill", "lettuce", "strawberries", "marigolds", "mints", "tomatoes", "summer savory", "chamomile", "pansy"],
    attracts: [],
    repels: [],
    avoid: ["lentils", "peas"],
    comments: ""
  },
  {
    commonName: "Parsnip",
    scientificName: "Pastinaca sativa",
    helps: ["fruit trees"],
    helpedBy: [],
    attracts: ["predatory insects"],
    repels: [],
    avoid: [],
    comments: "Let flowers go to seed to attract predatory insects. Root contains myristricin, toxic to fruit flies and pests."
  },
  {
    commonName: "Peas",
    scientificName: "Pisum sativum",
    helps: ["brassicas", "turnip", "cauliflower", "garlic"],
    helpedBy: ["turnip", "cauliflower", "garlic", "mints"],
    attracts: [],
    repels: ["Colorado potato beetle"],
    avoid: [],
    comments: "Intercropped with turnips, cauliflower, or garlic increases profit per land area."
  },
  {
    commonName: "Peppers",
    scientificName: "Capsicum",
    helps: ["okra"],
    helpedBy: ["beans", "tomatoes", "marjoram", "okra", "geraniums", "petunias", "sunflowers", "onions", "crimson clover", "basil", "mustard"],
    attracts: [],
    repels: [],
    avoid: ["beans", "kale", "cabbage", "Brussels sprouts"],
    comments: "Like high humidity - plant with dense-leaf companions like marjoram and basil."
  },
  {
    commonName: "Potato",
    scientificName: "Solanum tuberosum",
    helps: ["brassicas", "beans", "corn", "peas", "passion fruit"],
    helpedBy: ["horseradish", "beans", "dead nettle", "marigolds", "peas", "onion", "garlic", "thyme", "clover"],
    attracts: [],
    repels: ["Mexican bean beetle"],
    avoid: ["carrot", "cucumber", "pumpkin", "raspberries", "squash", "sunflower", "tomato"],
    comments: "Horseradish increases disease resistance. Garlic more effective than fungicides on late blight."
  },
  {
    commonName: "Pumpkin",
    scientificName: "Cucurbita pepo",
    helps: ["corn", "beans"],
    helpedBy: ["buckwheat", "catnip", "oregano", "tansy", "radishes", "nasturtiums"],
    attracts: ["spiders", "ground beetles"],
    repels: [],
    avoid: ["potatoes"],
    comments: "Radishes as trap crop for flea beetles. Can use Three Sisters technique. Nasturtiums repel squash bugs."
  },
  {
    commonName: "Radish",
    scientificName: "Raphanus sativus",
    helps: ["squash", "eggplant", "cucumber", "lettuce", "peas", "beans", "pole beans"],
    helpedBy: ["chervil", "lettuce", "nasturtiums"],
    attracts: ["flea beetles (trap crop)", "cucumber beetles (trap crop)"],
    repels: [],
    avoid: ["grapes"],
    comments: "Use as trap crop for flea beetles. Radishes grown with lettuce taste better."
  },
  {
    commonName: "Soybean",
    scientificName: "Glycine max",
    helps: [],
    helpedBy: ["corn", "snap beans", "sunflower"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: "Corn, mungbean, and sunflower mixture rids soybeans of aphids."
  },
  {
    commonName: "Spinach",
    scientificName: "Spinacia oleracea",
    helps: ["brassicas", "cauliflower", "passion fruit"],
    helpedBy: ["strawberries", "peas", "beans", "cauliflower"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: "Peas and beans provide natural shade for spinach."
  },
  {
    commonName: "Squash",
    scientificName: "Cucurbita spp.",
    helps: ["corn", "beans", "okra"],
    helpedBy: ["beans", "buckwheat", "borage", "catnip", "tansy", "radishes", "marigolds", "nasturtiums"],
    attracts: ["spiders", "ground beetles"],
    repels: [],
    avoid: [],
    comments: "Three Sisters technique. Marigolds and nasturtiums repel squash bugs."
  },
  {
    commonName: "Sweet potato",
    scientificName: "Ipomoea batatas",
    helps: ["okra"],
    helpedBy: ["okra"],
    attracts: [],
    repels: [],
    avoid: [],
    comments: "Mutually beneficial with okra."
  },
  {
    commonName: "Tomatoes",
    scientificName: "Solanum lycopersicum",
    helps: ["brassicas", "broccoli", "cabbage", "celery", "roses", "peppers", "asparagus"],
    helpedBy: ["asparagus", "basil", "beans", "bee balm", "oregano", "parsley", "marigold", "garlic", "leeks", "celery", "geraniums", "petunias", "nasturtium", "borage", "coriander", "chives", "corn", "dill", "mustard", "fenugreek", "barley", "carrots", "eggplant", "mints", "okra", "sage", "thyme"],
    attracts: [],
    repels: ["asparagus beetle"],
    avoid: ["black walnut", "alfalfa", "corn", "fennel", "chili peppers", "peas", "dill", "potatoes", "beetroot", "brassicas", "rosemary"],
    comments: "Basil planted 10 inches apart increases tomato yield by 20%. Black walnuts inhibit growth (juglone). Dill attracts tomato hornworm."
  },
  {
    commonName: "Turnips",
    scientificName: "Brassica rapa",
    helps: ["peas", "broccoli"],
    helpedBy: ["hairy vetch", "peas"],
    attracts: [],
    repels: [],
    avoid: ["hedge mustard", "knotweed"],
    comments: "Acts as trap crop for broccoli."
  }
];

// Helper function to find companions for a plant
export function getCompanions(plantName: string): CompanionPlantData | undefined {
  const normalized = plantName.toLowerCase();
  return companionPlants.find(p =>
    p.commonName.toLowerCase() === normalized ||
    p.commonName.toLowerCase().includes(normalized) ||
    normalized.includes(p.commonName.toLowerCase())
  );
}

// Helper function to check if two plants are good companions
export function areGoodCompanions(plant1: string, plant2: string): boolean {
  const p1 = getCompanions(plant1);
  const p2 = getCompanions(plant2);

  if (!p1 || !p2) return false;

  const p1Normalized = plant1.toLowerCase();
  const p2Normalized = plant2.toLowerCase();

  // Check if p1 helps p2 or p2 helps p1
  const p1HelpsP2 = p1.helps.some(h => h.toLowerCase().includes(p2Normalized));
  const p2HelpsP1 = p2.helps.some(h => h.toLowerCase().includes(p1Normalized));
  const p1HelpedByP2 = p1.helpedBy.some(h => h.toLowerCase().includes(p2Normalized));
  const p2HelpedByP1 = p2.helpedBy.some(h => h.toLowerCase().includes(p1Normalized));

  return p1HelpsP2 || p2HelpsP1 || p1HelpedByP2 || p2HelpedByP1;
}

// Helper function to check if two plants should be avoided together
export function shouldAvoid(plant1: string, plant2: string): boolean {
  const p1 = getCompanions(plant1);
  const p2 = getCompanions(plant2);

  if (!p1 || !p2) return false;

  const p1Normalized = plant1.toLowerCase();
  const p2Normalized = plant2.toLowerCase();

  const p1AvoidsP2 = p1.avoid.some(a => a.toLowerCase().includes(p2Normalized));
  const p2AvoidsP1 = p2.avoid.some(a => a.toLowerCase().includes(p1Normalized));

  return p1AvoidsP2 || p2AvoidsP1;
}

// Get all good companions for a plant
export function getGoodCompanionsFor(plantName: string): string[] {
  const plant = getCompanions(plantName);
  if (!plant) return [];

  const companions = new Set<string>();
  plant.helps.forEach(p => companions.add(p));
  plant.helpedBy.forEach(p => companions.add(p));

  return Array.from(companions);
}

// Get all plants to avoid for a plant
export function getPlantsToAvoid(plantName: string): string[] {
  const plant = getCompanions(plantName);
  if (!plant) return [];

  return [...plant.avoid];
}
