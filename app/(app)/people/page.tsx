import type { Metadata } from "next";
import { Suspense } from "react";
import { PersonDelete, PersonForm } from "@/components/person-form";
import { Avatar, EmptyState, SectionCommand } from "@/components/ui";
import { listPeople } from "@/lib/queries";

export const metadata: Metadata = {
  title: "pessoas",
};

export default function PeoplePage() {
  return (
    <>
      <section className="wrap pt-10 pb-6">
        <SectionCommand>$ cat pessoas.csv</SectionCommand>
        <h1 className="mt-2 text-[clamp(2rem,7vw,4rem)] leading-none font-extrabold tracking-[-0.06em] text-fg-strong">
          pessoas<span className="accent">_</span>
        </h1>
        <p className="comment mt-4">{"// quem recebe tarefa. quem tem acesso entra com o e-mail e a senha."}</p>
      </section>

      <hr className="rule" />

      <Suspense fallback={<PeopleSkeleton />}>
        <PeopleContent />
      </Suspense>
    </>
  );
}

async function PeopleContent() {
  const people = await listPeople();
  const activeCount = people.filter((person) => person.active).length;

  return (
    <div className="wrap grid items-start gap-8 py-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <section aria-labelledby="time-titulo">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="time-titulo"
            className="text-lg font-bold tracking-[-0.03em] text-fg-strong"
          >
            time
          </h2>
          <span className="text-[11px] text-faint">
            {activeCount} ativos de {people.length}
          </span>
        </div>

        {people.length === 0 ? (
          <div className="mt-3">
            <EmptyState>{"// ninguém cadastrado ainda."}</EmptyState>
          </div>
        ) : (
          <div className="mt-3 border-t border-line">
            {people.map((person) => (
              <details
                key={person.id}
                className="group border-b border-line [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="row-item cursor-pointer list-none">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={person.name} color={person.color} />
                    <span className="min-w-0">
                      <span className="row-title block truncate">
                        {person.name}
                        {!person.active ? (
                          <span className="chip ml-2">inativo</span>
                        ) : null}
                      </span>
                      <span className="row-sub block truncate">
                        {person.email || "sem e-mail"}
                      </span>
                    </span>
                  </span>

                  <span className="row-sub truncate">{person.role || "—"}</span>

                  <span className="btn btn--ghost btn--sm">editar</span>
                </summary>

                <div className="border-t border-line bg-bg/60">
                  <PersonForm person={person} idPrefix={`edit-${person.id}-`} />
                  <PersonDelete person={person} />
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="nova-pessoa-titulo">
        <div className="panel">
          <div className="panel-head">
            <span id="nova-pessoa-titulo">nova pessoa</span>
            <span>entra no quadro na hora</span>
          </div>
          <PersonForm idPrefix="novo-" />
        </div>

        <p className="comment mt-4">
          {'// o login não é criado por aqui. rode scripts/create-user.mts no servidor com o e-mail da pessoa.'}
        </p>
      </section>
    </div>
  );
}

function PeopleSkeleton() {
  return (
    <div className="wrap py-8">
      <EmptyState>{"// carregando pessoas..."}</EmptyState>
    </div>
  );
}
