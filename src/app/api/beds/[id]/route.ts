import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const bedId = Number(params.id);

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: {
      placements: { include: { plant: true } },
    },
  });

  return Response.json(bed);
}
