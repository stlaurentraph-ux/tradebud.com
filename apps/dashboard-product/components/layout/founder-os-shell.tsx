'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/founder-os', label: 'Today' },
  { href: '/founder-os/crm/daily-actions', label: 'Outreach Queue' },
  { href: '/founder-os/crm/prospects', label: 'People' },
  { href: '/founder-os/content/calendar', label: 'Content Board' },
  { href: '/founder-os/content/tasks', label: 'Task Log' },
];

export function FounderOsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Founder OS</h1>
            <p className="text-xs text-muted-foreground">3 outreaches/day, 2 posts/week</p>
          </div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            Back to Admin
          </Link>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-3">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/founder-os' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
