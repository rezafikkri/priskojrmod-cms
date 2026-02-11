'use client';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionStatus } from '@/constants/enums';

export default function RefundConfirmDialog({
  onRefund,
  isOpen,
  onIsOpenChange,
  onRefundDataChange,
  refundData,
}) {
  let description = `Transaction <b>${refundData?.transactionCode}</b>, owned by customer <b>${refundData?.email}</b>, will have its status changed <b>from Paid to Refund</b>. However, the customer account`;

  if (!refundData?.customerId) {
    description += ' has been <b>deleted</b>.';
  } else {
    description += ' is currently <b>banned</b>.';
  }

  function handleContinue() {
    onIsOpenChange(false);
    onRefundDataChange(null);
    onRefund(refundData.id, TransactionStatus.REFUND);
  }

  function handleOpenChange() {
    onIsOpenChange(false);
    onRefundDataChange(null);
  }

  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Customer Account Unavailable</DialogTitle>
          <DialogDescription
            className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold"
            dangerouslySetInnerHTML={{ __html: description }}
          />  
          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-medium">
            Please apply strict verification and write a clear refund note.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-orange-500 dark:bg-orange-600/90 hover:bg-orange-500/90 hover:dark:bg-orange-600/80 focus-visible:ring-orange-400/50"
            onClick={handleContinue}
          > 
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
