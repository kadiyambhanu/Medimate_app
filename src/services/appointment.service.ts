import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import DoctorSchedule from "@/models/DoctorSchedule";
import Hospital from "@/models/Hospital";
import Notification from "@/models/Notification";
import {
  generateSlotsFromSchedule,
  isSlotInPast,
  normalizeAppointmentDate,
} from "@/services/slot.service";
import { formatReceiptNumber } from "@/lib/upi";
import { APPOINTMENT_FEE } from "@/lib/constants";
import type { AppointmentInput, AppointmentRescheduleInput } from "@/validations/appointment";

async function validateBooking(
  doctorId: string,
  hospitalId: string,
  appointmentDate: Date,
  slotTime: string,
  excludeAppointmentId?: string
) {
  const [hospital, doctor, schedule] = await Promise.all([
    Hospital.findById(hospitalId),
    Doctor.findById(doctorId),
    DoctorSchedule.findOne({ doctorId }),
  ]);

  if (!hospital || hospital.status !== "active") {
    throw new Error("Hospital is not available");
  }

  if (!doctor || !doctor.isActive || doctor.hospitalId.toString() !== hospitalId) {
    throw new Error("Doctor is not available");
  }

  if (!schedule) {
    throw new Error("Doctor schedule not configured");
  }

  const availableSlots = generateSlotsFromSchedule(schedule, appointmentDate);
  if (!availableSlots.includes(slotTime)) {
    throw new Error("Selected slot is not available");
  }

  if (isSlotInPast(appointmentDate, slotTime)) {
    throw new Error("Cannot book a slot in the past");
  }

  const conflictFilter: Record<string, unknown> = {
    doctorId,
    appointmentDate,
    slotTime,
    status: "BOOKED",
  };

  if (excludeAppointmentId) {
    conflictFilter._id = { $ne: excludeAppointmentId };
  }

  const existing = await Appointment.findOne(conflictFilter);
  if (existing) {
    throw new Error("This slot is already booked");
  }
}

export async function getAvailableSlots(doctorId: string, dateInput: string) {
  const schedule = await DoctorSchedule.findOne({ doctorId });
  if (!schedule) {
    return [];
  }

  const appointmentDate = normalizeAppointmentDate(dateInput);
  const allSlots = generateSlotsFromSchedule(schedule, appointmentDate);

  const booked = await Appointment.find({
    doctorId,
    appointmentDate,
    status: "BOOKED",
  }).select("slotTime");

  const bookedTimes = new Set(booked.map((a) => a.slotTime));

  return allSlots.filter((slot) => {
    if (bookedTimes.has(slot)) return false;
    if (isSlotInPast(appointmentDate, slot)) return false;
    return true;
  });
}

export async function createAppointment(userId: string, input: AppointmentInput) {
  const appointmentDate = normalizeAppointmentDate(input.appointmentDate);
  await validateBooking(input.doctorId, input.hospitalId, appointmentDate, input.slotTime);

  const isUpiPaid =
    input.paymentMethod === "UPI" && input.paymentCompleted && input.upiTransactionId;
  const paidAt = isUpiPaid ? new Date() : undefined;

  let paymentReceiptId: string | undefined;
  if (isUpiPaid) {
    const paidCount = await Appointment.countDocuments({ paymentStatus: "COMPLETED" });
    paymentReceiptId = formatReceiptNumber(paidCount + 1);
  }

  const consultationFee = APPOINTMENT_FEE;

  const appointment = await Appointment.create({
    userId,
    hospitalId: input.hospitalId,
    doctorId: input.doctorId,
    appointmentDate,
    slotTime: input.slotTime,
    notes: input.notes,
    status: "BOOKED",
    consultationFee,
    paymentMethod: input.paymentMethod,
    paymentStatus: isUpiPaid ? "COMPLETED" : "PENDING",
    paymentReceiptId,
    upiTransactionId: isUpiPaid ? input.upiTransactionId : undefined,
    paidAt,
    patientDetails: {
      name: input.patientDetails.name.trim(),
      gender: input.patientDetails.gender,
      dateOfBirth: normalizeAppointmentDate(input.patientDetails.dateOfBirth),
      height: input.patientDetails.height,
      weight: input.patientDetails.weight,
      diseaseName: input.patientDetails.diseaseName.trim(),
    },
  });

  const paymentLabel = isUpiPaid
    ? `UPI payment of ₹${consultationFee} received. Receipt: ${paymentReceiptId}`
    : "Pay at hospital on visit";

  await Notification.create({
    userId,
    title: isUpiPaid ? "Appointment Confirmed" : "Appointment Booked",
    message: isUpiPaid
      ? `Payment of ₹${consultationFee} confirmed. Your appointment with the doctor on ${appointmentDate.toDateString()} at ${input.slotTime} is confirmed. Receipt: ${paymentReceiptId}.`
      : `Your appointment on ${appointmentDate.toDateString()} at ${input.slotTime} has been booked. Appointment fee: ₹${consultationFee}. ${paymentLabel}.`,
    type: "system",
  });

  return appointment;
}

export async function rescheduleAppointment(
  appointmentId: string,
  input: AppointmentRescheduleInput,
  userId?: string,
  isAdmin = false
) {
  const filter: Record<string, unknown> = { _id: appointmentId };
  if (!isAdmin && userId) filter.userId = userId;

  const appointment = await Appointment.findOne(filter);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.status === "CANCELLED") {
    throw new Error("Cannot reschedule a cancelled appointment");
  }

  const appointmentDate = normalizeAppointmentDate(input.appointmentDate);
  await validateBooking(
    appointment.doctorId.toString(),
    appointment.hospitalId.toString(),
    appointmentDate,
    input.slotTime,
    appointmentId
  );

  appointment.appointmentDate = appointmentDate;
  appointment.slotTime = input.slotTime;
  if (input.notes !== undefined) appointment.notes = input.notes;
  appointment.status = "BOOKED";
  await appointment.save();

  await Notification.create({
    userId: appointment.userId,
    title: "Appointment Rescheduled",
    message: `Your appointment has been rescheduled to ${appointmentDate.toDateString()} at ${input.slotTime}.`,
    type: "system",
  });

  return appointment;
}

export async function cancelAppointment(appointmentId: string, userId?: string, isAdmin = false) {
  const filter: Record<string, unknown> = { _id: appointmentId };
  if (!isAdmin && userId) filter.userId = userId;

  const appointment = await Appointment.findOne(filter);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.status === "CANCELLED") {
    throw new Error("Appointment is already cancelled");
  }

  appointment.status = "CANCELLED";
  await appointment.save();

  await Notification.create({
    userId: appointment.userId,
    title: "Appointment Cancelled",
    message: `Your appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.slotTime} has been cancelled.`,
    type: "system",
  });

  return appointment;
}

export async function deleteAppointment(appointmentId: string, hospitalId: string) {
  const appointment = await Appointment.findOneAndDelete({ _id: appointmentId, hospitalId });
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  await Notification.create({
    userId: appointment.userId,
    title: "Appointment Removed",
    message: `Your appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.slotTime} has been removed by the hospital.`,
    type: "system",
  });

  return appointment;
}
