import { withAuth, roleHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { hospitalCreateSchema } from "@/validations/hospital";
import { ROLES } from "@/lib/constants";
import { getTokenFromRequest, verifyToken, hashPassword } from "@/lib/auth";
import Hospital from "@/models/Hospital";
import Doctor from "@/models/Doctor";

export async function GET(request: Request) {
  return withAuth(request as never, async (_userId, req) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const admin = searchParams.get("admin") === "true";
    const publicList = searchParams.get("public") === "true";

    if (admin) {
      const token = getTokenFromRequest(req);
      const payload = token ? verifyToken(token) : null;
      if (payload?.role !== ROLES.SUPER_ADMIN) {
        return errorResponse("Forbidden", 403);
      }
    }

    const filter: Record<string, unknown> = {};
    if (publicList || (!admin && !publicList)) filter.status = "active";
    else if (status) filter.status = status;

    const hospitals = await Hospital.find(filter).select("-password").sort({ hospitalName: 1 }).lean();
    const doctorCounts = await Doctor.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$hospitalId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(doctorCounts.map((d) => [d._id.toString(), d.count]));

    const items = hospitals.map((hospital) => ({
      ...hospital,
      totalDoctors: countMap.get(hospital._id.toString()) ?? 0,
    }));

    return successResponse(items);
  });
}

export const POST = roleHandler([ROLES.SUPER_ADMIN], async (_auth, request) => {
  const body = await request.json();
  const parsed = hospitalCreateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const existing = await Hospital.findOne({ email: parsed.data.email });
  if (existing) {
    return errorResponse("Email already registered to a hospital");
  }

  const hashedPassword = await hashPassword(parsed.data.password);
  const { password: _pw, ...hospitalData } = parsed.data;

  const hospital = await Hospital.create({
    ...hospitalData,
    password: hashedPassword,
    role: ROLES.HOSPITAL,
  });

  const safe = hospital.toObject();
  delete (safe as Record<string, unknown>).password;

  return successResponse(safe, "Hospital created with login credentials", 201);
});
