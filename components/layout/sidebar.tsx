"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Phone, CalendarCheck, Users, Bot, MessageSquare, BookOpen, Plug, CreditCard, Settings, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/calls", label: "Calls", icon: Phone },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/escalations", label: "Escalations", icon: AlertTriangle },
  { href: "/dashboard/ai-employee", label: "AI Employee", icon: Bot },
  { href: "/dashboard/test-receptionist", label: "Test Receptionist", icon: MessageSquare },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5 px-2">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              active ? "bg-brand text-white" : "text-[#B8C0D0] hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
