"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteTask, updateTask } from "@/app/actions/tasks";
import {
  SelectField,
  TextField,
  TextareaField,
} from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, StatusDot } from "@/components/ui";
import type { BoardColumn, Person, Task } from "@/lib/domain";
import { emptyFormState } from "@/lib/form-state";

export function TaskDrawer({
  task,
  columns,
  people,
  onClose,
}: {
  task: Task;
  columns: BoardColumn[];
  people: Person[];
  onClose: () => void;
}) {
  const [saveState, saveAction] = useActionState(updateTask, emptyFormState);
  const [deleteState, deleteAction] = useActionState(deleteTask, emptyFormState);
  const [columnId, setColumnId] = useState(task.columnId);

  useEffect(() => {
    if (saveState.status === "success") {
      onClose();
    }
  }, [saveState.status, onClose]);

  useEffect(() => {
    if (deleteState.status === "success") {
      onClose();
    }
  }, [deleteState.status, onClose]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const currentColumn = columns.find((column) => column.id === columnId) ?? null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />

      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Tarefa">
        <div className="drawer-head">
          <span className="flex items-center gap-2">
            {currentColumn ? <StatusDot color={currentColumn.status.color} /> : null}
            <span>{currentColumn?.status.name ?? "tarefa"}</span>
          </span>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[13px] text-faint hover:text-accent"
            onClick={onClose}
            aria-label="Fechar"
          >
            fechar ×
          </button>
        </div>

        <form action={saveAction} className="drawer-body">
          <input type="hidden" name="id" value={task.id} />

          <TextField
            label="título"
            name="title"
            defaultValue={task.title}
            required
            maxLength={160}
            error={saveState?.fieldErrors.title}
          />

          <TextareaField
            label="descrição"
            name="description"
            defaultValue={task.description}
            rows={5}
            maxLength={4000}
            placeholder="detalhes, links, critérios de aceite"
            error={saveState?.fieldErrors.description}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="columnId">
                coluna
              </label>
              <select
                className="select"
                id="columnId"
                name="columnId"
                value={columnId}
                onChange={(event) => setColumnId(event.target.value)}
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>

            <SelectField
              label="prioridade"
              name="priority"
              defaultValue={String(task.priority)}
              options={[
                { value: "1", label: "baixa" },
                { value: "2", label: "média" },
                { value: "3", label: "alta" },
              ]}
            />

            <SelectField
              label="responsável"
              name="assigneeId"
              defaultValue={task.assignee?.id ?? ""}
              options={[
                { value: "", label: "sem responsável" },
                ...people.map((person) => ({
                  value: person.id,
                  label: person.name,
                })),
              ]}
            />

            <TextField
              label="prazo"
              name="dueDate"
              type="date"
              defaultValue={task.dueDate ?? ""}
            />
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <SubmitButton pendingLabel="salvando...">salvar tarefa</SubmitButton>
            <FormMessage
              status={saveState?.status ?? "idle"}
              message={saveState?.message ?? ""}
            />
          </div>
        </form>

        <div className="border-t border-line p-3">
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Excluir esta tarefa? Isso não tem volta.")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={task.id} />
            <SubmitButton variant="danger" pendingLabel="excluindo...">
              excluir tarefa
            </SubmitButton>
          </form>
          <FormMessage
            status={deleteState?.status ?? "idle"}
            message={deleteState?.message ?? ""}
          />
        </div>
      </aside>
    </>
  );
}
