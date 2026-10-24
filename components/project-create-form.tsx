"use client";

import { useActionState } from "react";
import { createProject } from "@/app/actions/projects";
import { TextField, TextareaField } from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import { emptyFormState } from "@/lib/form-state";

export function ProjectCreateForm() {
  const [state, formAction] = useActionState(createProject, emptyFormState);

  return (
    <form action={formAction} className="panel-body flex flex-col gap-3">
      <TextField
        label="nome"
        name="name"
        placeholder="site novo da ratsdev"
        required
        maxLength={80}
        error={state?.fieldErrors.name}
      />
      <TextareaField
        label="descrição"
        name="description"
        placeholder="o que esse projeto entrega"
        rows={3}
        maxLength={600}
        error={state?.fieldErrors.description}
      />
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="criando...">criar projeto</SubmitButton>
        <FormMessage status={state?.status ?? "idle"} message={state?.message ?? ""} />
      </div>
    </form>
  );
}
