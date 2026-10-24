-- Garante no banco que a coluna de uma tarefa pertence ao mesmo projeto
-- da tarefa. Sem isso, uma chamada direta poderia criar a combinação inválida.
alter table board_columns
  add constraint board_columns_id_project_key unique (id, project_id);

alter table tasks
  add constraint tasks_column_project_fkey
  foreign key (column_id, project_id)
  references board_columns (id, project_id)
  on delete cascade;
