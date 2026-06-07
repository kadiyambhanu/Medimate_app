import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser, sanitizeUser, sanitizeHospital } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";
import Hospital from "@/models/Hospital";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    if (auth.role === ROLES.HOSPITAL) {
      const hospital = await Hospital.findById(auth.userId);
      if (!hospital) {
        return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: {
          ...sanitizeHospital(hospital.toObject()),
          _id: hospital._id.toString(),
          role: ROLES.HOSPITAL,
        },
      });
    }

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
