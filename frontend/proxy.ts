import { NextResponse, type NextRequest } from "next/server";

// Route protection is handled client-side via AuthGuard (auth state in localStorage).
// This proxy just ensures all routes are reachable; no server-side redirect needed.
export function proxy(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
