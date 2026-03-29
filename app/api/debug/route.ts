import { NextResponse } from "next/server";

export async function GET() {
  const hash = process.env.AUTH_PASSWORD_HASH ?? "";
  return NextResponse.json({
    username: process.env.AUTH_USERNAME,
    hashLength: hash.length,
    hashStart: hash.substring(0, 10),
    hashEnd: hash.substring(hash.length - 6),
    nodeEnv: process.env.NODE_ENV,
  });
}
