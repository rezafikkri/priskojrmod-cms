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

export default function CorrectStatusDialog({
  onCorrect,
  isOpen,
  onIsOpenChange,
  correctData,
  onCorrectDataChange,
}) {
  const [transactionCode, setTransactionCode] = useState('');

  function handleCorrect() {
    if (transactionCode !== correctData.transactionCode) return false;

    onIsOpenChange(false);
    onCorrectDataChange(null);
    setTransactionCode('');
    const toastId = toast.loading('Overriding transaction status...');
    onCorrect({ correctData, toastId });
  }

  let checkTransactionCode = false;
  if (transactionCode === correctData?.transactionCode) checkTransactionCode = true;
  const correctTarget = correctData?.transactionCode ? correctData?.transactionCode : transactionCode;

  const currentStatus = 'cancelled';
  const newStatus = 'paid';

  function handleOpenChange() {
    onIsOpenChange(false);
    onCorrectDataChange(null);
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
          <DialogTitle className="text-xl">Correct Transaction Status</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300">
            This action is intended only to fix mistakes in setting the transaction status. Please make sure you understand the impact of this correction.
          </DialogDescription>
          
          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            The transaction <b>{correctTarget}</b> status will be changed <b>from <span className="capitalize">{currentStatus}</span> to <span className="capitalize">{newStatus}</span></b>.
          </DialogDescription>

          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-medium">
            To confirm, type the transaction code "<b>{correctTarget}</b>" in the box below.
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
            onClick={handleCorrect}
            disabled={!checkTransactionCode}
          >
            Yes, correct
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
