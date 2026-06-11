"use client";

import { useEffect } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { AdminPageShell } from "@/components/super-admin/page-shell";
import { PageHeader } from "@/components/super-admin/page-header";
import { useNotificationStore } from "@/hooks/use-notifications";

export function NotificationsContent() {
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const typeColor = (type: string) => {
    const colors: Record<string, string> = {
      reminder: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      missed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      family: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      system: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[type] || colors.system;
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete notification");
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update notification");
    }
  };

  return (
    <AdminPageShell>
      <PageHeader
        title="Notifications"
        description="Stay updated on your medicine reminders"
        icon={Bell}
        badge={unreadCount || undefined}
      >
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id.toString()}
              className={`shadow-sm ${notification.status === "unread" ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex gap-3">
                  <div className={`mt-0.5 rounded-full p-2 ${typeColor(notification.type)}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{notification.title}</p>
                      {notification.status === "unread" && <Badge variant="default" className="text-[10px]">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {notification.status === "unread" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkAsRead(String(notification._id))}
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(String(notification._id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
