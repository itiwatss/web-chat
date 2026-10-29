import { NextResponse } from "next/server";
import { authorized } from "@/lib/auth";
import { getContent } from "@/lib/line";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINE_MESSAGE_ID = /^\d{1,30}$/;
type Ctx = { params: Promise<{ messageId: string }> };

export async function GET(req: Request, { params }: Ctx) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { messageId } = await params;
  if (!LINE_MESSAGE_ID.test(messageId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const res = await getContent(messageId);
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "Content unavailable" }, { status: res.status === 404 ? 404 : 502 });
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
