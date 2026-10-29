"use client";

import { useState } from "react";
import { formatTime } from "@/lib/format";
import Avatar from "./Avatar";
import { useInbox } from "./InboxContext";
import Loading from "./Loading";

export default function ChatList() {
  const { convs, convsLoading, selected, select, logout, openQr } = useInbox();
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const shown = query
    ? convs.filter((c) => c.displayName.toLowerCase().includes(query))
    : convs;

  return (
    <aside className="ib-list" aria-label="Conversations">
      <div className="ib-head">
        <div className="ib-title">
          Chats
          <div className="ib-title-actions">
            <button
              className="ib-qr-btn"
              onClick={openQr}
              aria-label="Show LINE QR code"
              title="Show LINE QR code"
            >
              <ion-icon name="qr-code-outline" aria-hidden="true"></ion-icon>
            </button>
            <button className="ib-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
        <div className="ib-search">
          <input
            type="search"
            className="ib-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            placeholder="Search LINE name"
            aria-label="Search conversations by LINE name"
          />
        </div>
      </div>
      <div className="ib-convs">
        {convsLoading && <Loading label="Loading chats…" />}
        {!convsLoading && convs.length === 0 && (
          <p className="ib-empty">
            No messages yet. Send a message to your LINE OA from your phone and
            it will appear here.
          </p>
        )}
        {convs.length > 0 && shown.length === 0 && (
          <p className="ib-empty">No chats match “{search.trim()}”.</p>
        )}
        {shown.map((c) => (
          <button
            key={c.userId}
            className={`ib-user${c.userId === selected ? " active" : ""}`}
            onClick={() => select(c.userId)}
          >
            <Avatar conv={c} />
            <div className="ib-meta">
              <div className="ib-name">
                <span>{c.displayName}</span>
                <span className="ib-time">{formatTime(c.lastTs)}</span>
              </div>
              <div className="ib-last">{c.lastText}</div>
            </div>
            {c.unread > 0 && c.userId !== selected && (
              <span className="ib-badge">{c.unread}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
