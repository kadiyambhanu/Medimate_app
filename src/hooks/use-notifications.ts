"use client";

import { create } from "zustand";
import api from "@/lib/api";
import type { NotificationItem } from "@/types";

function normalizeId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return (value as { toString: () => string }).toString();
  }
  return String(value);
}

function normalizeNotification(item: NotificationItem): NotificationItem {
  return {
    ...item,
    _id: normalizeId(item._id),
    userId: normalizeId(item.userId),
  };
}

function updateUnreadCount(notifications: NotificationItem[]) {
  return notifications.filter((n) => n.status === "unread").length;
}

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
      const notifications: NotificationItem[] = (data.data || []).map(normalizeNotification);
      set({
        notifications,
        unreadCount: updateUnreadCount(notifications),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
  markAsRead: async (id: string) => {
    const normalizedId = normalizeId(id);
    try {
      await api.patch(`/notifications/${normalizedId}`, { status: "read" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message !== "Notification not found") throw error;
    }

    const notifications = get().notifications.map((n) =>
      normalizeId(n._id) === normalizedId ? { ...n, status: "read" as const } : n
    );
    set({
      notifications,
      unreadCount: updateUnreadCount(notifications),
    });
  },
  markAllAsRead: async () => {
    await api.patch("/notifications/mark-all-read");
    const notifications = get().notifications.map((n) => ({ ...n, status: "read" as const }));
    set({ notifications, unreadCount: 0 });
  },
  deleteNotification: async (id: string) => {
    const normalizedId = normalizeId(id);

    try {
      await api.delete(`/notifications/${normalizedId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message !== "Notification not found") throw error;
    }

    const notifications = get().notifications.filter(
      (n) => normalizeId(n._id) !== normalizedId
    );
    set({
      notifications,
      unreadCount: updateUnreadCount(notifications),
    });
  },
}));
