import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Board } from "@/components/board";
import { EmptyState } from "@/components/ui";
import { getBoard } from "@/lib/queries";

export const metadata: Metadata = {
  title: "quadro",
};

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense fallback={<BoardSkeleton />}>
      <ProjectScreen params={params} />
    </Suspense>
  );
}

async function ProjectScreen({
  params,
}: Pick<PageProps<"/projects/[id]">, "params">) {
  const { id } = await params;
  const board = await getBoard(id);

  if (!board) {
    notFound();
  }

  return <Board board={board} />;
}

function BoardSkeleton() {
  return (
    <div className="wrap-wide flex flex-col gap-6 py-8">
      <div>
        <p className="comment">$ abrindo quadro...</p>
        <div className="mt-3 h-10 w-72 max-w-full bg-panel" />
      </div>
      <EmptyState>{"// carregando tarefas..."}</EmptyState>
    </div>
  );
}
