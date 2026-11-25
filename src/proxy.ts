import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED = ["/espaces", "/s/"];

export async function proxy(request: NextRequest) {
  const { response, authenticated, configured } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const needsLogin = PROTECTED.some((p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p));
  if (configured && needsLogin && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  if (configured && authenticated && pathname === "/connexion") {
    const url = request.nextUrl.clone();
    url.pathname = "/espaces";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)"],
};
