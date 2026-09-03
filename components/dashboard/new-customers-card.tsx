"use client";
import { useState, useMemo } from "react";
import { UserPlus } from "lucide-react";
import type { DbCustomer } from "@/lib/database/types";
import { countNewCustomers } from "@/lib/customer-utils";

const TIMEFRAMES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 0 },
];

/**
 * Real, working editable-timeframe version of the "New Customers"
 * stat — pick a window and the count actually recalculates from real
 * customer records, instead of a fixed, unexplained number.
 */
export function NewCustomersCard({ customers }: { customers: DbCustomer[] }) {
  const [days, setDays] = useState(30);
  const count = useMemo(() => countNewCustomers(customers, days), [customers, days]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">New customers</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
          <UserPlus className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 font-display text-[28px] font-semibold text-ink">{count}</div>
      <select
        value={days}
        onChange={(e) => setDays(parseInt(e.target.value, 10))}
        className="mt-2 rounded-md border border-border bg-paper px-2 py-1 text-[11.5px] font-medium text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        {TIMEFRAMES.map((t) => (
          <option key={t.days} value={t.days}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}
