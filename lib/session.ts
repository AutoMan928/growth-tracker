import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "gt_session";
const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || "CHANGE_ME_PLEASE_USE_AUTH_SECRET");

export interface SessionPayload {
  userId: string;
  username: string;
  exp?: number;
}

/** 签发 JWT，有效期 30 天 */
export async function signSession(payload: Omit<SessionPayload, "exp">) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(await secret());
}

/** 验证并解析 JWT */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, await secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** 从服务端 Cookie 获取当前会话（用于 Server Components / API Routes） */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** 从 Request 对象获取会话（用于 Middleware） */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** 写入 session Cookie 的配置 */
export const SESSION_COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 天
};
