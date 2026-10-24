"use client";

import Link from "next/link";
import { useState, useOptimistic, useTransition } from "react";
import { createTask, moveTask } from "@/app/actions/tasks";
import { TaskDrawer } from "@/components/task-drawer";
import { Avatar, StatusDot } from "@/components/ui";
import { applyMove } from "@/lib/board-move";
import { formatDueDate, formatRelative, isOverdue, isToday } from "@/lib/dates";
import type { Board as BoardData, BoardColumn, Task } from "@/lib/domain";
import { PRIORITY_LABELS } from "@/lib/domain";

type PendingMove = {
  taskId: string;
  columnId: string;
  beforeTaskId: string | null;
};

export function Board({ board }: { board: BoardData }) {
  // O servidor é a fonte da verdade. O estado otimista só antecipa o arrasto
  // e volta sozinho quando o servidor responde (useOptimistic).
  const [tasks, applyOptimisticMove] = useOptimistic(
    board.tasks,
    (currentTasks: Task[], move: PendingMove) =>
      applyMove(currentTasks, board.columns, move.taskId, move.columnId, move.beforeTaskId),
  );
  const [, startTransition] = useTransition();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [overTaskId, setOverTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const term = search.trim().toLowerCase();
  const visibleTasks = tasks.filter((task) => {
    if (!term) {
      return true;
    }
    const assigneeName = task.assignee?.name.toLowerCase() ?? "";
    return task.title.toLowerCase().includes(term) || assigneeName.includes(term);
  });

  const doneTasks = tasks.filter((task) => task.status.kind === "done").length;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  async function handleDrop(targetColumnId: string, beforeTaskId: string | null) {
    const taskId = draggingTaskId;
    setDraggingTaskId(null);
    setOverColumnId(null);
    setOverTaskId(null);

    if (!taskId) {
      return;
    }

    const taskBeforeMove = tasks.find((task) => task.id === taskId);
    if (!taskBeforeMove) {
      return;
    }
    setError("");

    startTransition(async () => {
      applyOptimisticMove({ taskId, columnId: targetColumnId, beforeTaskId });

      const result = await moveTask({ taskId, columnId: targetColumnId, beforeTaskId });
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="wrap-wide pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="comment">$ cd {slugify(board.project.name)}/</p>
            <h1 className="mt-2 text-[clamp(2rem,6vw,3.5rem)] leading-none font-extrabold tracking-[-0.06em] text-fg-strong">
              {board.project.name}
              <span className="accent">/</span>
            </h1>
            <p className="mt-2 max-w-[60ch] text-[13px] text-muted">
              {board.project.description || "// sem descrição"}
            </p>
          </div>

          <Link
            href={`/projects/${board.project.id}/settings`}
            className="btn btn--ghost btn--sm"
          >
            configurar quadro
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="w-[min(20rem,100%)]">
            <input
              className="input"
              type="search"
              placeholder="buscar tarefa ou pessoa"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar tarefa ou pessoa"
            />
          </div>
          <span className="text-[11px] text-faint">
            {tasks.length} tarefas · {doneTasks} concluídas
          </span>
          {error ? <span className="text-[12px] danger">{error}</span> : null}
        </div>
      </header>

      <div className="wrap-wide">
        <div className="board-scroll">
          <div className="board">
            {board.columns.length === 0 ? (
              <p className="empty">{"// nenhuma coluna. configure o quadro em &quot;configurar quadro&quot;."}</p>
            ) : (
              board.columns.map((column, index) => (
                <Column
                  key={column.id}
                  column={column}
                  index={index}
                  projectId={board.project.id}
                  tasks={visibleTasks.filter((task) => task.columnId === column.id)}
                  isOver={overColumnId === column.id}
                  draggingTaskId={draggingTaskId}
                  overTaskId={overTaskId}
                  onDragStart={setDraggingTaskId}
                  onDragEnd={() => {
                    setDraggingTaskId(null);
                    setOverColumnId(null);
                    setOverTaskId(null);
                  }}
                  onDragOverColumn={setOverColumnId}
                  onDragOverTask={setOverTaskId}
                  onDrop={handleDrop}
                  onOpenTask={setSelectedTaskId}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedTask ? (
        <TaskDrawer
          task={selectedTask}
          columns={board.columns}
          people={board.people}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </div>
  );
}

function Column({
  column,
  index,
  projectId,
  tasks,
  isOver,
  draggingTaskId,
  overTaskId,
  onDragStart,
  onDragEnd,
  onDragOverColumn,
  onDragOverTask,
  onDrop,
  onOpenTask,
}: {
  column: BoardColumn;
  index: number;
  projectId: string;
  tasks: Task[];
  isOver: boolean;
  draggingTaskId: string | null;
  overTaskId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDragOverColumn: (columnId: string | null) => void;
  onDragOverTask: (taskId: string | null) => void;
  onDrop: (columnId: string, beforeTaskId: string | null) => Promise<void>;
  onOpenTask: (taskId: string) => void;
}) {
  const position = String(index + 1).padStart(2, "0");

  return (
    <section
      className="board-col"
      data-over={isOver ? "true" : "false"}
      aria-label={column.name}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOverColumn(column.id);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) {
          onDragOverColumn(null);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        void onDrop(column.id, null);
      }}
    >
      <header className="board-col-head">
        <span className="flex items-center gap-2">
          <span className="text-faint">[{position}]</span>
          <StatusDot color={column.status.color} />
          <span className="col-name">{column.name}</span>
        </span>
        <span className="col-count">{tasks.length}</span>
      </header>

      <div className="col-body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            columnId={column.id}
            isDragging={draggingTaskId === task.id}
            isOver={overTaskId === task.id && draggingTaskId !== task.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOverTask={onDragOverTask}
            onDrop={onDrop}
            onOpen={onOpenTask}
          />
        ))}

        {tasks.length === 0 ? <p className="empty">{"// vazio"}</p> : null}

        <QuickAddTask projectId={projectId} columnId={column.id} />
      </div>
    </section>
  );
}

function TaskCard({
  task,
  columnId,
  isDragging,
  isOver,
  onDragStart,
  onDragEnd,
  onDragOverTask,
  onDrop,
  onOpen,
}: {
  task: Task;
  columnId: string;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDragOverTask: (taskId: string | null) => void;
  onDrop: (columnId: string, beforeTaskId: string | null) => Promise<void>;
  onOpen: (taskId: string) => void;
}) {
  const overdue = isOverdue(task.dueDate) && task.status.kind !== "done";
  const dueToday = isToday(task.dueDate);
  const relative = formatRelative(task.dueDate);

  const priorityColor =
    task.priority === 3
      ? "var(--color-danger)"
      : task.priority === 2
        ? "var(--color-warn)"
        : "var(--color-faint)";

  return (
    <button
      type="button"
      className="task"
      draggable
      data-dragging={isDragging ? "true" : "false"}
      data-over={isOver ? "true" : "false"}
      onClick={() => onOpen(task.id)}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDragOverTask(task.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void onDrop(columnId, task.id);
      }}
    >
      <span className="task-title">{task.title}</span>

      <span className="task-meta">
        <span className="badge" title={`prioridade ${PRIORITY_LABELS[task.priority]}`}>
          <span className="dot" style={{ background: priorityColor }} aria-hidden="true" />
          {PRIORITY_LABELS[task.priority]}
        </span>

        {task.dueDate ? (
          <span
            className={
              overdue ? "task-overdue" : dueToday ? "task-today" : undefined
            }
          >
            {formatDueDate(task.dueDate)}
            {relative && overdue ? ` · ${relative}` : ""}
          </span>
        ) : null}

        <span className="ml-auto">
          {task.assignee ? (
            <Avatar name={task.assignee.name} color={task.assignee.color} />
          ) : (
            <span className="text-[10px] faint">sem dono</span>
          )}
        </span>
      </span>
    </button>
  );
}

function QuickAddTask({ projectId, columnId }: { projectId: string; columnId: string }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="mt-1"
      onSubmit={async (event) => {
        event.preventDefault();
        const title = draft.trim();
        if (!title) {
          return;
        }

        const formData = new FormData();
        formData.set("projectId", projectId);
        formData.set("columnId", columnId);
        formData.set("title", title);
        formData.set("priority", "2");

        setDraft("");
        setError("");

        const result = await createTask(null, formData);
        if (result.status === "error") {
          setError(result.message);
        }
      }}
    >
      <input
        className="input border-dashed text-[13px]"
        name="title"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="+ nova tarefa"
        aria-label="Nova tarefa nesta coluna"
        maxLength={160}
      />
      {error ? <p className="field-error mt-1">{error}</p> : null}
    </form>
  );
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
