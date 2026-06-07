import { startOfDay, endOfDay } from "date-fns";
import Hospital from "@/models/Hospital";
import Doctor from "@/models/Doctor";
import User from "@/models/User";
import Appointment from "@/models/Appointment";
import { ROLES } from "@/lib/constants";

export async function getSuperAdminDashboardStats() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [totalHospitals, activeHospitals, totalDoctors, totalAppointments, totalPatients] =
    await Promise.all([
      Hospital.countDocuments(),
      Hospital.countDocuments({ status: "active" }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      User.countDocuments({ role: ROLES.PATIENT }),
    ]);

  return { totalHospitals, activeHospitals, totalDoctors, totalAppointments, totalPatients };
}

export async function getHospitalReports() {
  const hospitals = await Hospital.find().select("-password").sort({ createdAt: -1 }).lean();
  const doctorCounts = await Doctor.aggregate([
    { $group: { _id: "$hospitalId", count: { $sum: 1 } } },
  ]);
  const appointmentCounts = await Appointment.aggregate([
    { $group: { _id: "$hospitalId", count: { $sum: 1 } } },
  ]);

  const doctorMap = new Map(doctorCounts.map((d) => [d._id.toString(), d.count]));
  const appointmentMap = new Map(appointmentCounts.map((a) => [a._id.toString(), a.count]));

  return hospitals.map((hospital) => ({
    ...hospital,
    totalDoctors: doctorMap.get(hospital._id.toString()) ?? 0,
    totalAppointments: appointmentMap.get(hospital._id.toString()) ?? 0,
  }));
}

export async function getAppointmentReports() {
  const [byStatus, recent] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Appointment.find()
      .populate("userId", "name email")
      .populate("hospitalId", "hospitalName")
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  return {
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    recent,
  };
}

export async function getUserReports() {
  const users = await User.find({ role: ROLES.PATIENT })
    .select("name email phone createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const appointmentCounts = await Appointment.aggregate([
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(appointmentCounts.map((a) => [a._id.toString(), a.count]));

  return users.map((user) => ({
    ...user,
    totalAppointments: countMap.get(user._id.toString()) ?? 0,
  }));
}

export async function getHospitalDashboardStats(hospitalId: string) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [totalDoctors, activeDoctors, todayAppointments, patientIds] = await Promise.all([
    Doctor.countDocuments({ hospitalId }),
    Doctor.countDocuments({ hospitalId, isActive: true }),
    Appointment.countDocuments({
      hospitalId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: "BOOKED",
    }),
    Appointment.distinct("userId", { hospitalId }),
  ]);

  return {
    totalDoctors,
    activeDoctors,
    todayAppointments,
    totalPatients: patientIds.length,
  };
}
