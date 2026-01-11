import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const bedId = Number(params.id);
  const body = await req.json();

  const plantId = Number(body.plantId);
  const x = Number(body.x);
  const y = Number(body.y);

  const existing = await prisma.bedPlacement.findFirst({
    where: { bedId, x, y },
  });

  const placement = existing
    ? await prisma.bedPlacement.update({
        where: { id: existing.id },
        data: { plantId },
      })
    : await prisma.bedPlacement.create({
        data: { bedId, plantId, x, y, w: 1, h: 1, count: 1 },
      });

  return Response.json(placement);
}
