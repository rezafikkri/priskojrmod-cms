'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/format-date';

export default function RefundDeadlineDialog({
  isOpen,
  onClose,
  refundDeadlineData,
}) {
  const paidAt = refundDeadlineData?.paidAt;
  const refundDeadline = paidAt + (60 * 60 * 24 * 7);

  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:min-w-lg"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader className="text-left min-w-0">
          <DialogTitle className="text-xl">Refund Deadline</DialogTitle>
          
          <Table
            className="w-full text-base mt-1.5 text-zinc-700 dark:text-zinc-300 -mx-2 [&_b]:font-semibold"
          >
            <TableBody>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="font-normal">Transaction Code</TableHead>
                <TableCell>{refundDeadlineData?.transactionCode}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="font-normal">Customer</TableHead>
                <TableCell
                  className="whitespace-normal"
                >
                  {refundDeadlineData?.name} <span className="break-all">({refundDeadlineData?.email})</span>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="font-normal">Paid At</TableHead>
                <TableCell>
                  {formatDateTime(paidAt)}
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">
                  Refund Deadline
                </TableHead>
                <TableCell>
                  <b>{formatDateTime(refundDeadline)}</b>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <DialogDescription className="mt-1.5 text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-medium">
            Customer refund requests must be received (email timestamp) by this deadline to be valid.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
