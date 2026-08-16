import Link from "next/link";
import { Users } from "lucide-react";
import { getCustomers } from "@/lib/data/customers";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, initials } from "@/lib/format";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageHeader title="Customers" description="Everyone who has called or booked with your business." />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Customers are created automatically the first time they call."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/dashboard/customers/${c.id}`} className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10.5px]">{initials(c.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-text hover:text-brand">{c.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-text-muted">{c.phone}</TableCell>
                  <TableCell className="text-text-muted">{c.email || "—"}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-text-muted">{c.notes || "—"}</TableCell>
                  <TableCell className="font-mono text-text-muted">{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
