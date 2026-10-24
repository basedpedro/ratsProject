import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { queryOne } from "@/lib/db";
import type { Person } from "@/lib/domain";
import { personRowToDomain, type PersonRow } from "@/lib/rows";
import {
  createSessionToken,
  readSessionToken,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/session-token";

export async function startSession(personId: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionToken(personId), {
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

  const session = readSessionToken(token);
  if (!session) {
    return null;
  }

  const row = await queryOne<PersonRow>(
    `select id, name, email, role, color, active
       from people
      where id = $1 and password_hash is not null and active`,
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
