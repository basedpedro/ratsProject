import {
  isPriority,
  type BoardColumn,
  type Person,
  type Priority,
  type Project,
  type Status,
  type StatusKind,
  type Task,
} from "@/lib/domain";

// Linhas cruas vindas do Postgres. O mapeamento para o domínio acontece
// num único lugar, aqui, e o resto do app só vê os tipos de lib/domain.ts.

export type PersonRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  active: boolean;
};

export type StatusRow = {
  id: string;
  name: string;
  color: string;
  kind: string;
  sort_order: number;
};

export type ProjectRow = {
  id: string;
  name: string;
  description: string;
  archived: boolean;
};

export type ColumnRow = {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  status_id: string;
  status_name: string;
  status_color: string;
  status_kind: string;
  status_sort_order: number;
};

export type TaskRow = {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: number;
  due_date: string | null;
  sort_order: number;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  assignee_role: string | null;
  assignee_color: string | null;
  assignee_active: boolean | null;
  status_id: string;
  status_name: string;
  status_color: string;
  status_kind: string;
  status_sort_order: number;
};

export function toStatusKind(value: string): StatusKind {
  if (value === "doing" || value === "blocked" || value === "done") {
    return value;
  }
  return "todo";
}

export function toPriority(value: number): Priority {
  if (isPriority(value)) {
    return value;
  }
  return 2;
}

export function personRowToDomain(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    color: row.color,
    active: row.active,
  };
}

export function statusRowToDomain(row: StatusRow): Status {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    kind: toStatusKind(row.kind),
    sortOrder: row.sort_order,
  };
}

export function projectRowToDomain(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    archived: row.archived,
  };
}

export function columnRowToDomain(row: ColumnRow): BoardColumn {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    sortOrder: row.sort_order,
    status: {
      id: row.status_id,
      name: row.status_name,
      color: row.status_color,
      kind: toStatusKind(row.status_kind),
      sortOrder: row.status_sort_order,
    },
  };
}

export function taskRowToDomain(row: TaskRow): Task {
  let assignee: Person | null = null;
  if (row.assignee_id !== null) {
    assignee = {
      id: row.assignee_id,
      name: row.assignee_name ?? "",
      email: row.assignee_email ?? "",
      role: row.assignee_role ?? "",
      color: row.assignee_color ?? "#2bff6a",
      active: row.assignee_active ?? true,
    };
  }

  return {
    id: row.id,
    projectId: row.project_id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    priority: toPriority(row.priority),
    dueDate: row.due_date,
    sortOrder: row.sort_order,
    assignee,
    status: {
      id: row.status_id,
      name: row.status_name,
      color: row.status_color,
      kind: toStatusKind(row.status_kind),
      sortOrder: row.status_sort_order,
    },
  };
}
