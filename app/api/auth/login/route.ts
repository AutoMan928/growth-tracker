import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSession, SESSION_COOKIE_OPTIONS } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ success: false, error: "请输入用户名和密码" }, { status: 400 });
  }

  const validUsername = process.env.AUTH_USERNAME ?? "admin";
  const hashedPassword = process.env.AUTH_PASSWORD_HASH ?? "";

  if (username !== validUsername) {
    return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
  }

  if (!hashedPassword) {
    return NextResponse.json({ success: false, error: "服务器未配置密码，请联系管理员" }, { status: 500 });
  }

  const isValid = await bcrypt.compare(password, hashedPassword);
  if (!isValid) {
    return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
  }

  const token = await signSession({ userId: "1", username: validUsername });

  const res = NextResponse.json({ success: true });
  res.cookies.set({ ...SESSION_COOKIE_OPTIONS, value: token });
  return res;
}
