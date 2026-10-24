"use client";

import { useActionState } from "react";
import { deleteProject, saveProject } from "@/app/actions/projects";
import { CheckboxField, TextField, TextareaField } from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { Project } from "@/lib/domain";
import { emptyFormState } from "@/lib/form-state";

export function ProjectForm({ project }: { project: Project }) {
  const [state, formAction] = useActionState(saveProject, emptyFormState);

  return (
    <form action={formAction} className="panel-body flex flex-col gap-3">
      <input type="hidden" name="id" value={project.id} />

      <TextField
        label="nome"
        name="name"
        defaultValue={project.name}
        required
        maxLength={80}
        error={state?.fieldErrors.name}
      />

      <TextareaField
        label="descrição"
        name="description"
        defaultValue={project.description}
        rows={3}
        maxLength={600}
        error={state?.fieldErrors.description}
      />

      <CheckboxField
        label="arquivado"
        name="archived"
        defaultChecked={project.archived}
      />

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <SubmitButton pendingLabel="salvando...">salvar projeto</SubmitButton>
        <FormMessage
          status={state?.status ?? "idle"}
          message={state?.message ?? ""}
        />
      </div>
    </form>
  );
}

export function ProjectDelete({ project }: { project: Project }) {
  const [state, formAction] = useActionState(deleteProject, emptyFormState);

  return (
    <form action={formAction} className="flex flex-col gap-3 p-3">
      <input type="hidden" name="id" value={project.id} />

      <TextField
        label={`digite "${project.name}" para confirmar`}
        name="confirmation"
        placeholder={project.name}
        idPrefix="delete-project-"
      />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="danger" pendingLabel="excluindo...">
          excluir projeto
        </SubmitButton>
        <FormMessage
          status={state?.status ?? "idle"}
          message={state?.message ?? ""}
        />
      </div>

      <p className="comment">{"// apaga o quadro e todas as tarefas junto. não tem volta."}</p>
    </form>
  );
}
