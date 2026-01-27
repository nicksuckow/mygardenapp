import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

/**
 * Parse planting instruction text like "6-8 weeks before last frost" into weeks
 */
function parseWeeksFromFrost(text: string | undefined | null, type: "before" | "after" | "relative"): number | null {
  if (!text) return null;

  const lower = text.toLowerCase();

  // Try to match "X weeks" or "X-Y weeks" pattern
  const weeksMatch = lower.match(/(\d+)(?:\s*-\s*\d+)?\s*weeks?/);

  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);

    if (type === "before") {
      return weeks;
    } else if (type === "after") {
      return weeks;
    } else {
      if (lower.includes("before")) return -weeks;
      if (lower.includes("after")) return weeks;
      return weeks;
    }
  }

  // No explicit weeks found - check for frost-relative phrases
  if (type === "after") {
    if (
      lower.includes("after last frost") ||
      lower.includes("after frost") ||
      lower.includes("once frost has passed") ||
      lower.includes("when frost danger") ||
      lower.includes("frost free") ||
      lower.includes("frost-free") ||
      lower.includes("no danger of frost")
    ) {
      return 1;
    }
  }

  if (type === "relative") {
    if (lower.includes("after") && (lower.includes("frost") || lower.includes("warm"))) {
      return 1;
    }
    if (lower.includes("before") && lower.includes("frost")) {
      return -2;
    }
  }

  return null;
}

/**
 * Parse days to maturity from various text formats
 */
function parseDaysToMaturity(text: string | undefined | null): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null };

  const lower = text.toLowerCase();

  // Match patterns like "65-80 days", "60 to 75 days", "70 days"
  const rangeMatch = lower.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*days?/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
    };
  }

  // Single number: "70 days"
  const singleMatch = lower.match(/(\d+)\s*days?/);
  if (singleMatch) {
    const days = parseInt(singleMatch[1], 10);
    return { min: days, max: days + 14 };
  }

  return { min: null, max: null };
}

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all plants for this user
    const plants = await prisma.plant.findMany({
      where: { userId },
    });

    let updated = 0;
    const results: { id: number; name: string; changes: string[] }[] = [];

    for (const plant of plants) {
      const changes: string[] = [];
      const updates: Record<string, number | null> = {};

      // Re-parse startIndoorsWeeksBeforeFrost
      const newStartIndoors = parseWeeksFromFrost(plant.startIndoorsInstructions, "before");
      if (newStartIndoors !== plant.startIndoorsWeeksBeforeFrost) {
        updates.startIndoorsWeeksBeforeFrost = newStartIndoors;
        changes.push(`startIndoors: ${plant.startIndoorsWeeksBeforeFrost} → ${newStartIndoors}`);
      }

      // Re-parse transplantWeeksAfterFrost
      let newTransplant = parseWeeksFromFrost(plant.transplantInstructions, "after");
      // If we have startIndoors but no transplant, default to 1 week after frost
      if (newStartIndoors !== null && newTransplant === null) {
        newTransplant = 1;
      }
      if (newTransplant !== plant.transplantWeeksAfterFrost) {
        updates.transplantWeeksAfterFrost = newTransplant;
        changes.push(`transplant: ${plant.transplantWeeksAfterFrost} → ${newTransplant}`);
      }

      // Re-parse directSowWeeksRelativeToFrost
      const newDirectSow = parseWeeksFromFrost(plant.directSowInstructions, "relative");
      if (newDirectSow !== plant.directSowWeeksRelativeToFrost) {
        updates.directSowWeeksRelativeToFrost = newDirectSow;
        changes.push(`directSow: ${plant.directSowWeeksRelativeToFrost} → ${newDirectSow}`);
      }

      // Try to parse days to maturity from notes or description
      let daysToMaturity = parseDaysToMaturity(plant.notes);
      if (daysToMaturity.min === null) {
        daysToMaturity = parseDaysToMaturity(plant.description);
      }

      if (daysToMaturity.min !== null && plant.daysToMaturityMin === null) {
        updates.daysToMaturityMin = daysToMaturity.min;
        changes.push(`daysToMaturityMin: null → ${daysToMaturity.min}`);
      }
      if (daysToMaturity.max !== null && plant.daysToMaturityMax === null) {
        updates.daysToMaturityMax = daysToMaturity.max;
        changes.push(`daysToMaturityMax: null → ${daysToMaturity.max}`);
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await prisma.plant.update({
          where: { id: plant.id },
          data: updates,
        });
        updated++;
        results.push({ id: plant.id, name: plant.name, changes });
      }
    }

    return NextResponse.json({
      message: `Recalculated timing for ${updated} of ${plants.length} plants`,
      updated,
      total: plants.length,
      details: results,
    });
  } catch (error) {
    console.error("Error recalculating plant timing:", error);
    return NextResponse.json({ error: "Failed to recalculate" }, { status: 500 });
  }
}
