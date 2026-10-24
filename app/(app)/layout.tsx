import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { NavLink } from "@/components/nav-link";
import { Avatar } from "@/components/ui";
import { requirePerson } from "@/lib/auth";

// O app é privado: toda rota lê a sessão no servidor antes de renderizar.
// Sem isso, o Cache Components exigiria uma casca estática para cada tela.
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const person = await requirePerson();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="masthead">
        <div className="wrap flex-wrap">
          <Link href="/" className="comment whitespace-nowrap">
            ~/rats/<span className="accent">pm</span>
          </Link>

          <nav
            aria-label="Seções"
            className="order-3 w-full border-t border-dashed border-line-strong pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0"
          >
            <NavLink href="/">./projetos</NavLink>
            <NavLink href="/people">./pessoas</NavLink>
            <NavLink href="/statuses">./status</NavLink>
          </nav>

          <div className="flex items-center gap-2.5 text-[12px] text-faint">
            <Avatar name={person.name} color={person.color} />
            <span className="hidden sm:inline">{person.name}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[12px] text-faint hover:text-accent"
              >
                sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-dashed border-line-strong">
        <div className="wrap flex flex-wrap justify-between gap-3 py-4 text-[11px] text-faint">
          <span>rats pm</span>
          <span>exit 0</span>
        </div>
      </footer>
    </div>
  );
}
