"use server";

import { refresh } from "next/cache";
import { requirePersonForAction } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { isPgError } from "@/lib/db-errors";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { collectFieldErrors, statusInput } from "@/lib/validation";

export async function saveStatus(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  const parsed = statusInput.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    kind: formData.get("kind"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return errorState("Confira os campos.", collectFieldErrors(parsed.error));
  }

  const status = parsed.data;

  try {
    if (id) {
      await query(
        `update statuses
            set name = $2, color = $3, kind = $4, sort_order = $5
          where id = $1`,
        [id, status.name, status.color, status.kind, status.sortOrder],
      );
    } else {
      await query(
        `insert into statuses (name, color, kind, sort_order)
         values ($1, $2, $3, $4)`,
        [status.name, status.color, status.kind, status.sortOrder],
      );
    }
  } catch (error) {
    if (isPgError(error, "23503")) {
      return errorState("Não foi possível salvar o status.");
    }
    throw error;
  }

  refresh();
  return successState(id ? "Status atualizado." : "Status cadastrado.");
}

export async function deleteStatus(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return errorState("Status não encontrado.");
  }

  const usage = await queryOne<{ total: number }>(
    "select count(*)::int as total from board_columns where status_id = $1",
    [id],
  );

  if (usage && usage.total > 0) {
    return errorState(
      `Esse status sustenta ${usage.total} coluna(s). Troque o status da coluna antes de excluir.`,
    );
  }

  try {
    await query("delete from statuses where id = $1", [id]);
  } catch (error) {
    if (isPgError(error, "23503")) {
      return errorState("Uma coluna passou a usar esse status. Troque antes de excluir.");
    }
    throw error;
  }

  refresh();
  return successState("Status excluído.");
}
