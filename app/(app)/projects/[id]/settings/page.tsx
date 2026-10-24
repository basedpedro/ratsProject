import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { moveColumn } from "@/app/actions/columns";
import { ColumnDelete, ColumnForm } from "@/components/column-form";
import { ProjectDelete, ProjectForm } from "@/components/project-form";
import { EmptyState, SectionCommand, StatusDot } from "@/components/ui";
import { getProject, listColumns, listStatuses } from "@/lib/queries";

export const metadata: Metadata = {
  title: "configurar quadro",
};

export default function SettingsPage({
  params,
}: PageProps<"/projects/[id]/settings">) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsScreen params={params} />
    </Suspense>
  );
}

async function SettingsScreen({
  params,
}: Pick<PageProps<"/projects/[id]/settings">, "params">) {
  const { id } = await params;

  const [project, columns, statuses] = await Promise.all([
    getProject(id),
    listColumns(id),
    listStatuses(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="wrap-wide flex flex-col gap-10 py-8">
      <header>
        <SectionCommand>$ cd {project.name} && vim config</SectionCommand>

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-[clamp(1.8rem,5vw,2.75rem)] leading-none font-extrabold tracking-[-0.05em] text-fg-strong">
            configuração
            <span className="accent">/</span>
          </h1>
          <Link href={`/projects/${project.id}`} className="btn btn--ghost btn--sm">
            ← voltar ao quadro
          </Link>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="panel" aria-labelledby="projeto-titulo">
          <div className="panel-head">
            <span id="projeto-titulo">projeto</span>
            <span>{project.archived ? "arquivado" : "ativo"}</span>
          </div>
          <ProjectForm project={project} />
        </section>

        <section className="panel" aria-labelledby="nova-coluna-titulo">
          <div className="panel-head">
            <span id="nova-coluna-titulo">nova coluna</span>
            <span>entra no fim do quadro</span>
          </div>

          {statuses.length === 0 ? (
            <p className="panel-body comment">
              {'// crie um status antes. '}
              <Link href="/statuses" className="accent">
                ir para status
              </Link>
            </p>
          ) : (
            <ColumnForm
              projectId={project.id}
              statuses={statuses}
              nextOrder={columns.length}
              idPrefix="nova-coluna-"
            />
          )}
        </section>
      </div>

      <section aria-labelledby="colunas-titulo">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            id="colunas-titulo"
            className="text-lg font-bold tracking-[-0.03em] text-fg-strong"
          >
            colunas do quadro
          </h2>
          <span className="text-[11px] text-faint">
            {columns.length} coluna(s) · a ordem é da esquerda para a direita
          </span>
        </div>

        {columns.length === 0 ? (
          <div className="mt-3">
            <EmptyState>{"// nenhuma coluna. crie a primeira acima para o quadro funcionar."}</EmptyState>
          </div>
        ) : (
          <div className="mt-3 border-t border-line">
            {columns.map((column, index) => (
              <details
                key={column.id}
                className="border-b border-line [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="row-item cursor-pointer list-none">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="text-[11px] text-faint">
                      [{String(index + 1).padStart(2, "0")}]
                    </span>
                    <StatusDot color={column.status.color} />
                    <span className="row-title truncate">{column.name}</span>
                  </span>

                  <span className="row-sub truncate">{column.status.name}</span>

                  <span className="btn btn--ghost btn--sm">editar</span>
                </summary>

                <div className="border-t border-line bg-bg/60">
                  <form action={moveColumn} className="flex items-center gap-2 p-3">
                    <input type="hidden" name="id" value={column.id} />
                    <button
                      type="submit"
                      name="direction"
                      value="up"
                      className="btn btn--ghost btn--icon"
                      disabled={index === 0}
                      aria-label="Mover coluna para a esquerda"
                    >
                      ←
                    </button>
                    <button
                      type="submit"
                      name="direction"
                      value="down"
                      className="btn btn--ghost btn--icon"
                      disabled={index === columns.length - 1}
                      aria-label="Mover coluna para a direita"
                    >
                      →
                    </button>
                    <span className="comment">posição {index + 1}</span>
                  </form>

                  <div className="border-t border-line">
                    <ColumnForm
                      projectId={project.id}
                      statuses={statuses}
                      column={column}
                      nextOrder={columns.length}
                      idPrefix={`edit-coluna-${column.id}-`}
                    />
                  </div>

                  <ColumnDelete column={column} />
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section
        className="border border-danger/40"
        aria-labelledby="risco-titulo"
      >
        <div className="panel-head">
          <span id="risco-titulo" className="danger">
            zona de risco
          </span>
          <span>sem volta</span>
        </div>
        <ProjectDelete project={project} />
      </section>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="wrap-wide py-8">
      <EmptyState>{"// carregando configuração..."}</EmptyState>
    </div>
  );
}
