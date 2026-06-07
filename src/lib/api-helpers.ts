import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "./db";
import { getTokenFromRequest, verifyToken, type JWTPayload } from "./auth";
import { ROLES } from "./constants";

type RouteContext = { params: Promise<{ id: string }> };

export interface AuthContext {
  id: string;
  email: string;
  role: string;
  hospitalId?: string;
}

function toAuthContext(payload: JWTPayload): AuthContext {
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    hospitalId: payload.hospitalId ?? (payload.role === ROLES.HOSPITAL ? payload.userId : undefined),
  };
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return toAuthContext(payload);
}

export async function withAuth(
  request: NextRequest,
  handler: (userId: string, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return handler(payload.userId, request);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function withAuthContext(
  request: NextRequest,
  handler: (auth: AuthContext, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await connectDB();
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return handler(auth, request);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function withAuthParams(
  request: NextRequest,
  context: RouteContext,
  handler: (userId: string, request: NextRequest, id: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const { id } = await context.params;
  return withAuth(request, (userId, req) => handler(userId, req, id));
}

export function apiHandler(
  handler: (userId: string, request: NextRequest) => Promise<NextResponse>
) {
  return (request: NextRequest) => withAuth(request, handler);
}

export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function withRoleParams(
  request: NextRequest,
  context: RouteContext,
  roles: string[],
  handler: (auth: AuthContext, request: NextRequest, id: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const { id } = await context.params;
  return withRole(request, roles, (auth, req) => handler(auth, req, id));
}

export function roleHandler(
  roles: string[],
  handler: (auth: AuthContext, request: NextRequest) => Promise<NextResponse>
) {
  return (request: NextRequest) => withRole(request, roles, handler);
}

export function roleParamsHandler(
  roles: string[],
  handler: (auth: AuthContext, request: NextRequest, id: string) => Promise<NextResponse>
) {
  return (request: NextRequest, context: RouteContext) =>
    withRoleParams(request, context, roles, handler);
}

export function hospitalHandler(
  handler: (hospitalId: string, auth: AuthContext, request: NextRequest) => Promise<NextResponse>
) {
  return (request: NextRequest) =>
    withRole(request, [ROLES.HOSPITAL], async (auth, req) => {
      if (!auth.hospitalId) {
        return errorResponse("Hospital context missing", 403);
      }
      return handler(auth.hospitalId, auth, req);
    });
}

export function hospitalParamsHandler(
  handler: (hospitalId: string, auth: AuthContext, request: NextRequest, id: string) => Promise<NextResponse>
) {
  return (request: NextRequest, context: RouteContext) =>
    withRoleParams(request, context, [ROLES.HOSPITAL], async (auth, req, id) => {
      if (!auth.hospitalId) {
        return errorResponse("Hospital context missing", 403);
      }
      return handler(auth.hospitalId, auth, req, id);
    });
}

export async function withRole(
  request: NextRequest,
  roles: string[],
  handler: (auth: AuthContext, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await connectDB();

    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!roles.includes(auth.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    return handler(auth, request);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
