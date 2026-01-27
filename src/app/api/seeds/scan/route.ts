import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

// Check if Google credentials are configured (either API key or service account)
const hasGoogleCredentials = !!(
  GOOGLE_CLOUD_API_KEY ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.GOOGLE_CLOUD_PROJECT
);

interface SeedPacketData {
  name: string;
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
  notes: string | null;
}

/**
 * Use Google Cloud Vision API for OCR text extraction
 */
async function extractTextWithGoogleVision(imageBuffer: Buffer): Promise<string> {
  let client: ImageAnnotatorClient;

  // Initialize client based on available credentials
  if (GOOGLE_CLOUD_API_KEY) {
    // Use API key authentication
    client = new ImageAnnotatorClient({
      apiKey: GOOGLE_CLOUD_API_KEY,
    });
  } else {
    // Use default credentials (service account via GOOGLE_APPLICATION_CREDENTIALS)
    client = new ImageAnnotatorClient();
  }

  // Use DOCUMENT_TEXT_DETECTION for better results on dense text like seed packets
  const [result] = await client.documentTextDetection({
    image: { content: imageBuffer },
  });

  const fullTextAnnotation = result.fullTextAnnotation;
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
    throw new Error("No text detected in image");
  }

  return fullTextAnnotation.text;
}

/**
 * Use Claude to parse extracted text into structured seed packet data
 */
async function parseTextWithClaude(text: string): Promise<SeedPacketData> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured");
  }

  const client = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this seed packet text and extract the following information. Return ONLY a valid JSON object with these fields (use null for any information not found):

{
  "name": "Plant name (e.g., 'Tomato', 'Lettuce')",
  "variety": "Specific variety name if shown (e.g., 'Beefsteak', 'Buttercrunch')",
  "brand": "Seed company/brand name",
  "sowingInstructions": "Planting/sowing instructions text",
  "daysToGermination": number of days to germination (just the number),
  "plantingDepth": "Planting depth as written (e.g., '1/4 inch')",
  "spacing": "Plant spacing as written (e.g., '18-24 inches')",
  "sunlight": "Sun requirements (e.g., 'Full Sun', 'Partial Shade')",
  "daysToMaturity": number of days to maturity/harvest (just the number),
  "germinationRate": germination rate percentage if shown (just the number, e.g., 85 for 85%),
  "seedCount": approximate number of seeds in packet if shown (just the number),
  "expirationYear": expiration/packed year if shown (4-digit year),
  "notes": "Any other notable information from the packet"
}

Important: Return ONLY the JSON object, no other text.

Text from seed packet:
${text}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Failed to parse text");
  }

  // Clean up the response - remove markdown code blocks if present
  let jsonText = textContent.text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith("```")) {
    jsonText = jsonText.slice(0, -3);
  }
  jsonText = jsonText.trim();

  return JSON.parse(jsonText);
}

/**
 * Fallback: Use Claude Vision directly (original approach)
 */
async function scanWithClaudeVision(
  imageData: string,
  mediaType: string
): Promise<SeedPacketData> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured");
  }

  const client = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageData,
            },
          },
          {
            type: "text",
            text: `Analyze this seed packet image and extract the following information. Return ONLY a valid JSON object with these fields (use null for any information not found):

{
  "name": "Plant name (e.g., 'Tomato', 'Lettuce')",
  "variety": "Specific variety name if shown (e.g., 'Beefsteak', 'Buttercrunch')",
  "brand": "Seed company/brand name",
  "sowingInstructions": "Planting/sowing instructions text",
  "daysToGermination": number of days to germination (just the number),
  "plantingDepth": "Planting depth as written (e.g., '1/4 inch')",
  "spacing": "Plant spacing as written (e.g., '18-24 inches')",
  "sunlight": "Sun requirements (e.g., 'Full Sun', 'Partial Shade')",
  "daysToMaturity": number of days to maturity/harvest (just the number),
  "germinationRate": germination rate percentage if shown (just the number, e.g., 85 for 85%),
  "seedCount": approximate number of seeds in packet if shown (just the number),
  "expirationYear": expiration/packed year if shown (4-digit year),
  "notes": "Any other notable information from the packet"
}

Important: Return ONLY the JSON object, no other text.`,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Failed to analyze image");
  }

  // Clean up the response
  let jsonText = textContent.text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith("```")) {
    jsonText = jsonText.slice(0, -3);
  }
  jsonText = jsonText.trim();

  return JSON.parse(jsonText);
}

/**
 * POST /api/seeds/scan
 * Analyze a seed packet image and extract seed information
 * Body: { image: string } - Base64 encoded image data
 *
 * Uses Google Cloud Vision API for OCR (if configured), then Claude for parsing.
 * Falls back to Claude Vision directly if Google Vision is not configured.
 */
export async function POST(req: Request) {
  try {
    // Verify user is authenticated
    await getCurrentUserId();

    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Parse the base64 image
    let imageData = image;
    let mediaType = "image/jpeg";

    // Handle data URL format
    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mediaType = matches[1];
        imageData = matches[2];
      }
    }

    let seedData: SeedPacketData;

    // Try Google Vision first if configured
    if (hasGoogleCredentials) {
      try {
        console.log("Using Google Cloud Vision API for OCR...");

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(imageData, "base64");

        // Extract text with Google Vision
        const extractedText = await extractTextWithGoogleVision(imageBuffer);
        console.log("Google Vision extracted text length:", extractedText.length);

        // Parse the text with Claude
        if (ANTHROPIC_API_KEY) {
          seedData = await parseTextWithClaude(extractedText);
        } else {
          // If no Claude API, return just the raw text
          return NextResponse.json({
            name: null,
            variety: null,
            brand: null,
            sowingInstructions: null,
            daysToGermination: null,
            plantingDepth: null,
            spacing: null,
            sunlight: null,
            daysToMaturity: null,
            germinationRate: null,
            seedCount: null,
            expirationYear: null,
            notes: extractedText.slice(0, 500),
            rawText: extractedText,
          });
        }
      } catch (googleError) {
        console.error("Google Vision failed, falling back to Claude Vision:", googleError);

        // Fall back to Claude Vision
        if (!ANTHROPIC_API_KEY) {
          return NextResponse.json(
            { error: "Both Google Vision and Anthropic API failed. Check your configuration." },
            { status: 500 }
          );
        }
        seedData = await scanWithClaudeVision(imageData, mediaType);
      }
    } else {
      // No Google credentials, use Claude Vision directly
      if (!ANTHROPIC_API_KEY) {
        return NextResponse.json(
          { error: "No API keys configured. Add GOOGLE_CLOUD_API_KEY or ANTHROPIC_API_KEY to your environment." },
          { status: 500 }
        );
      }
      console.log("Using Claude Vision API (Google Vision not configured)...");
      seedData = await scanWithClaudeVision(imageData, mediaType);
    }

    return NextResponse.json(seedData);
  } catch (error) {
    console.error("Error scanning seed packet:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to scan seed packet";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
