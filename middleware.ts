import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // ── /superadmin/* ──────────────────────────────────────────────────────
  // Only SUPER_ADMIN can access
  if (pathname.startsWith("/superadmin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── /admin/* (except login page /admin itself) ─────────────────────────
  if (pathname.startsWith("/admin/")) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    const role = token.role as string;

    // Super admin trying to access /admin/* → send to superadmin
    if (role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/superadmin/dashboard", req.url));
    }

    // Role-based redirects from /admin/dashboard (the default landing)
    if (pathname === "/admin/dashboard" || pathname === "/admin") {
      if (role === "KITCHEN") {
        return NextResponse.redirect(new URL("/admin/kitchen", req.url));
      }
      if (role === "WAITER") {
        return NextResponse.redirect(new URL("/admin/orders", req.url));
      }
    }

    // Kitchen can only access /admin/kitchen
    if (role === "KITCHEN" && !pathname.startsWith("/admin/kitchen")) {
      return NextResponse.redirect(new URL("/admin/kitchen", req.url));
    }

    // Waiter can only access /admin/orders
    if (role === "WAITER" && !pathname.startsWith("/admin/orders")) {
      return NextResponse.redirect(new URL("/admin/orders", req.url));
    }

    // Manager cannot access /admin/menu or /admin/tables
    if (
      role === "MANAGER" &&
      (pathname.startsWith("/admin/menu") || pathname.startsWith("/admin/tables"))
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+", "/superadmin/:path*"],
};
