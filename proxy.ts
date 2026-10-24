import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session-token";

// Primeira barreira: assinatura e validade do cookie. A segunda acontece no
// layout de (app), que consulta o banco para saber se a pessoa ainda existe
// e está ativa.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? readSessionToken(token) : null;

  if (session) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const response =
    pathname === "/login"
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));

  if (token) {
    response.cookies.delete(SESSION_COOKIE);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/health).*)"],
};
