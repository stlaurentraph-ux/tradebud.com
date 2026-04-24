'use client';

import { Bell, Search, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
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
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, description, breadcrumbs, actions }: AppHeaderProps) {
  return (
    <header className="flex min-h-16 flex-wrap items-start justify-between gap-3 border-b border-border bg-white px-6 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
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
        <h1 className="break-words text-xl font-semibold leading-tight text-foreground">{title}</h1>
        {(subtitle || description) && (
          <p className="mt-0.5 break-words text-sm leading-snug text-muted-foreground">
            {subtitle ?? description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 self-start">
        {/* Custom actions slot */}
        {actions}

        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Calendar className="mr-2 h-4 w-4" />
          Last 30 days
        </Button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shipments, plots, producers..."
            className="w-72 bg-white pl-9"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="secondary"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                0
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <p className="text-sm font-medium">Notifications</p>
            </div>
            <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
