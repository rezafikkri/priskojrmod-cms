'use client';

import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function OverrideStatusDialog({
  onOverride,
  isOpen,
  onIsOpenChange,
  overrideData,
  onOverrideDataChange,
}) {
  const [transactionCode, setTransactionCode] = useState('');

  function handleOverride() {
    if (transactionCode !== overrideData.transactionCode) return false;

    onIsOpenChange(false);
    onOverrideDataChange(null);
    setTransactionCode('');
    const toastId = toast.loading('Overriding transaction status...');
    onOverride({ overrideData, toastId });
  }

  let checkTransactionCode = false;
  if (transactionCode === overrideData?.transactionCode) checkTransactionCode = true;
  const overrideTarget = overrideData?.transactionCode ? overrideData?.transactionCode : transactionCode;

  const currentStatus = 'cancelled';
  const newStatus = 'paid';

  function handleOpenChange() {
    onIsOpenChange(false);
    onOverrideDataChange(null);
    setTransactionCode('');
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
        <DialogHeader>
          <DialogTitle className="text-xl">Override Transaction Status</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300">
            This feature is only intended to correct mistakes in changing the transaction status. Make sure you understand the consequences of this change.
          </DialogDescription>
          
          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            The transaction <b>{overrideTarget.transactionCode}</b> will be overridden <b>from <span className="capitalize">{currentStatus}</span> to <span className="capitalize">{newStatus}</span></b>.
          </DialogDescription>

          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-medium">
            To confirm, type the transaction code "<b>{overrideTarget}</b>" in the box below.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Transaction code..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          aria-invalid={true}
          onChange={(e) => setTransactionCode(e.target.value)}
          value={transactionCode}
        />

        <DialogFooter className="relative">
          <Button
            variant="destructive"
            className="w-full h-auto text-base px-3 py-1.5 dark:bg-destructive dark:hover:bg-destructive/90 text-primary-foreground"
            onClick={handleOverride}
            disabled={!checkTransactionCode}
          >
            Yes, override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
