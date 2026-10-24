import { createHmac, timingSafeEqual } from "node:crypto";

// Assinatura e leitura do cookie de sessão. Fica separado de lib/auth.ts
// porque o proxy roda antes da renderização e não pode tocar no banco.

export const SESSION_COOKIE = "rpm_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET não definida.");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(personId: string, nowMs = Date.now()): string {
  const expiresAtSeconds = Math.floor(nowMs / 1000) + SESSION_DURATION_SECONDS;
  const payload = `${personId}.${expiresAtSeconds}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(
  token: string,
  nowMs = Date.now(),
): { personId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [personId, expiresAtText, signature] = parts;
  const payload = `${personId}.${expiresAtText}`;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  const expiresAtSeconds = Number(expiresAtText);
  if (!Number.isFinite(expiresAtSeconds) || expiresAtSeconds * 1000 < nowMs) {
    return null;
  }

  return { personId };
}
