import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (NextAuth uses this with JWT strategy)
  const sessionToken = request.cookies.get("authjs.session-token") ||
                       request.cookies.get("__Secure-authjs.session-token");
  const isLoggedIn = !!sessionToken;

  const isLoginOrSignup = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isPasswordReset = pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  const isAuthPage = isLoginOrSignup || isPasswordReset;
  const isApiAuthRoute = pathname.startsWith("/api/auth") || pathname.startsWith("/api/register");

  // Allow public auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login/signup (but allow password reset)
  if (isLoginOrSignup && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect logged-out users to login (unless they're on an auth page)
  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
