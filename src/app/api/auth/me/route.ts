import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser, sanitizeUser } from "@/lib/auth";
import User from "@/models/User";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sanitizeUser(user.toObject()) });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch user" }, { status: 500 });
  }
}
