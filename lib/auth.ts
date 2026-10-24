import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { queryOne } from "@/lib/db";
import type { Person } from "@/lib/domain";
import { personRowToDomain, type PersonRow } from "@/lib/rows";

const SESSION_COOKIE = "rpm_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

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

function encodeSession(personId: string, expiresAtSeconds: number): string {
  const payload = `${personId}.${expiresAtSeconds}`;
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): { personId: string; expiresAtSeconds: number } | null {
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
  if (!Number.isFinite(expiresAtSeconds) || expiresAtSeconds * 1000 < Date.now()) {
    return null;
  }

  return { personId, expiresAtSeconds };
}

export async function startSession(personId: string): Promise<void> {
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, encodeSession(personId, expiresAtSeconds), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// cache() evita repetir a consulta quando layout e página pedem o usuário
// na mesma requisição.
export const getCurrentPerson = cache(async (): Promise<Person | null> => {
  // A sessão é lida a cada requisição, nunca no prerender.
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = decodeSession(token);
  if (!session) {
    return null;
  }

  const row = await queryOne<PersonRow>(
    `select id, name, email, role, color, active
       from people
      where id = $1 and password_hash is not null`,
    [session.personId],
  );

  return row ? personRowToDomain(row) : null;
});

export async function requirePerson(): Promise<Person> {
  const person = await getCurrentPerson();
  if (!person) {
    redirect("/login");
  }
  return person;
}

// Server actions são chamáveis por POST direto, então cada action também
// confere a sessão em vez de confiar só no proxy.
export async function requirePersonForAction(): Promise<Person> {
  const person = await getCurrentPerson();
  if (!person) {
    throw new Error("Sessão expirada. Entre novamente.");
  }
  return person;
}
