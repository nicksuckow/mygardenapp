import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.userSettings.findFirst();
    return Response.json(settings);
  } catch (err: any) {
    console.error("GET /api/settings error:", err);
    return new Response(
      JSON.stringify({
        error: "GET /api/settings failed",
        message: err?.message ?? String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const lastSpringFrost = new Date(body.lastSpringFrost);
    const firstFallFrost = new Date(body.firstFallFrost);
    const zone = body.zone ? String(body.zone) : null;

    const existing = await prisma.userSettings.findFirst();

    const saved = existing
      ? await prisma.userSettings.update({
          where: { id: existing.id },
          data: { lastSpringFrost, firstFallFrost, zone },
        })
      : await prisma.userSettings.create({
          data: { lastSpringFrost, firstFallFrost, zone },
        });

    return Response.json(saved);
  } catch (err: any) {
    console.error("POST /api/settings error:", err);
    return new Response(
      JSON.stringify({
        error: "POST /api/settings failed",
        message: err?.message ?? String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
