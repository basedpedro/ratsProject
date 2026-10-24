"use server";

import { refresh } from "next/cache";
import { requirePersonForAction } from "@/lib/auth";
import { query, queryOne, withTransaction } from "@/lib/db";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { collectFieldErrors, moveTaskInput, taskInput } from "@/lib/validation";

type ColumnRow = { id: string; project_id: string };

export async function createTask(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const projectId = String(formData.get("projectId") ?? "");

  const parsed = taskInput.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    columnId: formData.get("columnId"),
    assigneeId: formData.get("assigneeId") ?? "",
    priority: formData.get("priority") ?? 2,
    dueDate: formData.get("dueDate") ?? "",
  });

  if (!parsed.success) {
    return errorState("Confira os campos.", collectFieldErrors(parsed.error));
  }

  const task = parsed.data;
  const column = await queryOne<ColumnRow>(
    "select id, project_id from board_columns where id = $1",
    [task.columnId],
  );

  if (!column || column.project_id !== projectId) {
    return errorState("Coluna não pertence a este projeto.");
  }

  await query(
    `insert into tasks
       (project_id, column_id, title, description, assignee_id, priority, due_date, sort_order)
     values ($1, $2, $3, $4, $5, $6, $7,
       (select coalesce(max(sort_order) + 1, 0) from tasks where column_id = $2))`,
    [
      projectId,
      column.id,
      task.title,
      task.description,
      task.assigneeId,
      task.priority,
      task.dueDate,
    ],
  );

  refresh();
  return successState("Tarefa criada.");
}

export async function updateTask(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");

  const parsed = taskInput.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    columnId: formData.get("columnId"),
    assigneeId: formData.get("assigneeId") ?? "",
    priority: formData.get("priority") ?? 2,
    dueDate: formData.get("dueDate") ?? "",
  });

  if (!parsed.success) {
    return errorState("Confira os campos.", collectFieldErrors(parsed.error));
  }

  const task = parsed.data;
  const current = await queryOne<{ column_id: string }>(
    "select column_id from tasks where id = $1",
    [id],
  );

  if (!current) {
    return errorState("Tarefa não encontrada.");
  }

  await query(
    `update tasks
        set title = $2, description = $3, assignee_id = $4,
            priority = $5, due_date = $6, updated_at = now()
      where id = $1`,
    [id, task.title, task.description, task.assigneeId, task.priority, task.dueDate],
  );

  if (current.column_id !== task.columnId) {
    const column = await queryOne<ColumnRow>(
      "select id, project_id from board_columns where id = $1",
      [task.columnId],
    );

    if (!column) {
      return errorState("Coluna não encontrada.");
    }

    const position = await queryOne<{ next_order: number }>(
      "select coalesce(max(sort_order) + 1, 0) as next_order from tasks where column_id = $1 and id <> $2",
      [task.columnId, id],
    );

    await query(
      "update tasks set column_id = $2, sort_order = $3, updated_at = now() where id = $1",
      [id, task.columnId, position?.next_order ?? 0],
    );
  }

  refresh();
  return successState("Tarefa salva.");
}

export async function deleteTask(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return errorState("Tarefa não encontrada.");
  }

  await query("delete from tasks where id = $1", [id]);
  refresh();
  return successState("Tarefa excluída.");
}

export type MoveTaskResult = { ok: true } | { ok: false; error: string };

// Chamada ao soltar um cartão no quadro. Recebe a tarefa, a coluna de destino
// e, opcionalmente, o cartão antes do qual ela deve entrar.
export async function moveTask(input: unknown): Promise<MoveTaskResult> {
  await requirePersonForAction();

  const parsed = moveTaskInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Não foi possível mover a tarefa." };
  }

  const { taskId, columnId, beforeTaskId } = parsed.data;

  try {
    await withTransaction(async (client) => {
      const taskResult = await client.query<{ id: string }>(
        "select id from tasks where id = $1 for update",
        [taskId],
      );

      if (taskResult.rowCount === 0) {
        throw new Error("Tarefa não encontrada.");
      }

      const targetResult = await client.query<{ id: string }>(
        `select id from tasks
          where column_id = $1 and id <> $2
          order by sort_order asc, created_at asc
          for update`,
        [columnId, taskId],
      );

      const orderedIds = targetResult.rows.map((row) => row.id);

      let insertIndex = orderedIds.length;
      if (beforeTaskId) {
        const foundIndex = orderedIds.indexOf(beforeTaskId);
        if (foundIndex >= 0) {
          insertIndex = foundIndex;
        }
      }

      orderedIds.splice(insertIndex, 0, taskId);

      await client.query(
        "update tasks set column_id = $2, updated_at = now() where id = $1",
        [taskId, columnId],
      );

      for (let index = 0; index < orderedIds.length; index += 1) {
        await client.query("update tasks set sort_order = $2 where id = $1", [
          orderedIds[index],
          index,
        ]);
      }
    });
  } catch {
    return { ok: false, error: "Não foi possível mover a tarefa." };
  }

  refresh();
  return { ok: true };
}
