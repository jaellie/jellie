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
    <div className="flex items-center gap-2 rounded-lg border border-paw-100 bg-white px-3 py-2">
      {activity.favicon ? (
        <img src={activity.favicon} alt="" className="h-4 w-4 flex-shrink-0 rounded-sm" />
      ) : (
        <div className="h-4 w-4 flex-shrink-0 rounded-sm bg-stone-200" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-stone-800">
          {activity.title || activity.url}
        </p>
        <p className="truncate text-xs text-stone-400">
          {activity.domain} · {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
      {action}
    </div>
  );
}
