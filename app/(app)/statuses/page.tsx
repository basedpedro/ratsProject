import type { Metadata } from "next";
import { Suspense } from "react";
import { StatusDelete, StatusForm } from "@/components/status-form";
import { EmptyState, SectionCommand, StatusDot } from "@/components/ui";
import { STATUS_KIND_LABELS } from "@/lib/domain";
import { listStatuses } from "@/lib/queries";

export const metadata: Metadata = {
  title: "status",
};

export default function StatusesPage() {
  return (
    <>
      <section className="wrap pt-10 pb-6">
        <SectionCommand>$ cat status.csv</SectionCommand>
        <h1 className="mt-2 text-[clamp(2rem,7vw,4rem)] leading-none font-extrabold tracking-[-0.06em] text-fg-strong">
          status<span className="accent">_</span>
        </h1>
        <p className="comment mt-4">{"// a etapa que cada coluna representa. a cor do status pinta o quadro."}</p>
      </section>

      <hr className="rule" />

      <Suspense fallback={<StatusesSkeleton />}>
        <StatusesContent />
      </Suspense>
    </>
  );
}

async function StatusesContent() {
  const statuses = await listStatuses();
  const nextOrder = statuses.length;

  return (
    <div className="wrap grid items-start gap-8 py-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <section aria-labelledby="lista-status-titulo">
        <h2
          id="lista-status-titulo"
          className="text-lg font-bold tracking-[-0.03em] text-fg-strong"
        >
          catálogo
        </h2>

        {statuses.length === 0 ? (
          <div className="mt-3">
            <EmptyState>
              {'// nenhum status. crie pelo menos um "a fazer" e um "concluído".'}
            </EmptyState>
          </div>
        ) : (
          <div className="mt-3 border-t border-line">
            {statuses.map((status, index) => (
              <details
                key={status.id}
                className="border-b border-line [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="row-item cursor-pointer list-none">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <StatusDot color={status.color} />
                    <span className="row-title truncate">{status.name}</span>
                  </span>

                  <span className="row-sub truncate">
                    {STATUS_KIND_LABELS[status.kind]}
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="text-[11px] text-faint">#{index + 1}</span>
                    <span className="btn btn--ghost btn--sm">editar</span>
                  </span>
                </summary>

                <div className="border-t border-line bg-bg/60">
                  <StatusForm
                    status={status}
                    nextOrder={nextOrder}
                    idPrefix={`edit-${status.id}-`}
                  />
                  <StatusDelete status={status} />
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="novo-status-titulo">
        <div className="panel">
          <div className="panel-head">
            <span id="novo-status-titulo">novo status</span>
            <span>vira opção de coluna</span>
          </div>
          <StatusForm nextOrder={nextOrder} idPrefix="novo-" />
        </div>

        <p className="comment mt-4">
          {'// "concluído" conta como entrega nos números do painel. "bloqueado" aparece em vermelho no cartão.'}
        </p>
      </section>
    </div>
  );
}

function StatusesSkeleton() {
  return (
    <div className="wrap py-8">
      <EmptyState>{"// carregando status..."}</EmptyState>
    </div>
  );
}
