import { NextResponse } from "next/server";
import { SESSION_COOKIE_OPTIONS } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ ...SESSION_COOKIE_OPTIONS, value: "", maxAge: 0 });
  return res;
}
