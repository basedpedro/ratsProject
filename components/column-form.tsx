"use client";

import { useActionState } from "react";
import { deleteColumn, saveColumn } from "@/app/actions/columns";
import { SelectField, TextField } from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { BoardColumn, Status } from "@/lib/domain";
import { emptyFormState } from "@/lib/form-state";

export function ColumnForm({
  projectId,
  statuses,
  column,
  nextOrder,
  idPrefix,
}: {
  projectId: string;
  statuses: Status[];
  column?: BoardColumn;
  nextOrder: number;
  idPrefix: string;
}) {
  const [state, formAction] = useActionState(saveColumn, emptyFormState);

  const statusOptions = statuses.map((status) => ({
    value: status.id,
    label: status.name,
  }));

  return (
    <form action={formAction} className="panel-body flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      {column ? <input type="hidden" name="id" value={column.id} /> : null}

      <TextField
        idPrefix={idPrefix}
        label="nome da coluna"
        name="name"
        defaultValue={column?.name}
        placeholder="em andamento"
        required
        maxLength={40}
        error={state?.fieldErrors.name}
      />

      <div className="grid grid-cols-2 items-end gap-3">
        <SelectField
          idPrefix={idPrefix}
          label="status"
          name="statusId"
          options={statusOptions}
          defaultValue={column?.status.id ?? statuses[0]?.id}
          error={state?.fieldErrors.statusId}
        />
        <TextField
          idPrefix={idPrefix}
          label="ordem"
          name="sortOrder"
          defaultValue={String(column?.sortOrder ?? nextOrder)}
          error={state?.fieldErrors.sortOrder}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <SubmitButton pendingLabel="salvando...">
          {column ? "salvar coluna" : "criar coluna"}
        </SubmitButton>
        <FormMessage
          status={state?.status ?? "idle"}
          message={state?.message ?? ""}
        />
      </div>
    </form>
  );
}

export function ColumnDelete({ column }: { column: BoardColumn }) {
  const [state, formAction] = useActionState(deleteColumn, emptyFormState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 border-t border-line p-3"
      onSubmit={(event) => {
        if (!window.confirm(`Excluir a coluna "${column.name}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={column.id} />
      <SubmitButton variant="danger" pendingLabel="excluindo...">
        excluir coluna
      </SubmitButton>
      <FormMessage status={state?.status ?? "idle"} message={state?.message ?? ""} />
    </form>
  );
}
