"use client";

import { useState } from "react";
import { displayType, emojiUrl, splitEmojis, stickerUrl } from "@/lib/messages";
import type { LineEmoji, Message } from "@/lib/types";

export default function MessageContent({ msg }: { msg: Message }) {
  switch (displayType(msg)) {
    case "image":
      return <ImageMessage src={msg.image!} />;
    case "sticker":
      return <StickerMessage stickerId={msg.stickerId!} />;
    case "text":
      return <TextMessage text={msg.text} emojis={msg.emojis} />;
    default:
      return <span className="ib-other">{msg.text}</span>;
  }
}

function TextMessage({ text, emojis }: { text: string; emojis?: LineEmoji[] }) {
  return (
    <>
      {splitEmojis(text, emojis).map((part, i) =>
        typeof part === "string" ? (
          part
        ) : (
          <img key={i} className="ib-emoji" src={emojiUrl(part)} alt="LINE emoji" />
        ),
      )}
    </>
  );
}

function ImageMessage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="ib-other">[image unavailable]</span>;
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img className="ib-img" src={src} alt="Image" loading="lazy" onError={() => setFailed(true)} />
    </a>
  );
}

function StickerMessage({ stickerId }: { stickerId: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="ib-other">[sticker]</span>;
  return (
    <img
      className="ib-sticker"
      src={stickerUrl(stickerId)}
      alt="Sticker"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
