"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DdsPackage {
  id: string;
  status: "draft" | "pending" | "submitted" | "approved" | "rejected";
  traces_reference?: string | null;
  farmer_name?: string;
  total_weight_kg?: number;
  created_at: string;
}

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const },
  pending: { label: "Pending", variant: "warning" as const },
  submitted: { label: "Submitted", variant: "info" as const },
  approved: { label: "Approved", variant: "success" as const },
  rejected: { label: "Rejected", variant: "destructive" as const },
};

interface PackagesTableProps {
  packages: DdsPackage[];
  loading?: boolean;
  onViewPackage?: (id: string) => void;
  onSubmitToTraces?: (id: string) => void;
}

export function PackagesTable({
  packages,
  loading,
  onViewPackage,
  onSubmitToTraces,
}: PackagesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.traces_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.farmer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Recent DDS Packages</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No packages found matching your search."
                : "No DDS packages yet. Record harvests in the offline app to see them here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Package ID
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    TRACES Ref
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Farmer
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Weight
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Created
                  </th>
                  <th className="pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPackages.map((pkg) => {
                  const status = statusConfig[pkg.status] || statusConfig.draft;
                  return (
                    <tr
                      key={pkg.id}
                      className="group transition-colors hover:bg-muted/50"
                    >
                      <td className="py-4 pr-4">
                        <span className="font-mono text-sm">
                          {pkg.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-4 pr-4">
                        {pkg.traces_reference ? (
                          <span className="font-mono text-sm text-primary">
                            {pkg.traces_reference}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm">
                          {pkg.farmer_name || "Unknown"}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm">
                          {pkg.total_weight_kg
                            ? `${pkg.total_weight_kg.toLocaleString()} kg`
                            : "—"}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(pkg.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewPackage?.(pkg.id)}
                            >
                              <ChevronRight className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {pkg.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() => onSubmitToTraces?.(pkg.id)}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Submit to TRACES
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
