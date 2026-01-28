import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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
 * POST /api/seeds/scan
 * Analyze a seed packet image and extract seed information
 * Body: { image: string } - Base64 encoded image data
 */
export async function POST(req: Request) {
  try {
    // Verify user is authenticated
    await getCurrentUserId();

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY to your environment." },
        { status: 500 }
      );
    }

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

    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Send to Claude Vision API
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

    // Parse the response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "Failed to analyze image" },
        { status: 500 }
      );
    }

    // Try to parse the JSON from the response
    let seedData: SeedPacketData;
    try {
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

      seedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse seed packet data", rawResponse: textContent.text },
        { status: 500 }
      );
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
