"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  FileText,
  Settings,
  HelpCircle,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "DDS Packages", href: "/packages", icon: Package },
  { name: "Plots", href: "/plots", icon: MapPin },
  { name: "Farmers", href: "/farmers", icon: Users },
  { name: "Compliance", href: "/compliance", icon: ShieldCheck },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Admin", href: "/admin", icon: Shield },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

interface SidebarProps {
  userEmail?: string | null;
  onLogout?: () => void;
}

export function Sidebar({ userEmail, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#064E3B] text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <Image
          src="/tracebud-logo-v6.png"
          alt="Tracebud"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">
            Tracebud
          </span>
          <span className="text-xs text-emerald-300">Supplier Dashboard</span>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-emerald-300">
          Main
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500 text-white"
                  : "text-emerald-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        <Separator className="my-4 bg-white/10" />

        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-emerald-300">
          Support
        </div>
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500 text-white"
                  : "text-emerald-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-white hover:bg-white/10 hover:text-white"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-500 text-white text-xs">
                  {userEmail ? userEmail[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium text-white">
                  {userEmail ? userEmail.split("@")[0] : "Guest"}
                </span>
                <span className="text-xs text-emerald-300">Supplier</span>
              </div>
              <ChevronDown className="h-4 w-4 text-emerald-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
