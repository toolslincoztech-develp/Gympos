import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

const ADMIN_ROUTES = [
  "/admin-dashboard",
  "/tenants",
  "/modules",
  "/subscriptions",
  "/admin-settings",
];

const MODULE_ROUTES: Record<string, string> = {
  "/dashboard/gym": "GYM_FITNESS_PRO",
  "/dashboard/pos": "POS_BASIC",
  "/dashboard/orders": "POS_BASIC",
  "/dashboard/inventory": "POS_BASIC",
  "/dashboard/customers": "CRM_LOYALTY",
  "/dashboard/hr": "HR_PAYROLL",
  "/dashboard/expenses": "POS_BASIC",
  "/dashboard/finance": "POS_BASIC",
  "/dashboard/reports": "ANALYTICS",
  "/dashboard/users": "POS_BASIC",
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!isAdminRoute && !isDashboardRoute) {
    return NextResponse.next();
  }

  // No token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    const isImpersonated = Boolean(payload.isImpersonated);

    // Admin routes: only SUPER_ADMIN or impersonator allowed
    if (isAdminRoute && role !== "SUPER_ADMIN" && !isImpersonated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Dashboard routes: SUPER_ADMIN (unless impersonating) should go to admin panel
    if (isDashboardRoute && role === "SUPER_ADMIN" && !isImpersonated) {
      return NextResponse.redirect(new URL("/admin-dashboard", request.url));
    }

    // Suspended/inactive accounts
    const status = payload.status as string;
    if (status && status !== "ACTIVE") {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete("token");
      return res;
    }

    // Module-based access control for dashboard
    if (isDashboardRoute && role !== "SUPER_ADMIN") {
      const userModules = (payload.modules as string[]) || [];
      
      // Find if the current path requires a specific module
      const requiredModule = Object.entries(MODULE_ROUTES).find(([route]) => 
        pathname.startsWith(route)
      )?.[1];

      // If module assignment is missing from token, allow access but log warning
      // This prevents legacy sessions from being locked out
      if (requiredModule && userModules.length > 0 && !userModules.includes(requiredModule)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("token");
    return res;
  }
}

export const config = {
  matcher: [
    "/admin-dashboard/:path*",
    "/tenants/:path*",
    "/modules/:path*",
    "/subscriptions/:path*",
    "/admin-settings/:path*",
    "/dashboard/:path*",
  ],
};
