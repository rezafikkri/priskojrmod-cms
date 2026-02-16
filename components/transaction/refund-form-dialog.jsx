'use client';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionStatus } from '@/constants/enums';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

export default function RefundFormDialog({
  onRefund,
  isOpen,
  onIsOpenChange,
  onRefundDataChange,
  refundData,
}) {
  const [note, setNote] = useState('');

  function handleRefund() {
    onIsOpenChange(false);
    onRefundDataChange(null);
    setNote('');
    onRefund({ id: refundData.id, status: TransactionStatus.REFUND, refundNote: note });
  }

  function handleOpenChange() {
    onIsOpenChange(false);
    onRefundDataChange(null);
    setNote('');
  }

  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Add Refund Note</DialogTitle>
        </DialogHeader>

        <Textarea
          className="mb-1.5 md:text-base h-auto px-3 py-1.5 shadow-none min-h-30"
          placeholder="Note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <DialogFooter className="relative">
          <Button
            variant="secondary"
            className="h-auto text-base w-full px-3 py-1.5"
            onClick={handleRefund}
            disabled={note.trim() === ''}
          > 
            Yes, refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
