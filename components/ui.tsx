import type { CSSProperties, ReactNode } from "react";

export function cssVar(name: string, value: string): CSSProperties {
  return { [name]: value } as CSSProperties;
}

export function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <span className="avatar" style={cssVar("--avatar-color", color)} title={name}>
      {initials || "?"}
    </span>
  );
}

export function StatusDot({ color }: { color: string }) {
  return <span className="dot" style={cssVar("--dot-color", color)} aria-hidden="true" />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function FormMessage({
  status,
  message,
}: {
  status: "idle" | "error" | "success";
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={status === "error" ? "form-message danger" : "form-message accent"}
      role="status"
    >
      {message}
    </p>
  );
}

// Rótulo de seção no estilo do site: "$ ls projetos/".
export function SectionCommand({ children }: { children: ReactNode }) {
  return <p className="comment">{children}</p>;
}
