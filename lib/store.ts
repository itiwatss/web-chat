import { Redis } from "@upstash/redis";
import type { Conversation, Media, Message } from "./types";

type Backend = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  hget<T>(key: string, field: string): Promise<T | null>;
  hset(key: string, field: string, value: unknown): Promise<void>;
  hvals<T>(key: string): Promise<T[]>;
  rpush(key: string, value: unknown): Promise<void>;
  lrange<T>(key: string, lastN: number): Promise<T[]>;
};

function createBackend(): Backend {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    const r = new Redis({ url, token });
    return {
      async get<T>(k: string) {
        return ((await r.get<T>(k)) ?? null) as T | null;
      },
      async set(k, v) {
        await r.set(k, v);
      },
      async hget<T>(k: string, f: string) {
        return ((await r.hget<T>(k, f)) ?? null) as T | null;
      },
      async hset(k, f, v) {
        await r.hset(k, { [f]: v });
      },
      async hvals<T>(k: string) {
        return (await r.hvals(k)) as T[];
      },
      async rpush(k, v) {
        await r.rpush(k, v);
      },
      async lrange<T>(k: string, n: number) {
        return (await r.lrange(k, -n, -1)) as T[];
      },
    };
  }

  const g = globalThis as unknown as {
    __mem?: {
      s?: Map<string, unknown>;
      h: Map<string, Map<string, unknown>>;
      l: Map<string, unknown[]>;
    };
  };
  const mem = (g.__mem ??= { s: new Map(), h: new Map(), l: new Map() });
  const strings = (mem.s ??= new Map());
  return {
    async get<T>(k: string) {
      return (strings.get(k) as T | undefined) ?? null;
    },
    async set(k, v) {
      strings.set(k, v);
    },
    async hget<T>(k: string, f: string) {
      return (mem.h.get(k)?.get(f) as T | undefined) ?? null;
    },
    async hset(k, f, v) {
      if (!mem.h.has(k)) mem.h.set(k, new Map());
      mem.h.get(k)!.set(f, v);
    },
    async hvals<T>(k: string) {
      return [...(mem.h.get(k)?.values() ?? [])] as T[];
    },
    async rpush(k, v) {
      const a = mem.l.get(k) ?? [];
      a.push(v);
      mem.l.set(k, a);
    },
    async lrange<T>(k: string, n: number) {
      return (mem.l.get(k) ?? []).slice(-n) as T[];
    },
  };
}

const backend = createBackend();
const CONVS = "convs";
const msgKey = (userId: string) => `msgs:${userId}`;
const mediaKey = (id: string) => `media:${id}`;

export const saveMedia = (id: string, media: Media) =>
  backend.set(mediaKey(id), media);

export const getMedia = (id: string) => backend.get<Media>(mediaKey(id));

export const getConversation = (userId: string) =>
  backend.hget<Conversation>(CONVS, userId);

export async function listConversations(): Promise<Conversation[]> {
  const all = await backend.hvals<Conversation>(CONVS);
  return all.sort((a, b) => b.lastTs - a.lastTs);
}

export const getMessages = (userId: string) =>
  backend.lrange<Message>(msgKey(userId), 200);

export async function saveMessage(
  userId: string,
  dir: Message["dir"],
  text: string,
  profile?: { displayName?: string; pictureUrl?: string },
  extra?: Partial<Pick<Message, "type" | "emojis" | "image" | "stickerId">> & {
    readToken?: string;
  },
): Promise<Message> {
  const { readToken, ...fields } = extra ?? {};
  const now = Date.now();
  const msg: Message = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    dir,
    type: "text",
    text,
    ts: now,
    ...fields,
  };
  await backend.rpush(msgKey(userId), msg);

  const prev = await getConversation(userId);
  const conv: Conversation = {
    userId,
    displayName: profile?.displayName ?? prev?.displayName ?? "LINE user",
    pictureUrl: profile?.pictureUrl ?? prev?.pictureUrl,
    lastText: text,
    lastTs: now,
    unread: dir === "in" ? (prev?.unread ?? 0) + 1 : 0,
    readToken: readToken ?? prev?.readToken,
    blocked: dir === "in" ? false : prev?.blocked,
  };
  await backend.hset(CONVS, userId, conv);
  return msg;
}

export const FOLLOW_TEXT = "Added as friend";

export async function saveFollow(
  userId: string,
  profile: { displayName?: string; pictureUrl?: string },
): Promise<void> {
  const prev = await getConversation(userId);
  const conv: Conversation = {
    userId,
    displayName: profile.displayName ?? prev?.displayName ?? "LINE user",
    pictureUrl: profile.pictureUrl ?? prev?.pictureUrl,
    lastText: FOLLOW_TEXT,
    lastTs: Date.now(),
    unread: prev?.unread ?? 0,
    readToken: prev?.readToken,
    blocked: false,
  };
  await backend.hset(CONVS, userId, conv);
}

export async function saveUnfollow(userId: string): Promise<void> {
  const prev = await getConversation(userId);
  if (prev) await backend.hset(CONVS, userId, { ...prev, blocked: true });
}

export async function markRead(userId: string): Promise<string | undefined> {
  const conv = await getConversation(userId);
  if (!conv || (conv.unread === 0 && !conv.readToken)) return undefined;
  const { readToken, ...rest } = conv;
  await backend.hset(CONVS, userId, { ...rest, unread: 0 });
  return readToken;
}
