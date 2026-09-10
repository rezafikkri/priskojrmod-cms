'use client';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

export default function RevokeFormDialog({
  onRevoke,
  isOpen,
  onIsOpenChange,
  revokeData,
}) {
  const [note, setNote] = useState('');

  function handleRevoke() {
    onIsOpenChange(false);
    setNote('');
    onRevoke({ id: revokeData.id, isRevoked: revokeData.isRevoked, revokeNote: note });
  }

  function handleOpenChange() {
    onIsOpenChange(false);
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
          <DialogTitle className="text-xl">Add Revoke Note</DialogTitle>
        </DialogHeader>

        <Textarea
          className="md:text-base h-auto px-3 py-1.5 shadow-none min-h-30"
          placeholder="Note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <DialogFooter className="relative">
          <Button
            variant="secondary"
            className="h-auto text-base w-full px-3 py-1.5"
            onClick={handleRevoke}
            disabled={note.trim() === ''}
          > 
            Yes, revoke
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
