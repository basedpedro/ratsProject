import { z } from "zod";
import { STATUS_KINDS } from "@/lib/domain";

// Toda entrada de formulário passa por aqui antes de chegar no banco.

const requiredText = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter até ${max} caracteres.`);

const optionalText = (max = 2000) => z.string().trim().max(max).default("");

const optionalUuid = z
  .string()
  .trim()
  .refine((value) => value === "" || z.string().uuid().safeParse(value).success, {
    message: "Identificador inválido.",
  })
  .transform((value) => (value === "" ? null : value));

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor deve estar no formato #rrggbb.");

export const personInput = z.object({
  name: requiredText("Nome", 80),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "E-mail inválido.",
    }),
  role: optionalText(60),
  color: hexColor,
  active: z.boolean(),
});

export const statusInput = z.object({
  name: requiredText("Nome", 40),
  color: hexColor,
  kind: z.enum(STATUS_KINDS),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const projectInput = z.object({
  name: requiredText("Nome", 80),
  description: optionalText(600),
});

export const columnInput = z.object({
  name: requiredText("Nome", 40),
  statusId: z.string().uuid("Escolha um status."),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const taskInput = z.object({
  title: requiredText("Título", 160),
  description: optionalText(4000),
  columnId: z.string().uuid("Escolha uma coluna."),
  assigneeId: optionalUuid,
  priority: z.coerce.number().int().min(1).max(3),
  dueDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Data inválida.",
    })
    .transform((value) => (value === "" ? null : value)),
});

export const moveTaskInput = z.object({
  taskId: z.string().uuid(),
  columnId: z.string().uuid(),
  beforeTaskId: z.string().uuid().nullable(),
});

export const loginInput = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export type FieldErrors = Record<string, string>;

// Primeira mensagem de erro por campo, no formato que os formulários exibem.
export function collectFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
