import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { hashPassword, generateToken, setAuthCookie, sanitizeUser } from "@/lib/auth";
import { superAdminRegisterSchema } from "@/validations/auth";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";
import Hospital from "@/models/Hospital";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = superAdminRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;

    const [existingUser, existingHospital] = await Promise.all([
      User.findOne({ email }),
      Hospital.findOne({ email }),
    ]);

    if (existingUser || existingHospital) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: ROLES.SUPER_ADMIN,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: "Super admin account created",
      data: sanitizeUser(user.toObject()),
    });
  } catch (error) {
    console.error("Super admin register error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
