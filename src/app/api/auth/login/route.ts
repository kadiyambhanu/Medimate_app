import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { comparePassword, generateToken, setAuthCookie, sanitizeUser, sanitizeHospital } from "@/lib/auth";
import { loginSchema } from "@/validations/auth";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";
import Hospital from "@/models/Hospital";

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

    const hospital = await Hospital.findOne({ email });
    if (hospital) {
      if (hospital.status !== "active") {
        return NextResponse.json(
          { success: false, message: "Hospital account is deactivated" },
          { status: 403 }
        );
      }

      if (!(await comparePassword(password, hospital.password))) {
        return NextResponse.json(
          { success: false, message: "Invalid email or password" },
          { status: 401 }
        );
      }

      const hospitalId = hospital._id.toString();
      const token = generateToken({
        userId: hospitalId,
        email: hospital.email,
        role: ROLES.HOSPITAL,
        hospitalId,
      });

      await setAuthCookie(token);

      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: {
          ...sanitizeHospital(hospital.toObject()),
          _id: hospitalId,
          role: ROLES.HOSPITAL,
        },
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: sanitizeUser(user.toObject()),
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
