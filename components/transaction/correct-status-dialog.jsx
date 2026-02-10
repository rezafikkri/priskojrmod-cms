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
import { TransactionStatus } from '@/constants/enums';

export default function CorrectStatusDialog({
  onCorrect,
  isOpen,
  onIsOpenChange,
  correctData,
  onCorrectDataChange,
}) {
  const [transactionCode, setTransactionCode] = useState('');

  let checkTransactionCode = false;
  if (transactionCode === correctData?.transactionCode) checkTransactionCode = true;
  const correctTarget = correctData?.transactionCode ? correctData?.transactionCode : transactionCode;

  const correctStatusMap = {
    [TransactionStatus.CANCELLED]: TransactionStatus.PAID,
    [TransactionStatus.PAID]: TransactionStatus.CANCELLED,
    [TransactionStatus.REFUND]: TransactionStatus.PAID,
  };

  const currentStatus = correctData?.currentStatus;
  const newStatus = correctStatusMap[currentStatus];

  function handleCorrect() {
    if (transactionCode !== correctData.transactionCode) return false;

    onIsOpenChange(false);
    onCorrectDataChange(null);
    setTransactionCode('');
    const toastId = toast.loading(`Correcting status to ${newStatus}...`);
    correctData.newStatus = newStatus;
    onCorrect({ correctData, toastId });
  }

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
            This action is meant to correct a previously incorrect transaction status. Please ensure you fully understand the impact of this correction before proceeding.
          </DialogDescription>
          
          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            Transaction <b>{correctTarget}</b> will be corrected <b>from <span className="capitalize">{currentStatus}</span> to <span className="capitalize">{newStatus}</span></b>.
          </DialogDescription>

          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-medium">
            To confirm, type the transaction code "<b>{correctTarget}</b>" in the box below.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Transaction code..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none border-orange-500 focus-visible:border-orange-500 focus-visible:ring-orange-500/50"
          onChange={(e) => setTransactionCode(e.target.value)}
          value={transactionCode}
        />

        <DialogFooter className="relative">
          <Button
            variant="destructive"
            className="h-auto text-base w-full px-3 py-1.5 bg-orange-500 dark:bg-orange-600/90 hover:bg-orange-500/90 hover:dark:bg-orange-600/80 focus-visible:ring-orange-400/50"
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
