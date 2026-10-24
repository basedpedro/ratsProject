"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel = "...",
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();

  const variantClass =
    variant === "ghost" ? "btn--ghost" : variant === "danger" ? "btn--danger" : "";

  return (
    <button
      type="submit"
      className={`btn ${variantClass} ${className}`.trim()}
      disabled={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
