import { NextResponse } from "next/server";
import { getProfile, verifySignature } from "@/lib/line";
import { previewText, toMessageType } from "@/lib/messages";
import { getConversation, saveMessage } from "@/lib/store";
import type { LineEmoji } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LineEvent = {
  type: string;
  source?: { type?: string; userId?: string };
  message?: {
    id: string;
    type: string;
    text?: string;
    contentProvider?: { type: "line" | "external"; originalContentUrl?: string };
    stickerId?: string;
    markAsReadToken?: string;
    emojis?: LineEmoji[];
  };
};

type LineMessage = NonNullable<LineEvent["message"]>;

function imageUrl(m: LineMessage): string | undefined {
  if (m.type !== "image") return undefined;
  if (m.contentProvider?.type === "external") return m.contentProvider.originalContentUrl;
  return `/api/line/content/${m.id}`;
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-line-signature"))) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  const { events = [] } = JSON.parse(raw) as { events?: LineEvent[] };

  for (const ev of events) {
    const userId = ev.source?.userId;
    if (ev.source?.type !== "user" || !userId || ev.type !== "message" || !ev.message) continue;

    const text = previewText(ev.message.type, ev.message.text);
    const existing = await getConversation(userId);
    const profile = existing?.displayName && existing.displayName !== "LINE user" ? undefined : await getProfile(userId);
    const { emojis } = ev.message;
    const type = toMessageType(ev.message.type);
    await saveMessage(userId, "in", text, profile, {
      type,
      image: imageUrl(ev.message),
      stickerId: type === "sticker" ? ev.message.stickerId : undefined,
      readToken: ev.message.markAsReadToken,
      ...(emojis?.length && {
        emojis: emojis.map(({ index, length, productId, emojiId }) => ({ index, length, productId, emojiId })),
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
