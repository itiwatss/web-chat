import { NextResponse } from "next/server";
import { getMedia } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_ID = /^[0-9a-f-]{36}$/;
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const media = MEDIA_ID.test(id) ? await getMedia(id) : null;
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new Response(Buffer.from(media.data, "base64"), {
    headers: {
      "Content-Type": media.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
