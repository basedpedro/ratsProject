export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isOverdueOn(dueDate: string | null, today: string): boolean {
  if (!dueDate) {
    return false;
  }
  return dueDate < today;
}

export function isTodayOn(dueDate: string | null, today: string): boolean {
  if (!dueDate) {
    return false;
  }
  return dueDate === today;
}

export function isOverdue(dueDate: string | null): boolean {
  return isOverdueOn(dueDate, todayIso());
}

export function isToday(dueDate: string | null): boolean {
  return isTodayOn(dueDate, todayIso());
}

// "2026-11-03" vira "03/11".
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) {
    return "";
  }

  const [, month, day] = dueDate.split("-");
  return `${day}/${month}`;
}

export function formatRelative(dueDate: string | null): string | null {
  if (!dueDate) {
    return null;
  }

  const today = todayIso();
  if (dueDate === today) {
    return "hoje";
  }

  const dayInMs = 24 * 60 * 60 * 1000;
  const todayTime = Date.parse(`${today}T00:00:00`);
  const dueTime = Date.parse(`${dueDate}T00:00:00`);
  const differenceInDays = Math.round((dueTime - todayTime) / dayInMs);

  if (differenceInDays === 1) {
    return "amanhã";
  }
  if (differenceInDays === -1) {
    return "ontem";
  }
  if (differenceInDays < 0) {
    return `${Math.abs(differenceInDays)} dias atrás`;
  }
  return `em ${differenceInDays} dias`;
}
