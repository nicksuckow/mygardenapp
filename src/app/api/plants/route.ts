import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET() {
  const plants = await prisma.plant.findMany({ orderBy: { name: "asc" } });
  return Response.json(plants);
}

export async function POST(req: Request) {
  const body = await req.json();

  const plant = await prisma.plant.create({
    data: {
      name: String(body.name),
      variety: body.variety ? String(body.variety) : null,
      spacingInches: Number(body.spacingInches ?? 12),
      daysToMaturityMin: body.daysToMaturityMin ? Number(body.daysToMaturityMin) : null,
      daysToMaturityMax: body.daysToMaturityMax ? Number(body.daysToMaturityMax) : null,
      startIndoorsWeeksBeforeFrost: body.startIndoorsWeeksBeforeFrost
        ? Number(body.startIndoorsWeeksBeforeFrost)
        : null,
      transplantWeeksAfterFrost: body.transplantWeeksAfterFrost
        ? Number(body.transplantWeeksAfterFrost)
        : null,
      directSowWeeksRelativeToFrost: body.directSowWeeksRelativeToFrost
        ? Number(body.directSowWeeksRelativeToFrost)
        : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  return Response.json(plant);
}
