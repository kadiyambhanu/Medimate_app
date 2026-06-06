"use server";

import { connectDB } from "@/lib/db";
import { getAuthUser, sanitizeUser } from "@/lib/auth";
import User from "@/models/User";

export async function getCurrentUserAction() {
  try {
    const auth = await getAuthUser();
    if (!auth) return { success: false, message: "Unauthorized" };

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) return { success: false, message: "User not found" };

    return { success: true, data: sanitizeUser(user.toObject()) };
  } catch {
    return { success: false, message: "Failed to fetch user" };
  }
}
