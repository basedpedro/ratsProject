import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login-shell">
      <div className="login-window">
        <div className="panel-head">
          <span>404</span>
          <span>não encontrado</span>
        </div>
        <div className="panel-body flex flex-col gap-4">
          <p className="comment">{"// esse caminho não existe"}</p>
          <p className="text-lg text-fg-strong">nada por aqui.</p>
          <Link href="/" className="btn">
            voltar aos projetos
          </Link>
        </div>
      </div>
    </main>
  );
}
