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
  onContinue,
  isOpen,
  onIsOpenChange,
  onRefundDataChange,
  refundData,
}) {
  let description = `Transaction <b>${refundData?.transactionCode}</b>, owned by customer <b>${refundData?.name}</b> <span class="break-all">(${refundData?.email})</span>, will have its status changed <b>from <span>${TransactionStatus.PAID}</span> to <span>${TransactionStatus.REFUND}</span></b>. However, the customer account`;

  if (!refundData?.customerId) {
    description += ' has been <b>deleted</b>.';
  } else {
    description += ' is currently <b>banned</b>.';
  }

  function handleContinue() {
    onIsOpenChange(false);
    onContinue(true); // open refund form dialog
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
            className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold [&_span]:capitalize"
            dangerouslySetInnerHTML={{ __html: description }}
          />  
          <DialogDescription className="mb-1.5 text-base text-zinc-700 dark:text-zinc-300">
            Please apply strict verification and write a clear refund note.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-amber-530 hover:bg-amber-530/90 focus-visible:ring-amber-530/50"
            onClick={handleContinue}
          > 
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
