import { NextResponse } from "next/server";
import { authorized } from "@/lib/auth";
import { markAsRead, pushImage, pushText } from "@/lib/line";
import { getMessages, markRead, saveMedia, saveMessage } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINE_USER_ID = /^U[0-9a-f]{32}$/i;
const MAX_IMAGE = 1_000_000;
type Ctx = { params: Promise<{ userId: string }> };

function publicBaseUrl(req: Request): string | null {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/+$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && req.headers.get("x-forwarded-proto") === "https") return `https://${host}`;
  return null;
}

function decodeJpeg(b64: unknown): Buffer | null {
  if (typeof b64 !== "string") return null;
  const buf = Buffer.from(b64, "base64");
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  return isJpeg && buf.length <= MAX_IMAGE ? buf : null;
}

export async function GET(req: Request, { params }: Ctx) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await params;
  if (!LINE_USER_ID.test(userId)) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const readToken = await markRead(userId);
  if (readToken) await markAsRead(readToken).catch(console.error);
  return NextResponse.json({ messages: await getMessages(userId) });
}

export async function POST(req: Request, { params }: Ctx) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await params;
  const body = (await req.json().catch(() => null)) as
    | { text?: string; image?: string; preview?: string }
    | null;
  if (!LINE_USER_ID.test(userId)) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  if (body?.image !== undefined) return sendImage(req, userId, body.image, body.preview);

  const text = body?.text?.trim();
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  try {
    await pushText(userId, text);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "LINE rejected the message" }, { status: 502 });
  }
  return NextResponse.json({ message: await saveMessage(userId, "out", text) });
}

async function sendImage(req: Request, userId: string, image: unknown, preview: unknown) {
  const original = decodeJpeg(image);
  const small = decodeJpeg(preview);
  if (!original || !small) {
    return NextResponse.json({ error: "Image must be a JPEG under 1 MB" }, { status: 400 });
  }
  const base = publicBaseUrl(req);
  if (!base) {
    return NextResponse.json(
      { error: "Set PUBLIC_BASE_URL to your public HTTPS address (e.g. the ngrok URL) to send images" },
      { status: 500 },
    );
  }

  const id = crypto.randomUUID();
  const previewId = crypto.randomUUID();
  await saveMedia(id, { type: "image/jpeg", data: original.toString("base64") });
  await saveMedia(previewId, { type: "image/jpeg", data: small.toString("base64") });

  try {
    await pushImage(userId, `${base}/api/media/${id}`, `${base}/api/media/${previewId}`);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "LINE rejected the image" }, { status: 502 });
  }
  return NextResponse.json({
    message: await saveMessage(userId, "out", "[image]", undefined, { type: "image", image: `/api/media/${id}` }),
  });
}
