import Tesseract from "tesseract.js";

export interface SeedPacketData {
  name: string | null;
  variety: string | null;
  brand: string | null;
  sowingInstructions: string | null;
  daysToGermination: number | null;
  plantingDepth: string | null;
  spacing: string | null;
  sunlight: string | null;
  daysToMaturity: number | null;
  germinationRate: number | null;
  seedCount: number | null;
  expirationYear: number | null;
  rawText: string;
}

// Common seed packet patterns
const patterns = {
  // Days to germination: "7-14 days", "Germination: 10 days", "Germinates in 5-7 days"
  daysToGermination: [
    /germinat(?:ion|es?)[:\s]+(?:in\s+)?(\d+)(?:\s*-\s*\d+)?\s*days?/i,
    /(\d+)(?:\s*-\s*\d+)?\s*days?\s+(?:to\s+)?germinat/i,
    /days\s+to\s+germinat(?:ion|e)[:\s]+(\d+)/i,
  ],

  // Days to maturity: "60-70 days", "Harvest: 75 days", "Matures in 90 days"
  daysToMaturity: [
    /(?:days\s+to\s+)?(?:maturity|harvest)[:\s]+(\d+)(?:\s*-\s*\d+)?\s*days?/i,
    /matures?\s+in\s+(\d+)(?:\s*-\s*\d+)?\s*days?/i,
    /(\d+)(?:\s*-\s*\d+)?\s*days?\s+to\s+(?:maturity|harvest)/i,
    /harvest\s+(\d+)(?:\s*-\s*\d+)?\s*days?/i,
  ],

  // Planting depth: "1/4 inch", "Plant 1/2" deep", "Depth: 1 inch"
  plantingDepth: [
    /(?:plant(?:ing)?\s+)?depth[:\s]+([^,\n]+)/i,
    /plant\s+([0-9\/\-\.]+\s*(?:inch|in|"|cm|mm)[^\n,]*)/i,
    /sow\s+([0-9\/\-\.]+\s*(?:inch|in|"|cm|mm)[^\n,]*)\s*deep/i,
    /([0-9\/\-\.]+\s*(?:inch|in|"|cm|mm))\s*deep/i,
  ],

  // Spacing: "18-24 inches", "Space 12" apart", "Thin to 6 inches"
  spacing: [
    /spac(?:e|ing)[:\s]+([0-9\-\.]+\s*(?:inch|in|"|cm|ft|feet)[^\n,]*)/i,
    /thin\s+to\s+([0-9\-\.]+\s*(?:inch|in|"|cm)[^\n,]*)/i,
    /([0-9\-\.]+\s*(?:inch|in|"|cm|ft|feet))\s*apart/i,
  ],

  // Sunlight: "Full Sun", "Partial Shade", "Sun: Full"
  sunlight: [
    /(?:sun(?:light)?|light)[:\s]+(full\s*sun|partial\s*(?:sun|shade)|full\s*shade|shade)/i,
    /(full\s*sun|partial\s*(?:sun|shade)|full\s*shade)/i,
  ],

  // Germination rate: "85% germination", "Germ: 90%"
  germinationRate: [
    /(?:germ(?:ination)?[:\s]+)?(\d+)\s*%\s*(?:germ(?:ination)?)?/i,
  ],

  // Seed count: "100 seeds", "Approx. 50 seeds"
  seedCount: [
    /(?:approx\.?\s*)?(\d+)\s*seeds?/i,
    /seeds?[:\s]+(\d+)/i,
    /contains?\s+(\d+)\s*seeds?/i,
  ],

  // Expiration year: "Packed for 2024", "Use by 2025", "Exp: 2024"
  expirationYear: [
    /(?:packed\s+for|use\s+by|exp(?:ires?)?[:\s]*|best\s+(?:by|before))[:\s]*(20\d{2})/i,
    /(20\d{2})\s*(?:season|crop)/i,
  ],

  // Common vegetable/herb names
  plantNames: [
    /\b(tomato|tomatoes|pepper|peppers|cucumber|cucumbers|lettuce|spinach|kale|carrot|carrots|bean|beans|pea|peas|corn|squash|zucchini|pumpkin|melon|watermelon|cantaloupe|onion|onions|garlic|radish|radishes|beet|beets|broccoli|cauliflower|cabbage|celery|eggplant|okra|parsley|basil|cilantro|dill|oregano|thyme|rosemary|sage|mint|chives|arugula|chard|collard|turnip|rutabaga|leek|scallion|fennel|endive|radicchio|sunflower|marigold|zinnia|petunia|pansy|cosmos|dahlia)\b/i,
  ],

  // Common brand names
  brandNames: [
    /\b(burpee|ferry[\-\s]?morse|botanical\s*interests|seed\s*savers|baker\s*creek|johnny'?s|territorial|high\s*mowing|renee'?s|park\s*seed|gurney'?s|jung|harris|stokes|pinetree|sow\s*true|seed\s*needs|eden\s*brothers)\b/i,
  ],
};

function extractFirstMatch(
  text: string,
  patternList: RegExp[]
): string | null {
  for (const pattern of patternList) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractNumber(text: string, patternList: RegExp[]): number | null {
  const match = extractFirstMatch(text, patternList);
  if (match) {
    const num = parseInt(match, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

function extractPlantName(text: string): string | null {
  // First try to find known plant names
  const knownMatch = extractFirstMatch(text, patterns.plantNames);
  if (knownMatch) {
    // Capitalize first letter
    return knownMatch.charAt(0).toUpperCase() + knownMatch.slice(1).toLowerCase();
  }

  // Look for lines that might be the plant name (usually larger text at top)
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  for (const line of lines.slice(0, 5)) {
    // Check first few lines
    const trimmed = line.trim();
    // Skip lines that look like instructions or numbers
    if (
      trimmed.length > 2 &&
      trimmed.length < 30 &&
      !/^\d/.test(trimmed) &&
      !/instructions?|directions?|how\s+to/i.test(trimmed)
    ) {
      return trimmed;
    }
  }

  return null;
}

function extractVariety(text: string, plantName: string | null): string | null {
  if (!plantName) return null;

  // Look for variety patterns like "Beefsteak Tomato" or "Tomato - Beefsteak"
  const varietyPatterns = [
    new RegExp(`([\\w\\s]+)\\s+${plantName}`, "i"),
    new RegExp(`${plantName}\\s*[-:]\\s*([\\w\\s]+)`, "i"),
    /variety[:\s]+([^\n,]+)/i,
  ];

  return extractFirstMatch(text, varietyPatterns);
}

function extractBrand(text: string): string | null {
  return extractFirstMatch(text, patterns.brandNames);
}

function extractSowingInstructions(text: string): string | null {
  // Look for instruction sections
  const instructionPatterns = [
    /(?:sowing|planting|growing)\s*(?:instructions?|directions?|guide)?[:\s]*([^]*?)(?=\n\n|\z)/i,
    /how\s+to\s+(?:plant|grow|sow)[:\s]*([^]*?)(?=\n\n|\z)/i,
  ];

  for (const pattern of instructionPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 20) {
      return match[1].trim().slice(0, 500); // Limit length
    }
  }

  return null;
}

export async function scanSeedPacket(
  imageSource: string | File
): Promise<SeedPacketData> {
  // Run OCR
  const result = await Tesseract.recognize(imageSource, "eng", {
    logger: () => {}, // Suppress logging
  });

  const text = result.data.text;

  // Extract plant name first (needed for variety)
  const name = extractPlantName(text);

  return {
    name,
    variety: extractVariety(text, name),
    brand: extractBrand(text),
    sowingInstructions: extractSowingInstructions(text),
    daysToGermination: extractNumber(text, patterns.daysToGermination),
    plantingDepth: extractFirstMatch(text, patterns.plantingDepth),
    spacing: extractFirstMatch(text, patterns.spacing),
    sunlight: extractFirstMatch(text, patterns.sunlight),
    daysToMaturity: extractNumber(text, patterns.daysToMaturity),
    germinationRate: extractNumber(text, patterns.germinationRate),
    seedCount: extractNumber(text, patterns.seedCount),
    expirationYear: extractNumber(text, patterns.expirationYear),
    rawText: text, // Include raw text for debugging/manual extraction
  };
}
