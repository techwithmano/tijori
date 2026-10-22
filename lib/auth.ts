import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production.");
    }
    return "tijori_dev_fallback_secret_change_in_production";
  }
  return secret;
}

const COOKIE_NAME = "tijori_session";
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionUser): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as SessionUser;
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(req?: NextRequest): Promise<SessionUser | null> {
  try {
    let token: string | undefined;

    if (req) {
      token = req.cookies.get(COOKIE_NAME)?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    }

    if (!token) return null;
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}

export const getSessionUser = getCurrentUser;

export function createSession(
  res: NextResponse,
  user: { _id?: any; id?: any; email: string; name: string }
): NextResponse {
  const userId = user._id ? user._id.toString() : user.id;
  const token = signToken({
    userId,
    email: user.email,
    name: user.name,
  });

  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}

export function destroySession(res: NextResponse): NextResponse {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
