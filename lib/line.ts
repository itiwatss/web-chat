import crypto from "node:crypto";

const API = "https://api.line.me/v2/bot";

function token(): string {
  const t = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!t) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");
  return t;
}

async function push(to: string, message: Record<string, string>): Promise<void> {
  const res = await fetch(`${API}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({ to, messages: [message] }),
  });
  if (!res.ok)
    throw new Error(`LINE push failed: ${res.status} ${await res.text()}`);
}

export const pushText = (to: string, text: string) =>
  push(to, { type: "text", text });

export const pushImage = (to: string, originalContentUrl: string, previewImageUrl: string) =>
  push(to, { type: "image", originalContentUrl, previewImageUrl });

export async function getProfile(
  userId: string,
): Promise<{ displayName?: string; pictureUrl?: string }> {
  try {
    const res = await fetch(`${API}/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) return {};
    return (await res.json()) as { displayName?: string; pictureUrl?: string };
  } catch {
    return {};
  }
}

export async function markAsRead(markAsReadToken: string): Promise<void> {
  const res = await fetch(`${API}/chat/markAsRead`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({ markAsReadToken }),
  });
  if (!res.ok)
    throw new Error(`LINE markAsRead failed: ${res.status} ${await res.text()}`);
}

export function getContent(messageId: string): Promise<Response> {
  return fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
}

export function verifySignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  const given = Buffer.from(signature, "base64");
  return (
    given.length === expected.length && crypto.timingSafeEqual(given, expected)
  );
}
