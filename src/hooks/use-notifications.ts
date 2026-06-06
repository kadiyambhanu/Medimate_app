"use client";

import { create } from "zustand";
import api from "@/lib/api";
import type { NotificationItem } from "@/types";

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/notifications");
      const notifications: NotificationItem[] = data.data || [];
      set({
        notifications,
        unreadCount: notifications.filter((n) => n.status === "unread").length,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
  markAsRead: async (id: string) => {
    await api.patch(`/notifications/${id}`, { status: "read" });
    const notifications = get().notifications.map((n) =>
      n._id === id ? { ...n, status: "read" as const } : n
    );
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.status === "unread").length,
    });
  },
  markAllAsRead: async () => {
    await api.patch("/notifications/mark-all-read");
    const notifications = get().notifications.map((n) => ({ ...n, status: "read" as const }));
    set({ notifications, unreadCount: 0 });
  },
  deleteNotification: async (id: string) => {
    await api.delete(`/notifications/${id}`);
    const notifications = get().notifications.filter((n) => n._id !== id);
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.status === "unread").length,
    });
  },
}));
