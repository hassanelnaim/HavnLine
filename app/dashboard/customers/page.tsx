import { Users } from "lucide-react";
import { getCustomers } from "@/lib/data/customers";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageHeader title="Customers" description="Everyone your AI receptionist has talked to." />
      {customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" description="Customers your AI talks to will show up here." />
      ) : (
        <>
          {/* Desktop/tablet: real table, unchanged. */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>First seen</TableHead></TableRow></TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-text-muted">{c.phone}</TableCell>
                    <TableCell>{formatDate(c.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: same data, stacked cards instead of a cramped 3-column table. */}
          <div className="space-y-2.5 md:hidden">
            {customers.map((c) => (
              <Card key={c.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-[14px] font-semibold text-ink">{c.name}</div>
                  <div className="mt-0.5 font-mono text-[12.5px] text-text-muted">{c.phone}</div>
                </div>
                <div className="text-[12px] text-text-faint">{formatDate(c.created_at)}</div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
