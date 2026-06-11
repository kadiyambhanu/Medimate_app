import type { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string;
  avatar?: string;
  role: "user" | "SUPER_ADMIN";
  language: string;
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    reminderAlerts: boolean;
    missedDoseAlerts: boolean;
  };
  dailyRoutine?: {
    wakeUp: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    sleep: string;
  };
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicineTimings {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
}

export interface IMedicine extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  medicineName: string;
  genericName?: string;
  dosage: string;
  quantity: number;
  frequency: string;
  timings: IMedicineTimings;
  foodInstruction: string;
  foodInstructionRaw?: string;
  duration?: string;
  reminderTimes?: string[];
  startDate: Date;
  endDate?: Date;
  notes?: string;
  status: "active" | "inactive" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface IReminder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  medicineId: Types.ObjectId | IMedicine;
  reminderTime: string;
  doseSlot?: "morning" | "afternoon" | "evening" | "night";
  status: "pending" | "taken" | "missed" | "snoozed";
  notes?: string;
  takenAt?: Date;
  snoozedUntil?: Date;
  scheduledDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExtractedMedicine {
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  foodInstruction?: string;
  foodInstructionRaw?: string;
  morning?: boolean;
  afternoon?: boolean;
  evening?: boolean;
  night?: boolean;
  beforeFood?: boolean;
  afterFood?: boolean;
  reminderTimes?: string[];
  notes?: string;
}

export interface IHospital extends Document {
  _id: Types.ObjectId;
  hospitalName: string;
  logo?: string;
  email: string;
  password: string;
  phone?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  status: "active" | "inactive";
  role: "HOSPITAL";
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctor extends Document {
  _id: Types.ObjectId;
  hospitalId: Types.ObjectId | IHospital;
  name: string;
  profileImage?: string;
  specialization: string;
  qualification?: string;
  experience: number;
  consultationFee: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctorSchedule extends Document {
  _id: Types.ObjectId;
  doctorId: Types.ObjectId;
  availableDays: string[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  hospitalId: Types.ObjectId | IHospital;
  doctorId: Types.ObjectId | IDoctor;
  appointmentDate: Date;
  slotTime: string;
  status: "BOOKED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: Date;
}

export interface IPrescription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  doctorId?: Types.ObjectId;
  imageUrl: string;
  fileName: string;
  extractedText?: string;
  extractedMedicines?: IExtractedMedicine[];
  ocrStatus?: "pending" | "processing" | "completed" | "failed" | "applied";
  ocrProvider?: string;
  ocrError?: string;
  medicineIds?: Types.ObjectId[];
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFamilyMember extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  memberName: string;
  phone?: string;
  email?: string;
  relation: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: "reminder" | "missed" | "system" | "family";
  status: "unread" | "read";
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "reminder" | "missed" | "system" | "family";
  status: "unread" | "read";
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardStats {
  totalMedicines: number;
  activeMedicines: number;
  todayMedicines: number;
  missedMedicines: number;
  adherenceRate: number;
  upcomingReminders: IReminder[];
  recentActivity: ActivityItem[];
  weeklyAdherence: { day: string; taken: number; missed: number; total: number }[];
}

export interface ActivityItem {
  id: string;
  type: "taken" | "missed" | "added" | "updated";
  title: string;
  description: string;
  timestamp: Date;
}

export interface IInventory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  medicineId: Types.ObjectId | IMedicine;
  medicineName: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  lastRestockedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuperAdminStats {
  totalHospitals: number;
  activeHospitals: number;
  totalDoctors: number;
  totalAppointments: number;
  totalPatients: number;
}

export interface HospitalDashboardStats {
  totalDoctors: number;
  activeDoctors: number;
  todayAppointments: number;
  totalPatients: number;
}

export interface AuthUser {
  _id: string;
  name?: string;
  hospitalName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  status?: "active" | "inactive";
  role: "user" | "SUPER_ADMIN" | "HOSPITAL";
  language?: string;
  notificationSettings?: IUser["notificationSettings"];
  dailyRoutine?: IUser["dailyRoutine"];
}
