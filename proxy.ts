import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "rpm_session";

// Checagem otimista: só evita renderizar o app sem cookie nenhum.
// A validação real da sessão acontece no layout de (app) e em cada action.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasSession && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/health).*)"],
};
