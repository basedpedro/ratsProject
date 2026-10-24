"use server";

import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth";
import { errorState, type FormState } from "@/lib/form-state";
import { verifyPassword } from "@/lib/passwords";
import { collectFieldErrors, loginInput } from "@/lib/validation";

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 5 * 60 * 1000;

// Tentativas por e-mail, em memória. Suficiente para um app de equipe
// pequena e reinicia junto com o processo.
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(email: string): boolean {
  const entry = attempts.get(email);
  if (!entry) {
    return false;
  }
  if (entry.resetAt < Date.now()) {
    attempts.delete(email);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(email: string): void {
  const entry = attempts.get(email);
  if (!entry || entry.resetAt < Date.now()) {
    attempts.set(email, { count: 1, resetAt: Date.now() + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export async function signIn(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return errorState("Confira os campos.", collectFieldErrors(parsed.error));
  }

  const email = parsed.data.email.toLowerCase();

  if (isRateLimited(email)) {
    return errorState("Muitas tentativas. Espere alguns minutos e tente de novo.");
  }

  const person = await queryOne<{ id: string; password_hash: string }>(
    `select id, password_hash
       from people
      where lower(email) = $1 and password_hash is not null and active`,
    [email],
  );

  const passwordMatches = person
    ? await verifyPassword(parsed.data.password, person.password_hash)
    : false;

  if (!person || !passwordMatches) {
    registerFailure(email);
    return errorState("E-mail ou senha inválidos.");
  }

  attempts.delete(email);
  await startSession(person.id);
  redirect("/");
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/login");
}
