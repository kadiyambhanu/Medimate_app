import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { comparePassword, generateToken, setAuthCookie, sanitizeUser } from "@/lib/auth";
import { loginSchema } from "@/validations/auth";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email, role: ROLES.SUPER_ADMIN });

    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json(
        { success: false, message: "Invalid super admin credentials" },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: ROLES.SUPER_ADMIN,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: sanitizeUser(user.toObject()),
    });
  } catch (error) {
    console.error("Super admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
