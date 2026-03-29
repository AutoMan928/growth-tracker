import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSession, SESSION_COOKIE_OPTIONS } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "请输入用户名和密码" }, { status: 400 });
    }

    const validUsername = process.env.AUTH_USERNAME ?? "admin";
    const hashedPassword = process.env.AUTH_PASSWORD_HASH ?? "";

    // Debug log（确认后可删除）
    console.log("[login] received username:", username);
    console.log("[login] validUsername:", validUsername);
    console.log("[login] hashLength:", hashedPassword.length);
    console.log("[login] hashStart:", hashedPassword.substring(0, 7));

    if (username !== validUsername) {
      console.log("[login] username mismatch");
      return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
    }

    if (!hashedPassword) {
      return NextResponse.json({ success: false, error: "服务器未配置密码" }, { status: 500 });
    }

    // 使用同步比较避免异步问题
    const isValid = bcrypt.compareSync(password, hashedPassword);
    console.log("[login] bcrypt result:", isValid);

    if (!isValid) {
      return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
    }

    const token = await signSession({ userId: "1", username: validUsername });
    const res = NextResponse.json({ success: true });
    res.cookies.set({ ...SESSION_COOKIE_OPTIONS, value: token });
    return res;
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误: " + String(err) }, { status: 500 });
  }
}
