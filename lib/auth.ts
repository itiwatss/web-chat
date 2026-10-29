import crypto from "node:crypto";

export const SESSION_COOKIE = "inbox_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function secret(): string | null {
  const s = process.env.JWT_SECRET;
  return s && s.length >= 32 ? s : null;
}

const sign = (data: string, key: string) =>
  crypto.createHmac("sha256", key).update(data).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const h = (s: string) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(h(a), h(b));
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  const okUser = safeEqual(username, u);
  const okPass = safeEqual(password, p);
  return okUser && okPass;
}

export function createToken(username: string): string | null {
  const key = secret();
  if (!key) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: username, iat: now, exp: now + SESSION_MAX_AGE })).toString("base64url");
  return `${header}.${payload}.${sign(`${header}.${payload}`, key)}`;
}

export function verifyToken(token: string): { sub: string } | null {
  const key = secret();
  const [header, payload, sig] = token.split(".");
  if (!key || !header || !payload || !sig) return null;
  if (!safeEqual(sig, sign(`${header}.${payload}`, key))) return null;
  try {
    const { alg } = JSON.parse(Buffer.from(header, "base64url").toString());
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (alg !== "HS256" || typeof claims.exp !== "number" || claims.exp < Date.now() / 1000) return null;
    return { sub: String(claims.sub) };
  } catch {
    return null;
  }
}

export function authorized(req: Request): boolean {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return !!token && !!verifyToken(token);
}
