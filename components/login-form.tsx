"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { emptyFormState } from "@/lib/form-state";

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, emptyFormState);

  return (
    <form action={formAction} className="panel-body flex flex-col gap-4">
      <div className="field">
        <label className="field-label" htmlFor="email">
          e-mail
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
        />
        {state?.fieldErrors.email ? (
          <p className="field-error">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="password">
          senha
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state?.fieldErrors.password ? (
          <p className="field-error">{state.fieldErrors.password}</p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="entrando...">entrar</SubmitButton>

      <FormMessage status={state?.status ?? "idle"} message={state?.message ?? ""} />
    </form>
  );
}
