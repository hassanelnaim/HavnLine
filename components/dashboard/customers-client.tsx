"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, MessageSquare, ShieldOff, Trash2 } from "lucide-react";
import { deleteCustomerAction, blockNumberAction } from "@/app/actions/customers";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

interface Customer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

function CustomerMenu({ customer, onDeleteClick }: { customer: Customer; onDeleteClick: () => void }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleBlock() {
    setOpen(false);
    startTransition(async () => {
      await blockNumberAction(customer.phone, "Blocked from Customers page");
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setOpen((v) => !v)} className="rounded-md p-1.5 text-text-faint hover:bg-paper hover:text-text" aria-label="Manage customer">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-popover">
          <a href={`sms:${customer.phone}`} className="flex items-center gap-2 px-3 py-2 text-[13px] text-text hover:bg-paper">
            <MessageSquare className="h-3.5 w-3.5" /> Text {customer.name}
          </a>
          <button onClick={handleBlock} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-warning hover:bg-paper">
            <ShieldOff className="h-3.5 w-3.5" /> Block this number
          </button>
          <button onClick={() => { setOpen(false); onDeleteClick(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-paper">
            <Trash2 className="h-3.5 w-3.5" /> Delete customer
          </button>
        </div>
      )}
    </div>
  );
}

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    if (!deletingCustomer) return;
    setDeleting(true);
    startTransition(async () => {
      await deleteCustomerAction(deletingCustomer.id);
      setDeleting(false);
      setDeletingCustomer(null);
      router.refresh();
    });
  }

  return (
    <>
      {/* Desktop/tablet: real table. */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>First seen</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <a href={`tel:${c.phone}`} className="font-mono text-brand hover:underline">{c.phone}</a>
                </TableCell>
                <TableCell>{formatDate(c.created_at)}</TableCell>
                <TableCell className="text-right"><CustomerMenu customer={c} onDeleteClick={() => setDeletingCustomer(c)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: same data, stacked cards. */}
      <div className="space-y-2.5 md:hidden">
        {customers.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-4">
            <div>
              <div className="text-[14px] font-semibold text-ink">{c.name}</div>
              <a href={`tel:${c.phone}`} className="mt-0.5 block font-mono text-[12.5px] text-brand hover:underline">{c.phone}</a>
              <div className="mt-0.5 text-[11.5px] text-text-faint">{formatDate(c.created_at)}</div>
            </div>
            <CustomerMenu customer={c} onDeleteClick={() => setDeletingCustomer(c)} />
          </Card>
        ))}
      </div>

      <Dialog open={deletingCustomer !== null} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <DialogContent>
          <DialogTitle className="font-display text-[17px] font-semibold text-ink">Delete {deletingCustomer?.name}?</DialogTitle>
          <DialogDescription className="mt-2 text-[13px] text-text-muted">
            This permanently removes this customer record. This cannot be undone.
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting…" : "Yes, delete permanently"}</Button>
            <Button variant="outline" onClick={() => setDeletingCustomer(null)} disabled={deleting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
