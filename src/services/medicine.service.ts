import api from "@/lib/api";
import type { MedicineInput } from "@/validations/medicine";
import type { IMedicine, PaginatedResponse } from "@/types";

export const medicineService = {
  getAll: (params?: { page?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<IMedicine>>("/medicines", { params }),

  getById: (id: string) => api.get<IMedicine>(`/medicines/${id}`),

  create: (data: MedicineInput) => api.post<IMedicine>("/medicines", data),

  update: (id: string, data: MedicineInput) => api.put<IMedicine>(`/medicines/${id}`, data),

  delete: (id: string) => api.delete(`/medicines/${id}`),
};
