"use server";

import { refresh } from "next/cache";
import { requirePersonForAction } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { isPgError } from "@/lib/db-errors";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { collectFieldErrors, personInput } from "@/lib/validation";

export async function savePerson(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  const parsed = personInput.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    color: formData.get("color"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return errorState("Confira os campos.", collectFieldErrors(parsed.error));
  }

  const person = parsed.data;
  const email = person.email.toLowerCase();

  try {
    if (id) {
      await query(
        `update people
            set name = $2, email = $3, role = $4, color = $5, active = $6
          where id = $1`,
        [id, person.name, email, person.role, person.color, person.active],
      );
    } else {
      await query(
        `insert into people (name, email, role, color, active)
         values ($1, $2, $3, $4, $5)`,
        [person.name, email, person.role, person.color, person.active],
      );
    }
  } catch (error) {
    if (isPgError(error, "23505")) {
      return errorState("Já existe uma pessoa com esse e-mail.");
    }
    throw error;
  }

  refresh();
  return successState(id ? "Pessoa atualizada." : "Pessoa cadastrada.");
}

export async function deletePerson(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return errorState("Pessoa não encontrada.");
  }

  const person = await queryOne<{ has_password: boolean }>(
    `select (password_hash is not null) as has_password from people where id = $1`,
    [id],
  );

  if (person?.has_password) {
    return errorState(
      "Essa pessoa tem acesso ao sistema. Desative em vez de excluir.",
    );
  }

  await query("delete from people where id = $1", [id]);
  refresh();
  return successState("Pessoa excluída.");
}
