export type Priority = 1 | 2 | 3;

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: "baixa",
  2: "média",
  3: "alta",
};

export const STATUS_KINDS = ["todo", "doing", "blocked", "done"] as const;
export type StatusKind = (typeof STATUS_KINDS)[number];

export const STATUS_KIND_LABELS: Record<StatusKind, string> = {
  todo: "a fazer",
  doing: "em andamento",
  blocked: "bloqueado",
  done: "concluído",
};

export type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  active: boolean;
};

export type Status = {
  id: string;
  name: string;
  color: string;
  kind: StatusKind;
  sortOrder: number;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  archived: boolean;
};

export type BoardColumn = {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  status: Status;
};

export type Task = {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  sortOrder: number;
  assignee: Person | null;
  status: Status;
};

export type AgendaTask = {
  id: string;
  title: string;
  dueDate: string;
  projectId: string;
  projectName: string;
  assigneeName: string | null;
  statusName: string;
  statusColor: string;
  statusKind: StatusKind;
};

export type ProjectSummary = Project & {
  totalTasks: number;
  doneTasks: number;
};

export type Board = {
  project: Project;
  columns: BoardColumn[];
  tasks: Task[];
  people: Person[];
};

export function isPriority(value: number): value is Priority {
  return value === 1 || value === 2 || value === 3;
}
