import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const beds = await prisma.bed.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(beds);
}

export async function POST(req: Request) {
  const body = await req.json();

  const bed = await prisma.bed.create({
    data: {
      name: String(body.name),
      widthInches: Number(body.widthInches ?? 96),
      heightInches: Number(body.heightInches ?? 48),
      cellInches: Number(body.cellInches ?? 12),
    },
  });

  return Response.json(bed);
}
