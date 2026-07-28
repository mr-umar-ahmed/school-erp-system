import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/token";
import { SESSION_COOKIE, ROLE_HOME, AREA_ROLES } from "@/lib/constants";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/offline",
]);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (PUBLIC_PATHS.has(pathname)) {
    // Already signed in — bounce off the auth pages to the dashboard.
    if (session && pathname !== "/offline") {
      return NextResponse.redirect(
        new URL(ROLE_HOME[session.role], request.url)
      );
    }
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  // Role-gate the dashboard areas by first path segment.
  const area = pathname.split("/")[1];
  const allowed = AREA_ROLES[area];
  if (allowed && !allowed.includes(session.role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals, API routes, and static files.
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons|images|screenshots|lottie|.*\\.(?:png|jpg|jpeg|svg|webp|ico|json)).*)",
  ],
};
