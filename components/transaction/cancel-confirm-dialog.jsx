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
  onClose,
  cancelData,
}) {
  function handleCancel() {
    onClose();
    onCancel({ id: cancelData.id, status: TransactionStatus.CANCELLED });
  }

  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Cancel Transaction</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">  
            Transaction <b>{cancelData?.transactionCode}</b>, owned by customer <b>{cancelData?.email}</b>, will be changed <b>from <span className="capitalize">{TransactionStatus.PENDING}</span> to <span className="capitalize">{TransactionStatus.CANCELLED}</span></b>.
          </DialogDescription>

          <div>
            <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300">
              Only proceed if: 
            </DialogDescription>
            <ul className="list-disc list-inside mb-1.5 text-base text-zinc-700 dark:text-zinc-300">
              <li>Payment was NOT received</li>
              <li>Customer explicitly requested cancellation</li>
              <li>There is a clear and valid reason for cancellation</li>
            </ul>
          </div>
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-amber-530 hover:bg-amber-530/90 focus-visible:ring-amber-530/50"
            onClick={handleCancel}
          > 
            Yes, cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
