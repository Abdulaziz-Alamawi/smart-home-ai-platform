"use client";

import { AlertTriangle, Bell, CheckCheck, Info, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, EmptyState, PageHeader, PageLoader } from "@/components/ui";
import { api } from "@/lib/api";
import { ApiList, Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function icon(type: Notification["type"]) {
  switch (type) {
    case "ALERT":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "WARNING":
      return <TriangleAlert className="h-5 w-5 text-amber-500" />;
    case "RECOMMENDATION":
      return <Sparkles className="h-5 w-5 text-brand-600" />;
    default:
      return <Info className="h-5 w-5 text-gray-400" />;
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get<ApiList<Notification>>("/notifications?pageSize=100");
      setItems(res.items);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAll = async () => {
    await api.post("/notifications/read-all");
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const remove = async (id: string) => {
    await api.del(`/notifications/${id}`);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) return <PageLoader />;

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        action={
          <button className="btn-secondary" onClick={markAll} disabled={unread === 0}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`card flex items-start justify-between gap-4 p-4 ${n.isRead ? "opacity-70" : ""}`}
            >
              <div className="flex items-start gap-3">
                {icon(n.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{n.title}</h3>
                    {!n.isRead && <Badge color="brand">New</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(n.createdAt)}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)} className="btn-ghost p-2 text-brand-600" aria-label="Mark read">
                    <Bell className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => remove(n.id)} className="btn-ghost p-2 text-red-500" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
