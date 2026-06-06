import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { hashPassword, generateToken, setAuthCookie, sanitizeUser } from "@/lib/auth";
import { registerSchema } from "@/validations/auth";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, phone, password: hashedPassword });

    await Notification.create({
      userId: user._id,
      title: "Welcome to MediMate!",
      message: "Your account has been created successfully. Start adding your medicines.",
      type: "system",
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      data: sanitizeUser(user.toObject()),
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
