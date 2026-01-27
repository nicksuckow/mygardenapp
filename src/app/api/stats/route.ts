import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { getCompanionSuggestions } from "@/lib/companionPlanting";

export const runtime = "nodejs";

type PlacementStatus = "planned" | "seedsStarted" | "growing" | "harvesting" | "complete";

function getPlacementStatus(p: {
  seedsStartedDate: Date | null;
  transplantedDate: Date | null;
  directSowedDate: Date | null;
  harvestStartedDate: Date | null;
  harvestEndedDate: Date | null;
}): PlacementStatus {
  if (p.harvestEndedDate) return "complete";
  if (p.harvestStartedDate) return "harvesting";
  if (p.transplantedDate || p.directSowedDate) return "growing";
  if (p.seedsStartedDate) return "seedsStarted";
  return "planned";
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    // Get all beds with placements
    const beds = await prisma.bed.findMany({
      where: { userId },
      include: {
        placements: {
          include: {
            plant: true,
          },
        },
      },
    });

    // Get all plants
    const plants = await prisma.plant.findMany({
      where: { userId },
    });

    // Calculate statistics
    const totalBeds = beds.length;
    const totalPlants = plants.length;

    // Flatten all placements
    const allPlacements = beds.flatMap((b) => b.placements);
    const totalPlacements = allPlacements.length;

    // Status breakdown
    const statusCounts = {
      planned: 0,
      seedsStarted: 0,
      growing: 0,
      harvesting: 0,
      complete: 0,
    };

    allPlacements.forEach((p) => {
      const status = getPlacementStatus(p);
      statusCounts[status]++;
    });

    // Plant variety breakdown (top 10)
    const plantCounts: Record<string, number> = {};
    allPlacements.forEach((p) => {
      const name = p.plant.name;
      plantCounts[name] = (plantCounts[name] || 0) + 1;
    });
    const topPlants = Object.entries(plantCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Harvest yield totals
    const yieldsByUnit: Record<string, number> = {};
    allPlacements.forEach((p) => {
      if (p.harvestYield && p.harvestYieldUnit) {
        yieldsByUnit[p.harvestYieldUnit] = (yieldsByUnit[p.harvestYieldUnit] || 0) + p.harvestYield;
      }
    });
    const harvestYields = Object.entries(yieldsByUnit).map(([unit, amount]) => ({
      unit,
      amount: Math.round(amount * 10) / 10,
    }));

    // Companion planting analysis
    const uniquePlantNames = [...new Set(allPlacements.map((p) => p.plant.name))];
    const companionAnalysis = getCompanionSuggestions(uniquePlantNames);

    // Calculate companion score (good pairs - bad pairs, normalized)
    const totalPairs = companionAnalysis.goodPairs.length + companionAnalysis.badPairs.length;
    const companionScore = totalPairs > 0
      ? Math.round(((companionAnalysis.goodPairs.length - companionAnalysis.badPairs.length) / totalPairs + 1) * 50)
      : null;

    // Estimated harvest dates (based on days to maturity)
    const upcomingHarvests: { plantName: string; estimatedDate: string; bedName: string }[] = [];
    const now = new Date();

    allPlacements.forEach((p) => {
      if (!p.harvestStartedDate && !p.harvestEndedDate && p.plant.daysToMaturityMin) {
        const plantingDate = p.transplantedDate || p.directSowedDate || p.seedsStartedDate;
        if (plantingDate) {
          const estimatedDate = new Date(plantingDate);
          estimatedDate.setDate(estimatedDate.getDate() + p.plant.daysToMaturityMin);

          // Only include future harvests or recently ready
          if (estimatedDate > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
            const bed = beds.find((b) => b.id === p.bedId);
            upcomingHarvests.push({
              plantName: p.plant.name,
              estimatedDate: estimatedDate.toISOString().split("T")[0],
              bedName: bed?.name || "Unknown",
            });
          }
        }
      }
    });

    // Sort by date and take first 10
    upcomingHarvests.sort((a, b) => a.estimatedDate.localeCompare(b.estimatedDate));
    const nextHarvests = upcomingHarvests.slice(0, 10);

    // Bed utilization (estimate based on spacing)
    const bedUtilization = beds.map((bed) => {
      const totalArea = bed.widthInches * bed.heightInches;
      const usedArea = bed.placements.reduce((sum, p) => {
        const spacing = p.plant.spacingInches;
        return sum + spacing * spacing;
      }, 0);
      return {
        name: bed.name,
        utilizationPercent: Math.min(100, Math.round((usedArea / totalArea) * 100)),
        placementCount: bed.placements.length,
      };
    });

    return NextResponse.json({
      summary: {
        totalBeds,
        totalPlants,
        totalPlacements,
      },
      statusBreakdown: statusCounts,
      topPlants,
      harvestYields,
      companionPlanting: {
        score: companionScore,
        goodPairs: companionAnalysis.goodPairs.slice(0, 5),
        badPairs: companionAnalysis.badPairs.slice(0, 5),
      },
      upcomingHarvests: nextHarvests,
      bedUtilization,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
