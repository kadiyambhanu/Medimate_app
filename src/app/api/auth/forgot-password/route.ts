import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { generateResetToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/validations/auth";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: parsed.data.email });

    if (user) {
      const resetToken = generateResetToken();
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 3600000);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process request" },
      { status: 500 }
    );
  }
}
