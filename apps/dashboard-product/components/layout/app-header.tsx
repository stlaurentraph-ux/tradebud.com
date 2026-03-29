'use client';

import { Bell, Search, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, breadcrumbs, actions }: AppHeaderProps) {
  // Demo notifications
  const notifications = [
    {
      id: '1',
      title: 'Package Approved',
      message: 'DDS-2024-001 has passed compliance check',
      time: '2h ago',
      type: 'success' as const,
    },
    {
      id: '2',
      title: 'Compliance Alert',
      message: 'Pre-flight check required for 2 plots',
      time: '5h ago',
      type: 'warning' as const,
    },
    {
      id: '3',
      title: 'TRACES Submission',
      message: 'DDS-2024-003 submitted successfully',
      time: '1d ago',
      type: 'info' as const,
    },
  ];

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-3 w-3" />
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Custom actions slot */}
        {actions}

        {/* Date Filter */}
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Calendar className="mr-2 h-4 w-4" />
          Last 30 days
        </Button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search packages, plots, farmers..."
            className="w-72 bg-secondary pl-9"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {notifications.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <p className="text-sm font-medium">Notifications</p>
              <Button variant="ghost" size="sm" className="text-xs h-auto py-1">
                Mark all read
              </Button>
            </div>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      notification.type === 'success'
                        ? 'bg-primary'
                        : notification.type === 'warning'
                        ? 'bg-chart-3'
                        : 'bg-chart-2'
                    }`}
                  />
                  <span className="text-sm font-medium">{notification.title}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-4">
                  {notification.message}
                </span>
                <span className="text-xs text-muted-foreground pl-4">
                  {notification.time}
                </span>
              </DropdownMenuItem>
            ))}
            <div className="border-t border-border p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
