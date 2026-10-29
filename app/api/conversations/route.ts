import { NextResponse } from "next/server";
import { authorized } from "@/lib/auth";
import { listConversations } from "@/lib/store";
import type { ConversationSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const conversations: ConversationSummary[] = (await listConversations()).map(
    ({ readToken: _, ...c }) => c,
  );
  return NextResponse.json({ conversations });
}
