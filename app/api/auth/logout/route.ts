import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
  return destroySession(response);
}
