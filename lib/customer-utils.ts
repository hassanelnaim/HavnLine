import type { DbCustomer } from "@/lib/database/types";

/**
 * Counts customers whose created_at falls within the last N days —
 * powers the editable-timeframe "New Customers" stat on Overview.
 *
 * Deliberately kept in its own file with zero server-only imports
 * (no Supabase server client, no next/headers) so client components
 * can import it directly without accidentally pulling server code
 * into the browser bundle.
 */
export function countNewCustomers(customers: DbCustomer[], days: number): number {
  if (days <= 0) return customers.length; // "all time"
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return customers.filter((c) => new Date(c.created_at).getTime() >= cutoff).length;
}
