"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, onUnauthorized } from "@/lib/api";
import { registerIonicons } from "@/lib/ionicons";
import type { ConversationSummary as Conv } from "@/lib/types";

type InboxState = {
  locked: boolean;
  unlock: () => void;
  logout: () => Promise<void>;
  convs: Conv[];
  convsLoading: boolean;
  selected: string | null;
  select: (userId: string | null) => void;
  current: Conv | undefined;
  qrOpen: boolean;
  openQr: () => void;
  closeQr: () => void;
};

const InboxContext = createContext<InboxState | null>(null);

export function useInbox(): InboxState {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used inside <InboxProvider>");
  return ctx;
}

export function InboxProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => onUnauthorized(() => setLocked(true)), []);

  useEffect(() => {
    registerIonicons();
  }, []);

  useEffect(() => {
    if (locked) return;
    let stop = false;
    const load = async () => {
      try {
        const { data } = await api.get<{ conversations: Conv[] }>("/api/conversations");
        if (!stop) setConvs(data.conversations);
      } catch {
      } finally {
        if (!stop) setConvsLoading(false);
      }
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [locked]);

  const unlock = useCallback(() => {
    setLocked(false);
    setQrOpen(true);
  }, []);
  const openQr = useCallback(() => setQrOpen(true), []);
  const closeQr = useCallback(() => setQrOpen(false), []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout").catch(() => {});
    setConvs([]);
    setSelected(null);
    setConvsLoading(true);
    setQrOpen(false);
    setLocked(true);
  }, []);

  const value: InboxState = {
    locked,
    unlock,
    logout,
    convs,
    convsLoading,
    selected,
    select: setSelected,
    current: convs.find((c) => c.userId === selected),
    qrOpen,
    openQr,
    closeQr,
  };

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}
