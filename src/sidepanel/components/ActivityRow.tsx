import React from "react";
import { Activity } from "../../shared/types";
import { formatRelativeTime } from "../format";

export default function ActivityRow({
  activity,
  action,
}: {
  activity: Activity;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-ink-200/60 bg-cream-50 px-3 py-2">
      {activity.favicon ? (
        <img src={activity.favicon} alt="" className="h-4 w-4 flex-shrink-0 rounded-sm" />
      ) : (
        <div className="h-4 w-4 flex-shrink-0 rounded-sm bg-ink-200" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink-900">{activity.title || activity.url}</p>
        <p className="truncate text-xs text-ink-500">
          {activity.domain} · {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
      {action}
    </div>
  );
}
