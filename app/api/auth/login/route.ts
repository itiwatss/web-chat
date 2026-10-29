import { NextResponse } from "next/server";
import { checkCredentials, createToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!checkCredentials(username, password)) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  }
  const token = createToken(username);
  if (!token) {
    console.error("JWT_SECRET is missing or shorter than 32 characters");
    return NextResponse.json({ error: "Login is not configured on the server" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
