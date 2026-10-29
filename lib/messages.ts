import type { LineEmoji, Message, MessageType } from "./types";

const LINE_CDN = "https://stickershop.line-scdn.net";
const SHOWN_TYPES: readonly MessageType[] = ["text", "image", "sticker"];

export function toMessageType(lineType: string): MessageType {
  return SHOWN_TYPES.find((t) => t === lineType) ?? "other";
}

export function previewText(lineType: string, text?: string): string {
  return lineType === "text" ? (text ?? "") : `[${lineType}]`;
}

export function displayType(msg: Message): MessageType {
  switch (msg.type) {
    case "image":
      return msg.image ? "image" : "other";
    case "sticker":
      return msg.stickerId ? "sticker" : "other";
    case "text":
    case "other":
      return msg.type;
    default:
      return msg.image ? "image" : "text";
  }
}

export const stickerUrl = (stickerId: string) =>
  `${LINE_CDN}/stickershop/v1/sticker/${stickerId}/android/sticker.png`;

export const emojiUrl = ({ productId, emojiId }: Pick<LineEmoji, "productId" | "emojiId">) =>
  `${LINE_CDN}/sticonshop/v1/sticon/${productId}/android/${emojiId}.png`;

export function splitEmojis(text: string, emojis: LineEmoji[] = []): (string | LineEmoji)[] {
  const parts: (string | LineEmoji)[] = [];
  let pos = 0;
  for (const e of [...emojis].sort((a, b) => a.index - b.index)) {
    if (e.index > pos) parts.push(text.slice(pos, e.index));
    parts.push(e);
    pos = e.index + e.length;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return parts;
}
