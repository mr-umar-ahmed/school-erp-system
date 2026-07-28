// Edge-safe JWT helpers (used by both middleware and server code).
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

export interface SessionPayload {
  sub: string; // user id
  role: UserRole;
  institutionId: string | null;
  name: string;
  [key: string]: unknown;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}
