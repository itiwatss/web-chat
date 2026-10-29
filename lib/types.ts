export type MessageType = "text" | "image" | "sticker" | "other";
export type MessageDir = "in" | "out";

export type LineEmoji = {
  index: number;
  length: number;
  productId: string;
  emojiId: string;
};

export type Message = {
  id: string;
  dir: MessageDir;
  type: MessageType;
  text: string;
  ts: number;
  emojis?: LineEmoji[];
  image?: string;
  stickerId?: string;
};

export type Conversation = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  lastText: string;
  lastTs: number;
  unread: number;
  readToken?: string;
  blocked?: boolean;
};

export type ConversationSummary = Omit<Conversation, "readToken">;

export type Media = { type: string; data: string };
