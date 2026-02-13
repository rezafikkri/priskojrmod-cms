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

export default function CancelConfirmDialog({
  onCancel,
  isOpen,
  onIsOpenChange,
  onCancelDataChange,
  cancelData,
}) {
  function handleCancel() {
    onIsOpenChange(false);
    onCancelDataChange(null);
    onCancel(cancelData.id, TransactionStatus.CANCELLED);
  }

  function handleOpenChange() {
    onIsOpenChange(false);
    onCancelDataChange(null);
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
          <DialogTitle className="text-xl">Cancel Transaction</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">  
            Transaction <b>{cancelData?.transactionCode}</b>, owned by customer <b>{cancelData?.email}</b>, will be changed <b>from <span className="capitalize">{TransactionStatus.PENDING}</span> to <span className="capitalize">{TransactionStatus.CANCELLED}</span></b>.
          </DialogDescription>
          <DialogDescription className="mb-1.5 text-base text-zinc-700 dark:text-zinc-300">
            Only proceed if:
            <ul className="list-disc list-inside">
              <li>Payment was NOT received</li>
              <li>Customer explicitly requested cancellation</li>
              <li>There is a clear and valid reason for cancellation</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-orange-500 dark:bg-orange-600/90 hover:bg-orange-500/90 hover:dark:bg-orange-600/80 focus-visible:ring-orange-400/50"
            onClick={handleCancel}
          > 
            Yes, cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
