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
import { TransactionStatus } from '@/constants/enums';

export default function CorrectStatusDialog({
  onCorrect,
  isOpen,
  onClose,
  correctData,
}) {
  const [transactionCode, setTransactionCode] = useState('');
  const [email, setEmail] = useState('');

  const targetTransactionCode = correctData?.transactionCode;
  const targetEmail = correctData?.email;

  const isTransactionCodeMatch = transactionCode === targetTransactionCode;
  const isEmailMatch = email === targetEmail;
  const isCorrectStatusConfirmed = isTransactionCodeMatch && isEmailMatch;

  const correctStatusMap = {
    [TransactionStatus.CANCELLED]: TransactionStatus.PAID,
    [TransactionStatus.PAID]: TransactionStatus.CANCELLED,
    [TransactionStatus.REFUND]: TransactionStatus.PAID,
  };

  const currentStatus = correctData?.currentStatus;
  const newStatus = correctStatusMap[currentStatus];

  let correctionNotice = 'Ensure you understand the impact before proceeding.';

  switch (currentStatus) {
    case TransactionStatus.REFUND:
      correctionNotice = 'This action will permanently delete <b>Refund Note</b> and <b>Refunded At</b>. Only use this if the current refund status was incorrect.';
      break;

    case TransactionStatus.PAID:
      correctionNotice = 'This action will permanently delete <b>Paid At</b>. Only use this if the current paid status was incorrect. If payment was made, refund the transaction instead.';
  }

  function handleCorrect() {
    if (transactionCode !== correctData.transactionCode) return false;

    onClose();
    setTransactionCode('');
    setEmail('');
    correctData.newStatus = newStatus;
    onCorrect(correctData);
  }

  function handleOpenChange() {
    onClose();
    setTransactionCode('');
    setEmail('');
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
          <DialogDescription className="mt-1.5 text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            Transaction <b>{targetTransactionCode}</b>, owned by customer <b>{correctData?.name}</b> ({targetEmail}), will be corrected <b>from <span className="capitalize">{currentStatus}</span> to <span className="capitalize">{newStatus}</span></b>.
          </DialogDescription>

          <DialogDescription
            className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold"
            dangerouslySetInnerHTML={{ __html: correctionNotice }}
          />

          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300">
            To confirm, type the transaction code and email in the fields below.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Transaction code..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          onChange={(e) => setTransactionCode(e.target.value)}
          value={transactionCode}
        />
        <Input
          placeholder="Email..."
          className="mb-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <DialogFooter className="relative">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-amber-530 hover:bg-amber-530/90 focus-visible:ring-amber-530/50"
            onClick={handleCorrect}
            disabled={!isCorrectStatusConfirmed}
          >
            Yes, correct
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
