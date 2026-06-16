'use client';

import { useContext } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { LocaleContext } from '@/lib/locale-context';
import { getAppChromeCopy } from '@/lib/workflow-terminology-labels';

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
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  return (
    <header className="flex min-h-16 flex-wrap items-start justify-between gap-3 border-b border-border bg-white px-6 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="mb-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground" aria-label={getAppChromeCopy('breadcrumb_aria', t)}>
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="break-words text-xl font-semibold leading-tight text-foreground">{title}</h1>
        {(subtitle || description) ? (
          <p className="mt-0.5 break-words text-sm leading-snug text-muted-foreground">
            {subtitle ?? description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 self-start">
        {actions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label={getAppChromeCopy('notifications_aria', t)}
            >
              <Bell className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-sm font-medium">{getAppChromeCopy('notifications', t)}</p>
            </div>
            <div className="p-4 text-sm text-muted-foreground">
              {getAppChromeCopy('notifications_empty', t)}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
