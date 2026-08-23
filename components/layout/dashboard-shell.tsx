"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar";
import { AiStatusToggle } from "@/components/dashboard/ai-status-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/app/actions/auth";
import { LogoMark, LogoWordmark } from "@/components/brand/logo";
import { initials } from "@/lib/format";

export function DashboardShell({
  businessName,
  employeeName,
  initialStatus,
  userFullName,
  children,
}: {
  businessName: string;
  employeeName: string;
  initialStatus: "online" | "offline";
  userFullName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-ink py-5 lg:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-4">
          <LogoMark className="h-8 w-8" />
          <div>
            <LogoWordmark tone="light" className="text-[14px]" />
            <div className="truncate text-[11px] text-[#8A90A0]">{businessName}</div>
          </div>
        </Link>
        <SidebarNav />
        <div className="mt-auto px-4 pt-4">
          <div className="rounded-xl border border-ink-line bg-ink-soft p-3">
            <div className="text-[11px] font-medium text-[#8A90A0]">Receptionist</div>
            <div className="mt-0.5 text-[13px] font-medium text-white">{employeeName}</div>
            <div className="mt-2">
              <AiStatusToggle initialStatus={initialStatus} compact />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-ink py-5">
            <div className="mb-6 flex items-center justify-between px-4">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                <LogoMark className="h-8 w-8" />
                <LogoWordmark tone="light" className="text-[14px]" />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="text-[#8A90A0]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              className="text-text-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <AiStatusToggle initialStatus={initialStatus} />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-paper"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px]">{initials(userFullName)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-[13px] font-medium text-text sm:block">{userFullName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-text-faint" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border bg-card p-1 shadow-popover">
                <Link
                  href="/dashboard/settings"
                  className="block rounded-lg px-3 py-2 text-[13px] text-text hover:bg-paper"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit profile
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-soft"
                  >
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
