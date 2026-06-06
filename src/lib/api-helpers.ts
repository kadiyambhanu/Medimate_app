import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "./db";
import { getTokenFromRequest, verifyToken } from "./auth";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function withRole(
  request: NextRequest,
  roles: string[],
  handler: (userId: string, request: NextRequest, role: string) => Promise<NextResponse>
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

    if (!roles.includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    return handler(payload.userId, request, payload.role);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
