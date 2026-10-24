"use client";

import { useActionState } from "react";
import { deletePerson, savePerson } from "@/app/actions/people";
import {
  CheckboxField,
  ColorField,
  TextField,
} from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { Person } from "@/lib/domain";
import { emptyFormState } from "@/lib/form-state";

export function PersonForm({
  person,
  idPrefix,
}: {
  person?: Person;
  idPrefix: string;
}) {
  const [state, formAction] = useActionState(savePerson, emptyFormState);

  return (
    <form action={formAction} className="panel-body flex flex-col gap-3">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}

      <TextField
        idPrefix={idPrefix}
        label="nome"
        name="name"
        defaultValue={person?.name}
        placeholder="Pedro"
        required
        maxLength={80}
        error={state?.fieldErrors.name}
      />

      <TextField
        idPrefix={idPrefix}
        label="e-mail"
        name="email"
        type="email"
        defaultValue={person?.email}
        placeholder="pedro@ratsdev.com.br"
        maxLength={160}
        error={state?.fieldErrors.email}
      />

      <TextField
        idPrefix={idPrefix}
        label="função"
        name="role"
        defaultValue={person?.role}
        placeholder="dev, design, produto"
        maxLength={60}
        error={state?.fieldErrors.role}
      />

      <div className="grid grid-cols-2 items-end gap-3">
        <ColorField
          idPrefix={idPrefix}
          label="cor no quadro"
          name="color"
          defaultValue={person?.color ?? "#2bff6a"}
          error={state?.fieldErrors.color}
        />
        <CheckboxField
          label="ativo"
          name="active"
          defaultChecked={person?.active ?? true}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <SubmitButton pendingLabel="salvando...">
          {person ? "salvar pessoa" : "cadastrar pessoa"}
        </SubmitButton>
        <FormMessage
          status={state?.status ?? "idle"}
          message={state?.message ?? ""}
        />
      </div>
    </form>
  );
}

export function PersonDelete({ person }: { person: Person }) {
  const [state, formAction] = useActionState(deletePerson, emptyFormState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 border-t border-line p-3"
      onSubmit={(event) => {
        if (!window.confirm(`Excluir ${person.name}? As tarefas dela ficam sem responsável.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={person.id} />
      <SubmitButton variant="danger" pendingLabel="excluindo...">
        excluir pessoa
      </SubmitButton>
      <FormMessage status={state?.status ?? "idle"} message={state?.message ?? ""} />
    </form>
  );
}
