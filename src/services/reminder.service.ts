import api from "@/lib/api";
import type { ReminderInput } from "@/validations/reminder";
import type { IReminder } from "@/types";

export const reminderService = {
  getAll: (params?: { date?: string; status?: string }) =>
    api.get<IReminder[]>("/reminders", { params }),

  create: (data: ReminderInput) => api.post<IReminder>("/reminders", data),

  updateStatus: (id: string, status: string, notes?: string) =>
    api.put<IReminder>(`/reminders/${id}`, { status, notes }),

  delete: (id: string) => api.delete(`/reminders/${id}`),
};
