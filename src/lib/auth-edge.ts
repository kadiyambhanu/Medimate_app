import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "medimate-secret-key"
);

export interface EdgeJWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function verifyTokenEdge(token: string): Promise<EdgeJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { userId, email, role } = payload;

    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string"
    ) {
      return null;
    }

    return { userId, email, role };
  } catch {
    return null;
  }
}
