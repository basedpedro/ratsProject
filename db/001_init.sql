-- Estrutura base do gerenciador de projetos.
-- Uma tarefa pertence a uma coluna do quadro; o status da tarefa é o status da coluna.
-- Assim existe uma única fonte de verdade para "onde a tarefa está".

create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  email text not null default '',
  role text not null default '',
  color text not null default '#2bff6a',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6f7a6e',
  kind text not null default 'todo'
    check (kind in ('todo', 'doing', 'blocked', 'done')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  description text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  status_id uuid not null references statuses(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  column_id uuid not null references board_columns(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  assignee_id uuid references people(id) on delete set null,
  priority smallint not null default 2 check (priority between 1 and 3),
  due_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index board_columns_project_order_idx
  on board_columns (project_id, sort_order);

create index tasks_project_column_order_idx
  on tasks (project_id, column_id, sort_order);

create index tasks_assignee_idx on tasks (assignee_id);
create index tasks_due_date_idx on tasks (due_date);
