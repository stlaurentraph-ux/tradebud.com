"use client";

import { Package, CheckCircle, AlertTriangle, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Activity {
  id: string;
  type: "package_created" | "package_submitted" | "package_approved" | "package_rejected" | "plot_verified" | "alert";
  title: string;
  description: string;
  timestamp: string;
}

const activityIcons = {
  package_created: Package,
  package_submitted: Clock,
  package_approved: CheckCircle,
  package_rejected: AlertTriangle,
  plot_verified: MapPin,
  alert: AlertTriangle,
};

const activityColors = {
  package_created: "text-blue-500 bg-blue-500/10",
  package_submitted: "text-yellow-500 bg-yellow-500/10",
  package_approved: "text-green-500 bg-green-500/10",
  package_rejected: "text-red-500 bg-red-500/10",
  plot_verified: "text-primary bg-primary/10",
  alert: "text-yellow-500 bg-yellow-500/10",
};

interface ActivityFeedProps {
  activities?: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const defaultActivities: Activity[] = [
    {
      id: "1",
      type: "package_approved",
      title: "Package Approved",
      description: "DDS-2024-001 was approved by TRACES",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "package_submitted",
      title: "Package Submitted",
      description: "DDS-2024-002 submitted for verification",
      timestamp: "5 hours ago",
    },
    {
      id: "3",
      type: "plot_verified",
      title: "Plot Verified",
      description: "Finca El Paraíso plot boundaries confirmed",
      timestamp: "1 day ago",
    },
    {
      id: "4",
      type: "package_created",
      title: "New Package Created",
      description: "DDS-2024-003 created from harvest batch",
      timestamp: "2 days ago",
    },
    {
      id: "5",
      type: "alert",
      title: "Compliance Alert",
      description: "2 plots require deforestation check",
      timestamp: "3 days ago",
    },
  ];

  const data = activities || defaultActivities;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
