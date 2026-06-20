"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched notifications:", data);
        if (data.success && data.data) {
          setNotifications(data.data.notifications || []);
          setUnreadCount((data.data.notifications || []).length);
        } else {
          setNotifications(data.notifications || []);
          setUnreadCount((data.notifications || []).length);
        }
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleRead = async (notification: any) => {
    try {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: "POST",
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      if (notification.link) {
        router.push(notification.link);
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  return (
    <Popover>
      <PopoverTrigger className="relative flex items-center justify-center p-2 rounded-full hover:bg-zinc-800 transition-colors">
        <Bell className="w-5 h-5 text-zinc-400 hover:text-zinc-200 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-zinc-900" />
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 mr-4 bg-zinc-900 border-zinc-800"
        align="end"
      >
        <div className="p-4 border-b border-zinc-800">
          <h4 className="font-semibold text-sm text-zinc-200">Notifications</h4>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">
              No unread notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleRead(n)}
                className="flex items-start gap-3 p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <div
                  className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                    n.priority === "high"
                      ? "bg-red-500"
                      : n.priority === "low"
                      ? "bg-zinc-500"
                      : "bg-yellow-500"
                  }`}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-200">
                    {n.title}
                  </span>
                  <span className="text-xs text-zinc-400">{n.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
