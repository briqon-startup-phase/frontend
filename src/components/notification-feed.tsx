"use client";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { NotificationIcon, EmptyState } from "./ui";
import type { Notification } from "@/lib/types";
import { clock, outletName } from "@/lib/domain";
export function NotificationFeed({
  notifications,
  compact = false,
}: {
  notifications: Notification[];
  compact?: boolean;
}) {
  const { state, acknowledge, notify } = useWorkspace();
  if (!notifications.length)
    return (
      <EmptyState
        title="You're all caught up"
        description="No notifications match this view. Equipment monitoring continues."
      />
    );
  return (
    <div className={`notification-feed ${compact ? "is-compact" : ""}`}>
      {notifications.map((n) => {
        const e = state.equipment.find((e) => e.id === n.equipmentId)!;
        return (
          <article
            key={n.id}
            className={`notification-item ${n.acknowledged ? "is-acknowledged" : ""}`}
          >
            <div className={`notification-symbol ${n.severity}`}>
              <NotificationIcon severity={n.severity} />
            </div>
            <div className="notification-body">
              <div className="notification-title">
                <strong>{n.title}</strong>
                <time dateTime={n.createdAt}>{clock(n.createdAt)}</time>
              </div>
              <Link href={`/equipment/${e.id}`} className="notification-asset">
                {e.name}
                {!compact && ` · ${outletName(e.outletId)}`}
                <ArrowUpRight size={12} />
              </Link>
              {!compact && <p>{n.description}</p>}
              <div className="notification-foot">
                {n.acknowledged ? (
                  <span className="acknowledged-label">
                    <Check size={12} />
                    Acknowledged
                  </span>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => {
                      acknowledge(n.id);
                      notify(
                        "Notification acknowledged. Equipment condition remains under monitoring.",
                      );
                    }}
                  >
                    <Check size={13} />
                    Acknowledge
                  </button>
                )}
                {!compact && (
                  <span className="muted">
                    {n.id} ·{" "}
                    {n.severity === "resolved"
                      ? "Returned to range"
                      : n.severity === "offline"
                        ? "Connection"
                        : "Temperature"}
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
