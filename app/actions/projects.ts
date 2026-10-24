"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requirePersonForAction } from "@/lib/auth";
import { query, queryOne, withTransaction } from "@/lib/db";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { collectFieldErrors, projectInput } from "@/lib/validation";

type StatusKindRow = { id: string; kind: string };

const DEFAULT_COLUMN_NAMES: Record<string, string> = {
  todo: "entrada",
  doing: "em andamento",
  done: "concluído",
};

export async function createProject(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const parsed = projectInput.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return errorState("Confira os campos.", collectFieldErrors(parsed.error));
  }

  const projectId = await withTransaction(async (client) => {
    const projectResult = await client.query<{ id: string }>(
      `insert into projects (name, description)
       values ($1, $2)
       returning id`,
      [parsed.data.name, parsed.data.description],
    );
    const newProjectId = projectResult.rows[0].id;

    // Todo quadro novo já nasce com três colunas, uma para cada etapa
    // básica, usando o primeiro status de cada tipo.
    const statusesResult = await client.query<StatusKindRow>(
      "select id, kind from statuses order by sort_order asc, name asc",
    );

    const usedKinds = new Set<string>();
    let columnOrder = 0;

    for (const status of statusesResult.rows) {
      const columnName = DEFAULT_COLUMN_NAMES[status.kind];

      if (!columnName || usedKinds.has(status.kind)) {
        continue;
      }

      usedKinds.add(status.kind);

      await client.query(
        `insert into board_columns (project_id, name, status_id, sort_order)
         values ($1, $2, $3, $4)`,
        [newProjectId, columnName, status.id, columnOrder],
      );

      columnOrder += 1;
    }

    return newProjectId;
  });

  refresh();
  redirect(`/projects/${projectId}`);
}

export async function saveProject(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return errorState("Projeto não encontrado.");
  }

  const parsed = projectInput.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return errorState("Confira os campos.", collectFieldErrors(parsed.error));
  }

  const archived = formData.get("archived") === "on";

  await query(
    `update projects set name = $2, description = $3, archived = $4 where id = $1`,
    [id, parsed.data.name, parsed.data.description, archived],
  );

  refresh();
  return successState("Projeto atualizado.");
}

export async function deleteProject(
  previous: FormState | null,
  formData: FormData,
): Promise<FormState> {
  await requirePersonForAction();

  const id = String(formData.get("id") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  const project = await queryOne<{ name: string }>(
    "select name from projects where id = $1",
    [id],
  );

  if (!project) {
    return errorState("Projeto não encontrado.");
  }

  if (confirmation !== project.name) {
    return errorState("Digite o nome do projeto exatamente como está para excluir.");
  }

  await query("delete from projects where id = $1", [id]);
  refresh();
  redirect("/");
}
