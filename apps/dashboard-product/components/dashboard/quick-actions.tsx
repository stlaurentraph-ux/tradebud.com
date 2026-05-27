"use client";

import { Plus, Upload, FileSearch, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onNewPackage?: () => void;
  onImportData?: () => void;
  onVerifyPlots?: () => void;
  onExportReport?: () => void;
}

export function QuickActions({
  onNewPackage,
  onImportData,
  onVerifyPlots,
  onExportReport,
}: QuickActionsProps) {
  const actions = [
    {
      icon: Plus,
      label: "New Shipment",
      description: "Create a shipment package",
      onClick: onNewPackage,
      primary: true,
    },
    {
      icon: Upload,
      label: "Import Data",
      description: "Sync from offline app",
      onClick: onImportData,
    },
    {
      icon: FileSearch,
      label: "Verify Plots",
      description: "Check plot compliance",
      onClick: onVerifyPlots,
    },
    {
      icon: Download,
      label: "Export Report",
      description: "Download data export",
      onClick: onExportReport,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.primary ? "default" : "outline"}
              className="flex h-auto flex-col items-start gap-1 p-4 text-left"
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="font-medium">{action.label}</span>
              <span
                className={`text-xs ${
                  action.primary
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
