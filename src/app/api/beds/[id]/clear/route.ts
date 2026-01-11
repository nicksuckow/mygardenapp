import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const bedId = Number(params.id);
  const body = await req.json();

  const x = Number(body.x);
  const y = Number(body.y);

  await prisma.bedPlacement.deleteMany({ where: { bedId, x, y } });
  return Response.json({ ok: true });
}
