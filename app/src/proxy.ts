import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Teacher/researcher routes require auth cookie
  if (pathname.startsWith("/teacher") || pathname.startsWith("/researcher")) {
    const sessionCookie = request.cookies.get("teacher-session");

    if (!sessionCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Student session routes require a student session cookie
  if (
    pathname.startsWith("/student/session") &&
    !pathname.startsWith("/student/session/join")
  ) {
    const studentSession = request.cookies.get("student-session");
    if (!studentSession) {
      return NextResponse.redirect(new URL("/student", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*", "/researcher/:path*", "/student/session/:path*"],
};
