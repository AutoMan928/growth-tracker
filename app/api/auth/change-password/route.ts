import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { writeFile, readFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ success: false, error: "请填写所有字段" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ success: false, error: "新密码至少 8 位" }, { status: 400 });
  }

  const currentHash = process.env.AUTH_PASSWORD_HASH ?? "";
  const isValid = await bcrypt.compare(currentPassword, currentHash);
  if (!isValid) {
    return NextResponse.json({ success: false, error: "当前密码错误" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  // Update .env file
  const envPath = path.join(process.cwd(), ".env");
  try {
    let content = await readFile(envPath, "utf-8");
    if (content.includes("AUTH_PASSWORD_HASH=")) {
      content = content.replace(/AUTH_PASSWORD_HASH="[^"]*"/, `AUTH_PASSWORD_HASH="${newHash}"`);
    } else {
      content += `\nAUTH_PASSWORD_HASH="${newHash}"\n`;
    }
    await writeFile(envPath, content, "utf-8");
    process.env.AUTH_PASSWORD_HASH = newHash;
  } catch {
    return NextResponse.json({ success: false, error: "无法更新密码文件" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
