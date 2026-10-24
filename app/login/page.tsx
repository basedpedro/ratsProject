import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentPerson } from "@/lib/auth";

export const metadata: Metadata = {
  title: "entrar",
};

export const instant = false;

export default async function LoginPage() {
  const person = await getCurrentPerson();
  if (person) {
    redirect("/");
  }

  return (
    <main className="login-shell">
      <div className="login-window">
        <div className="panel-head">
          <span>~/rats/pm</span>
          <span>login</span>
        </div>

        <div className="px-5 pt-5 pb-3">
          <p className="comment">{"// acesso da equipe"}</p>
          <h1 className="login-title">
            rats pm<span className="cursor">_</span>
          </h1>
        </div>

        <LoginForm />

        <div className="border-t border-line px-5 py-3 text-[11px] faint">
          sem cadastro aberto. a conta é criada pelo administrador.
        </div>
      </div>
    </main>
  );
}
