export function isPgError(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  return "code" in error && (error as { code?: unknown }).code === code;
}
