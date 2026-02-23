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

export default function DeleteDialog({
  onDelete,
  isOpen,
  onIsOpenChange,
  onDeleteDataChange,
  deleteData,
}) {
  const [email, setEmail] = useState('');

  const targetEmail = deleteData?.email;
  const isDeleteConfirmed = email === targetEmail;

  function handleDelete() {
    if (email !== targetEmail) return false;

    onIsOpenChange(false);
    onDeleteDataChange(null);
    setEmail('');
    onDelete(deleteData);
  }

  function handleOpenChange() {
    onIsOpenChange(false);
    onDeleteDataChange(null);
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
          <DialogTitle className="text-xl">Delete Customer</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            Customer <b>{targetEmail}</b> will be permanently deleted. 
          </DialogDescription>

          {deleteData?.isBanned && (
            <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
              If this customer has any associated license keys, <b>all of them will also be permanently deleted</b>. Please ensure you have a valid and strong reason before proceeding.
            </DialogDescription>
          )}

          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300">
            To confirm, type the email in the field below.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Email..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <DialogFooter className="relative">
          <Button
            variant="destructive"
            className="w-full h-auto text-base px-3 py-1.5 dark:bg-destructive dark:hover:bg-destructive/90 text-primary-foreground"
            onClick={handleDelete}
            disabled={!isDeleteConfirmed}
          >
            Yes, delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
