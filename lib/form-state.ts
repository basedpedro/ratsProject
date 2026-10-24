import type { FieldErrors } from "@/lib/validation";

export type FormState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: FieldErrors;
};

export const emptyFormState: FormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export function errorState(message: string, fieldErrors: FieldErrors = {}): FormState {
  return { status: "error", message, fieldErrors };
}

export function successState(message: string): FormState {
  return { status: "success", message, fieldErrors: {} };
}

export function firstErrorOf(state: FormState | null): string {
  if (!state || state.status !== "error") {
    return "";
  }
  const firstFieldError = Object.values(state.fieldErrors)[0];
  return firstFieldError ?? state.message;
}
