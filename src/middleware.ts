import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";
import { verifyTokenEdge } from "@/lib/auth-edge";
import { ROLES } from "@/lib/constants";

const publicRoutes = [
  "/splash",
  "/onboarding",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/superadmin",
  "/hospital/login",
];
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/superadmin",
  "/hospital/login",
];

function getDefaultRoute(role?: string): string {
  if (role === ROLES.SUPER_ADMIN) return "/super-admin";
  if (role === ROLES.HOSPITAL) return "/hospital";
  return "/dashboard";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/super-admin/appointments" || pathname.startsWith("/super-admin/appointments/")) {
    return NextResponse.redirect(new URL("/super-admin", request.url));
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api");
  const payload = token ? await verifyTokenEdge(token) : null;
  const isAuthenticated = !!payload;
  const role = payload?.role;

  const isSuperAdminPanel = pathname.startsWith("/super-admin");
  const isSuperAdminAuth = pathname.startsWith("/superadmin");
  const isHospitalPanel =
    (pathname === "/hospital" || pathname.startsWith("/hospital/")) &&
    !pathname.startsWith("/hospital/login");
  const isPatientRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/medicines") ||
    pathname.startsWith("/reminders") ||
    pathname.startsWith("/prescriptions") ||
    pathname.startsWith("/hospitals") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/family") ||
    pathname.startsWith("/emergency") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  if (isApiRoute) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? getDefaultRoute(role) : "/splash", request.url)
    );
  }

  if (!isAuthenticated && isSuperAdminPanel) {
    return NextResponse.redirect(new URL("/superadmin", request.url));
  }

  if (!isAuthenticated && isHospitalPanel) {
    return NextResponse.redirect(new URL("/hospital/login", request.url));
  }

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL(getDefaultRoute(role), request.url));
  }

  if (isAuthenticated && role === ROLES.SUPER_ADMIN && (isPatientRoute || isHospitalPanel)) {
    return NextResponse.redirect(new URL("/super-admin", request.url));
  }

  if (isAuthenticated && role === ROLES.HOSPITAL && (isPatientRoute || isSuperAdminPanel || isSuperAdminAuth)) {
    return NextResponse.redirect(new URL("/hospital", request.url));
  }

  if (isAuthenticated && role === ROLES.PATIENT && (isSuperAdminPanel || isSuperAdminAuth || isHospitalPanel)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
