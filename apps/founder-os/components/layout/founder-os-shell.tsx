'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
const nav=[{href:'/',label:'Today'},{href:'/strategy/intelligence',label:'Intelligence'},{href:'/strategy/markets',label:'Markets'},{href:'/crm/pipeline',label:'Pipeline'},{href:'/crm/daily-actions',label:'Outreach Queue'},{href:'/crm/prospects',label:'People'},{href:'/crm/pilots',label:'Pilots'},{href:'/crm/partnerships',label:'Partnerships'},{href:'/content/calendar',label:'Content Board'},{href:'/content/tasks',label:'Task Log'}];
export function FounderOsShell({children}:{children:ReactNode}){const pathname=usePathname();return(<div className="min-h-screen bg-background"><header className="border-b bg-white"><div className="mx-auto max-w-7xl px-6 py-4"><h1 className="text-xl font-semibold">Founder OS</h1></div><div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-3">{nav.map(i=>{const a=pathname===i.href||(i.href!=='/'&&pathname.startsWith(i.href));return<Link key={i.href} href={i.href} className={cn('whitespace-nowrap rounded-md px-3 py-1.5 text-sm',a?'bg-primary text-primary-foreground':'bg-muted')}>{i.label}</Link>;})}</div></header><main>{children}</main></div>);}
