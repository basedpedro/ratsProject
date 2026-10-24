// Popula o banco com um quadro de exemplo. Roda uma vez só: se já existe
// algum projeto, o script não faz nada.
// Uso: node --env-file=.env.local scripts/seed.mjs

import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

const existing = await client.query("select count(*)::int as total from projects");
if (existing.rows[0].total > 0) {
  console.log("banco já tem projetos, seed ignorado.");
  await client.end();
  process.exit(0);
}

const statuses = [
  ["a fazer", "#6f7a6e", "todo"],
  ["em andamento", "#2bff6a", "doing"],
  ["em revisão", "#e3c46a", "doing"],
  ["bloqueado", "#ff6b6b", "blocked"],
  ["concluído", "#4f7a5a", "done"],
];

const statusIds = {};
for (let index = 0; index < statuses.length; index += 1) {
  const [name, color, kind] = statuses[index];
  const result = await client.query(
    `insert into statuses (name, color, kind, sort_order)
     values ($1, $2, $3, $4) returning id`,
    [name, color, kind, index],
  );
  statusIds[name] = result.rows[0].id;
}

const people = [
  ["Pedro", "pedro@ratsdev.com.br", "produto", "#2bff6a"],
  ["Nicolas", "nicolas@ratsdev.com.br", "dev", "#7fb6ff"],
  ["João", "joao@ratsdev.com.br", "design", "#e3c46a"],
];

const personIds = {};
for (const [name, email, role, color] of people) {
  const result = await client.query(
    `insert into people (name, email, role, color)
     values ($1, $2, $3, $4) returning id`,
    [name, email, role, color],
  );
  personIds[name] = result.rows[0].id;
}

const project = await client.query(
  `insert into projects (name, description)
   values ($1, $2) returning id`,
  [
    "site novo da ratsdev",
    "Site institucional novo, com página de projetos e orçamento.",
  ],
);
const projectId = project.rows[0].id;

const columns = [
  ["entrada", "a fazer"],
  ["em andamento", "em andamento"],
  ["revisão", "em revisão"],
  ["publicado", "concluído"],
];

const columnIds = {};
for (let index = 0; index < columns.length; index += 1) {
  const [name, statusName] = columns[index];
  const result = await client.query(
    `insert into board_columns (project_id, name, status_id, sort_order)
     values ($1, $2, $3, $4) returning id`,
    [projectId, name, statusIds[statusName], index],
  );
  columnIds[name] = result.rows[0].id;
}

const tasks = [
  ["Levantar referências visuais", "entrada", null, 1, null, "Painéis de terminal, tipografia mono, verde só no que é ação."],
  ["Escrever os textos das seções", "entrada", "Pedro", 2, "2026-11-03", ""],
  ["Montar o layout da home", "em andamento", "João", 3, "2026-10-30", "Hero com cursor piscando e lista de serviços."],
  ["Formulário de orçamento", "em andamento", "Nicolas", 2, "2026-11-06", ""],
  ["Revisar acessibilidade", "revisão", "Nicolas", 2, null, "Contraste do verde sobre o fundo escuro."],
  ["Publicar na VPS", "entrada", "Nicolas", 3, "2026-11-10", ""],
  ["Definir domínio", "publicado", "Pedro", 1, null, ""],
];

for (let index = 0; index < tasks.length; index += 1) {
  const [title, columnName, assigneeName, priority, dueDate, description] = tasks[index];
  const columnTasks = await client.query(
    "select count(*)::int as total from tasks where column_id = $1",
    [columnIds[columnName]],
  );
  await client.query(
    `insert into tasks
       (project_id, column_id, title, description, assignee_id, priority, due_date, sort_order)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      projectId,
      columnIds[columnName],
      title,
      description,
      assigneeName ? personIds[assigneeName] : null,
      priority,
      dueDate,
      columnTasks.rows[0].total,
    ],
  );
}

await client.end();
console.log("seed aplicado.");
