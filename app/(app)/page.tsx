import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectCreateForm } from "@/components/project-create-form";
import { EmptyState, SectionCommand, StatusDot } from "@/components/ui";
import { formatDueDate, isOverdueOn } from "@/lib/dates";
import type { AgendaTask, ProjectSummary } from "@/lib/domain";
import {
  getDashboardStats,
  getToday,
  listAgenda,
  listProjectSummaries,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "projetos",
};

export default function DashboardPage() {
  return (
    <>
      <section className="wrap pt-12 pb-8">
        <SectionCommand>{"// painel de projetos da equipe"}</SectionCommand>
        <h1 className="mt-3 text-[clamp(2.5rem,9vw,5.5rem)] leading-none font-extrabold tracking-[-0.06em] text-fg-strong">
          projetos<span className="accent">_</span>
        </h1>
      </section>

      <hr className="rule" />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  const [stats, projects, agenda, today] = await Promise.all([
    getDashboardStats(),
    listProjectSummaries(),
    listAgenda(6),
    getToday(),
  ]);

  return (
    <div className="wrap flex flex-col gap-10 py-8">
      <section aria-label="Resumo">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat value={stats.activeProjects} label="projetos ativos" />
          <Stat value={stats.openTasks} label="tarefas em aberto" />
          <Stat
            value={stats.overdueTasks}
            label="tarefas atrasadas"
            tone={stats.overdueTasks > 0 ? "danger" : "normal"}
          />
          <Stat value={stats.activePeople} label="pessoas no time" />
        </div>
      </section>

      <section aria-labelledby="projetos-titulo">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionCommand>$ ls projetos/</SectionCommand>
            <h2
              id="projetos-titulo"
              className="mt-1 text-lg font-bold tracking-[-0.03em] text-fg-strong"
            >
              quadros ativos
            </h2>
          </div>

          <details className="group">
            <summary className="btn btn--ghost list-none cursor-pointer [&::-webkit-details-marker]:hidden">
              + novo projeto
            </summary>
            <div className="mt-3 max-w-xl border border-line-strong bg-panel">
              <div className="panel-head">
                <span>novo projeto</span>
                <span>3 colunas automáticas</span>
              </div>
              <ProjectCreateForm />
            </div>
          </details>
        </div>

        {projects.length === 0 ? (
          <div className="mt-4">
            <EmptyState>{"// nenhum projeto ainda. crie o primeiro em &quot;novo projeto&quot;."}</EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="agenda-titulo">
        <SectionCommand>$ cat agenda.log</SectionCommand>
        <h2
          id="agenda-titulo"
          className="mt-1 text-lg font-bold tracking-[-0.03em] text-fg-strong"
        >
          próximos prazos
        </h2>

        {agenda.length === 0 ? (
          <div className="mt-3">
            <EmptyState>{"// nenhuma tarefa com prazo definido."}</EmptyState>
          </div>
        ) : (
          <ul className="mt-3 border-t border-line">
            {agenda.map((item) => (
              <AgendaRow key={item.id} item={item} today={today} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  value,
  label,
  tone = "normal",
}: {
  value: number;
  label: string;
  tone?: "normal" | "danger";
}) {
  return (
    <div className="stat">
      <span className={`stat-value ${tone === "danger" ? "danger" : ""}`}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const openTasks = project.totalTasks - project.doneTasks;
  const percent =
    project.totalTasks === 0
      ? 0
      : Math.round((project.doneTasks / project.totalTasks) * 100);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="panel panel-hover flex flex-col gap-3 p-4 transition-colors"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xl leading-none font-bold tracking-[-0.04em] text-fg-strong">
          {project.name}
          <span className="accent">/</span>
        </h3>
        <span className="text-[11px] text-faint">{percent}%</span>
      </div>

      <p className="min-h-[2.4rem] text-[13px] text-muted">
        {project.description || "// sem descrição"}
      </p>

      <div className="progress">
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>

      <div className="flex justify-between text-[11px] text-faint">
        <span>{openTasks} em aberto</span>
        <span>{project.doneTasks} concluídas</span>
      </div>
    </Link>
  );
}

function AgendaRow({ item, today }: { item: AgendaTask; today: string }) {
  const overdue = isOverdueOn(item.dueDate, today);

  return (
    <li className="flex items-baseline gap-3 border-b border-line py-2 text-[13px]">
      <span className={`w-12 shrink-0 ${overdue ? "danger" : "faint"}`}>
        {formatDueDate(item.dueDate)}
      </span>
      <StatusDot color={item.statusColor} />
      <Link
        href={`/projects/${item.projectId}`}
        className="min-w-0 flex-1 truncate hover:text-accent"
      >
        {item.title}
      </Link>
      <span className="hidden shrink-0 text-[11px] text-faint sm:inline">
        {item.projectName}
      </span>
      <span className="w-20 shrink-0 truncate text-right text-[11px] text-faint">
        {item.assigneeName ?? "sem responsável"}
      </span>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="wrap flex flex-col gap-8 py-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="stat">
            <span className="stat-value faint">··</span>
            <span className="stat-label">carregando</span>
          </div>
        ))}
      </div>
      <EmptyState>{"// carregando projetos..."}</EmptyState>
    </div>
  );
}
