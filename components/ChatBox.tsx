"use client";

import { useEffect, useRef, useState } from "react";
import { api, errorMessage, isUnauthorized } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { toJpegBase64 } from "@/lib/image";
import { displayType } from "@/lib/messages";
import type { ConversationSummary as Conv, Message as Msg } from "@/lib/types";
import Avatar from "./Avatar";
import { useInbox } from "./InboxContext";
import Loading from "./Loading";
import MessageContent from "./MessageContent";

export default function ChatBox() {
  const { current, select } = useInbox();
  return (
    <section className="ib-thread" aria-label="Chat">
      {current ? (
        <Thread key={current.userId} conv={current} onBack={() => select(null)} />
      ) : (
        <p className="ib-empty">Select a user to read and reply.</p>
      )}
    </section>
  );
}

function Thread({ conv, onBack }: { conv: Conv; onBack: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const { data } = await api.get<{ messages: Msg[] }>(`/api/conversations/${conv.userId}`);
        if (!stop) setMessages(data.messages);
      } catch {
      } finally {
        if (!stop) setLoaded(true);
      }
    };
    load();
    const t = setInterval(load, 2500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [conv.userId]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages.length, loaded]);

  async function post(build: () => Promise<object>): Promise<boolean> {
    if (sending) return false;
    setSending(true);
    setError("");
    try {
      const { data } = await api.post<{ message: Msg }>(
        `/api/conversations/${conv.userId}`,
        await build(),
      );
      setMessages((m) => [...m, data.message]);
      return true;
    } catch (err) {
      if (!isUnauthorized(err)) setError(errorMessage(err, "Send failed"));
      return false;
    } finally {
      setSending(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (value && (await post(async () => ({ text: value })))) setText("");
  }

  async function sendImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await post(async () => ({
      image: await toJpegBase64(file, 1600),
      preview: await toJpegBase64(file, 240),
    }));
  }

  return (
    <>
      <div className="ib-thead">
        <button className="ib-back" onClick={onBack} aria-label="Back to list">
          <ion-icon name="arrow-back-outline" aria-hidden="true"></ion-icon>
        </button>
        <Avatar conv={conv} />
        {conv.displayName}
      </div>
      <div className="ib-body" ref={bodyRef} aria-live="polite">
        {!loaded && <Loading label="Loading messages…" />}
        {loaded && messages.map((m) => (
          <div key={m.id} className={`ib-msg ${m.dir} ${displayType(m)}`}>
            <MessageContent msg={m} />
            <small>{formatTime(m.ts)}</small>
          </div>
        ))}
      </div>
      {error && (
        <p className="ib-error" role="alert">
          {error}
        </p>
      )}
      {conv.blocked ? (
        <p className="ib-hint ib-hint-error ib-blocked" role="status">
          <ion-icon name="alert-circle" aria-hidden="true"></ion-icon>
          <span>This user has blocked your LINE OA. You can&apos;t send messages until they add it again.</span>
        </p>
      ) : (
      <form className="ib-form" onSubmit={send}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={sendImage}
        />
        <button
          type="button"
          className="ib-attach"
          onClick={() => fileRef.current?.click()}
          disabled={sending}
          aria-label="Send image"
          title="Send image"
        >
          <ion-icon name="image-outline" aria-hidden="true"></ion-icon>
        </button>
        <input
          className="ib-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Enter a message`}
          maxLength={2000}
          aria-label="Message"
        />
        <button className="ib-send" disabled={sending || !text.trim()}>
          {sending ? "Sending" : "Send"}
        </button>
      </form>
      )}
    </>
  );
}
