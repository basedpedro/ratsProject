import type { BoardColumn, Task } from "@/lib/domain";

// Move um cartão na lista local antes do servidor responder.
// Deixa o arrasto instantâneo e é fácil de testar: mesma entrada, mesma saída.
export function applyMove(
  tasks: Task[],
  columns: BoardColumn[],
  taskId: string,
  targetColumnId: string,
  beforeTaskId: string | null,
): Task[] {
  const movingTask = tasks.find((task) => task.id === taskId);
  if (!movingTask) {
    return tasks;
  }

  const targetColumn = columns.find((column) => column.id === targetColumnId);
  if (!targetColumn) {
    return tasks;
  }

  const targetTasks = tasks
    .filter((task) => task.columnId === targetColumnId && task.id !== taskId)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  let insertIndex = targetTasks.length;
  if (beforeTaskId) {
    const foundIndex = targetTasks.findIndex((task) => task.id === beforeTaskId);
    if (foundIndex >= 0) {
      insertIndex = foundIndex;
    }
  }

  const movedTask: Task = {
    ...movingTask,
    columnId: targetColumnId,
    status: targetColumn.status,
  };

  targetTasks.splice(insertIndex, 0, movedTask);

  const updatedById = new Map<string, Task>();
  for (let index = 0; index < targetTasks.length; index += 1) {
    updatedById.set(targetTasks[index].id, { ...targetTasks[index], sortOrder: index });
  }

  return tasks.map((task) => updatedById.get(task.id) ?? task);
}
