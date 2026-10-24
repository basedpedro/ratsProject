import { query, queryOne } from "@/lib/db";
import type {
  AgendaTask,
  Board,
  BoardColumn,
  Person,
  Project,
  ProjectSummary,
  Status,
  Task,
} from "@/lib/domain";
import {
  columnRowToDomain,
  personRowToDomain,
  projectRowToDomain,
  statusRowToDomain,
  taskRowToDomain,
  type ColumnRow,
  type PersonRow,
  type ProjectRow,
  type StatusRow,
  type TaskRow,
} from "@/lib/rows";

const TASK_SELECT = `
  select t.id, t.project_id, t.column_id, t.title, t.description, t.priority,
         t.due_date, t.sort_order,
         p.id as assignee_id, p.name as assignee_name, p.email as assignee_email,
         p.role as assignee_role, p.color as assignee_color, p.active as assignee_active,
         s.id as status_id, s.name as status_name, s.color as status_color,
         s.kind as status_kind, s.sort_order as status_sort_order
    from tasks t
    join board_columns c on c.id = t.column_id
    join statuses s on s.id = c.status_id
    left join people p on p.id = t.assignee_id
`;

const COLUMN_SELECT = `
  select c.id, c.project_id, c.name, c.sort_order,
         s.id as status_id, s.name as status_name, s.color as status_color,
         s.kind as status_kind, s.sort_order as status_sort_order
    from board_columns c
    join statuses s on s.id = c.status_id
`;

export async function listPeople(): Promise<Person[]> {
  const rows = await query<PersonRow>(
    `select id, name, email, role, color, active
       from people
      order by active desc, name asc`,
  );
  return rows.map(personRowToDomain);
}

export async function listStatuses(): Promise<Status[]> {
  const rows = await query<StatusRow>(
    `select id, name, color, kind, sort_order
       from statuses
      order by sort_order asc, name asc`,
  );
  return rows.map(statusRowToDomain);
}

export async function listProjects(): Promise<Project[]> {
  const rows = await query<ProjectRow>(
    `select id, name, description, archived
       from projects
      order by archived asc, created_at desc`,
  );
  return rows.map(projectRowToDomain);
}

export async function listProjectSummaries(): Promise<ProjectSummary[]> {
  const rows = await query<
    ProjectRow & { total_tasks: number; done_tasks: number }
  >(
    `select p.id, p.name, p.description, p.archived,
            count(t.id)::int as total_tasks,
            count(t.id) filter (where s.kind = 'done')::int as done_tasks
       from projects p
       left join tasks t on t.project_id = p.id
       left join board_columns c on c.id = t.column_id
       left join statuses s on s.id = c.status_id
      where p.archived = false
      group by p.id
      order by p.created_at desc`,
  );

  return rows.map((row) => ({
    ...projectRowToDomain(row),
    totalTasks: row.total_tasks,
    doneTasks: row.done_tasks,
  }));
}

export async function getProject(projectId: string): Promise<Project | null> {
  const row = await queryOne<ProjectRow>(
    `select id, name, description, archived from projects where id = $1`,
    [projectId],
  );
  return row ? projectRowToDomain(row) : null;
}

export async function listColumns(projectId: string): Promise<BoardColumn[]> {
  const rows = await query<ColumnRow>(
    `${COLUMN_SELECT} where c.project_id = $1 order by c.sort_order asc`,
    [projectId],
  );
  return rows.map(columnRowToDomain);
}

export async function listTasks(projectId: string): Promise<Task[]> {
  const rows = await query<TaskRow>(
    `${TASK_SELECT} where t.project_id = $1 order by t.sort_order asc, t.created_at asc`,
    [projectId],
  );
  return rows.map(taskRowToDomain);
}

export async function getBoard(projectId: string): Promise<Board | null> {
  const project = await getProject(projectId);
  if (!project) {
    return null;
  }

  const [columns, tasks, people] = await Promise.all([
    listColumns(projectId),
    listTasks(projectId),
    listPeople(),
  ]);

  return { project, columns, tasks, people };
}

export type DashboardStats = {
  activeProjects: number;
  openTasks: number;
  overdueTasks: number;
  activePeople: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const row = await queryOne<{
    active_projects: number;
    open_tasks: number;
    overdue_tasks: number;
    active_people: number;
  }>(`
    select
      (select count(*)::int from projects where archived = false) as active_projects,
      (select count(*)::int
         from tasks t
         join board_columns c on c.id = t.column_id
         join statuses s on s.id = c.status_id
        where s.kind <> 'done') as open_tasks,
      (select count(*)::int
         from tasks t
         join board_columns c on c.id = t.column_id
         join statuses s on s.id = c.status_id
        where s.kind <> 'done' and t.due_date < current_date) as overdue_tasks,
      (select count(*)::int from people where active) as active_people
  `);

  if (!row) {
    return { activeProjects: 0, openTasks: 0, overdueTasks: 0, activePeople: 0 };
  }

  return {
    activeProjects: row.active_projects,
    openTasks: row.open_tasks,
    overdueTasks: row.overdue_tasks,
    activePeople: row.active_people,
  };
}

export async function listAgenda(limit = 6): Promise<AgendaTask[]> {
  const rows = await query<{
    id: string;
    title: string;
    due_date: string;
    project_id: string;
    project_name: string;
    assignee_name: string | null;
    status_name: string;
    status_color: string;
    status_kind: string;
  }>(
    `select t.id, t.title, t.due_date, pr.id as project_id, pr.name as project_name,
            p.name as assignee_name, s.name as status_name, s.color as status_color,
            s.kind as status_kind
       from tasks t
       join projects pr on pr.id = t.project_id
       join board_columns c on c.id = t.column_id
       join statuses s on s.id = c.status_id
       left join people p on p.id = t.assignee_id
      where s.kind <> 'done'
        and t.due_date is not null
        and pr.archived = false
      order by t.due_date asc
      limit $1`,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    projectId: row.project_id,
    projectName: row.project_name,
    assigneeName: row.assignee_name,
    statusName: row.status_name,
    statusColor: row.status_color,
    statusKind: row.status_kind as AgendaTask["statusKind"],
  }));
}
