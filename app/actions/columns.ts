"use server";

import { refresh } from "next/cache";
import { requirePersonForAction } from "@/lib/auth";
import { query, queryOne, withTransaction } from "@/lib/db";
import { isPgError } from "@/lib/db-errors";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { collectFieldErrors, columnInput } from "@/lib/validation";

export async function saveColumn(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");

  const parsed = columnInput.safeParse({
    name: formData.get("name"),
    statusId: formData.get("statusId"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return errorState("Confira os campos.", collectFieldErrors(parsed.error));
  }

  const column = parsed.data;

  try {
    if (id) {
      await query(
        `update board_columns
            set name = $2, status_id = $3, sort_order = $4
          where id = $1`,
        [id, column.name, column.statusId, column.sortOrder],
      );
    } else {
      const project = await queryOne<{ id: string }>(
        "select id from projects where id = $1",
        [projectId],
      );

      if (!project) {
        return errorState("Projeto não encontrado.");
      }

      await query(
        `insert into board_columns (project_id, name, status_id, sort_order)
         values ($1, $2, $3, $4)`,
        [projectId, column.name, column.statusId, column.sortOrder],
      );
    }
  } catch (error) {
    if (isPgError(error, "23503")) {
      return errorState("O status escolhido não existe mais.");
    }
    throw error;
  }

  refresh();
  return successState(id ? "Coluna atualizada." : "Coluna criada.");
}

export async function deleteColumn(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return errorState("Coluna não encontrada.");
  }

  // O not exists e o delete são a mesma instrução: uma tarefa criada
  // no meio do caminho não é apagada em cascata sem aviso.
  const deleted = await query<{ project_id: string }>(
    `delete from board_columns
      where id = $1
        and not exists (select 1 from tasks where column_id = $1)
      returning project_id`,
    [id],
  );

  if (deleted.length === 0) {
    return errorState("Essa coluna ainda tem tarefas. Mova ou exclua antes.");
  }

  await renumberColumns(deleted[0].project_id);

  refresh();
  return successState("Coluna excluída.");
}

export async function moveColumn(formData: FormData): Promise<void> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");

  if (!id || (direction !== "up" && direction !== "down")) {
    return;
  }

  await withTransaction(async (client) => {
    const currentResult = await client.query<{
      id: string;
      project_id: string;
      sort_order: number;
    }>("select id, project_id, sort_order from board_columns where id = $1", [id]);

    const current = currentResult.rows[0];
    if (!current) {
      return;
    }

    const neighbourResult = await client.query<{ id: string; sort_order: number }>(
      direction === "up"
        ? `select id, sort_order from board_columns
            where project_id = $1 and sort_order < $2
            order by sort_order desc limit 1`
        : `select id, sort_order from board_columns
            where project_id = $1 and sort_order > $2
            order by sort_order asc limit 1`,
      [current.project_id, current.sort_order],
    );

    const neighbour = neighbourResult.rows[0];
    if (!neighbour) {
      return;
    }

    await client.query("update board_columns set sort_order = $2 where id = $1", [
      current.id,
      neighbour.sort_order,
    ]);
    await client.query("update board_columns set sort_order = $2 where id = $1", [
      neighbour.id,
      current.sort_order,
    ]);
  });

  refresh();
}

// Depois de excluir uma coluna, as posições ficam com buracos.
// Renumerar mantém a ordem previsível e o próximo insert no fim.
async function renumberColumns(projectId: string): Promise<void> {
  if (!projectId) {
    return;
  }

  await withTransaction(async (client) => {
    const result = await client.query<{ id: string }>(
      "select id from board_columns where project_id = $1 order by sort_order asc",
      [projectId],
    );

    for (let index = 0; index < result.rows.length; index += 1) {
      await client.query("update board_columns set sort_order = $2 where id = $1", [
        result.rows[index].id,
        index,
      ]);
    }
  });
}
