"use client";

import { useActionState } from "react";
import { deleteStatus, saveStatus } from "@/app/actions/statuses";
import { ColorField, SelectField, TextField } from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { Status } from "@/lib/domain";
import { STATUS_KIND_LABELS, STATUS_KINDS } from "@/lib/domain";
import { emptyFormState } from "@/lib/form-state";

const KIND_OPTIONS = STATUS_KINDS.map((kind) => ({
  value: kind,
  label: STATUS_KIND_LABELS[kind],
}));

export function StatusForm({
  status,
  nextOrder,
  idPrefix,
}: {
  status?: Status;
  nextOrder: number;
  idPrefix: string;
}) {
  const [state, formAction] = useActionState(saveStatus, emptyFormState);

  return (
    <form action={formAction} className="panel-body flex flex-col gap-3">
      {status ? <input type="hidden" name="id" value={status.id} /> : null}

      <TextField
        idPrefix={idPrefix}
        label="nome"
        name="name"
        defaultValue={status?.name}
        placeholder="em andamento"
        required
        maxLength={40}
        error={state?.fieldErrors.name}
      />

      <div className="grid grid-cols-2 items-end gap-3">
        <SelectField
          idPrefix={idPrefix}
          label="tipo"
          name="kind"
          options={KIND_OPTIONS}
          defaultValue={status?.kind ?? "todo"}
          error={state?.fieldErrors.kind}
        />
        <TextField
          idPrefix={idPrefix}
          label="ordem"
          name="sortOrder"
          type="text"
          defaultValue={String(status?.sortOrder ?? nextOrder)}
          error={state?.fieldErrors.sortOrder}
        />
      </div>

      <ColorField
        idPrefix={idPrefix}
        label="cor"
        name="color"
        defaultValue={status?.color ?? "#6f7a6e"}
        error={state?.fieldErrors.color}
      />

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <SubmitButton pendingLabel="salvando...">
          {status ? "salvar status" : "cadastrar status"}
        </SubmitButton>
        <FormMessage
          status={state?.status ?? "idle"}
          message={state?.message ?? ""}
        />
      </div>
    </form>
  );
}

export function StatusDelete({ status }: { status: Status }) {
  const [state, formAction] = useActionState(deleteStatus, emptyFormState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 border-t border-line p-3"
      onSubmit={(event) => {
        if (!window.confirm(`Excluir o status "${status.name}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={status.id} />
      <SubmitButton variant="danger" pendingLabel="excluindo...">
        excluir status
      </SubmitButton>
      <FormMessage status={state?.status ?? "idle"} message={state?.message ?? ""} />
    </form>
  );
}
