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

export default function DeleteDialog({
  onDelete,
  isOpen,
  onIsOpenChange,
  onDeleteDataChange,
  deleteData,
}) {
  const [email, setEmail] = useState('');

  function handleDelete() {
    if (email !== deleteData.email) return false;

    onIsOpenChange(false);
    onDeleteDataChange(null);
    setEmail('');
    const toastId = toast.loading(`Deleting License Key for ${deleteData.email}...`);
    onDelete({ deleteData, toastId });
  }

  let checkEmail = false;
  if (email === deleteData?.email) checkEmail = true;
  const emailToDelete = deleteData?.email ? deleteData?.email : email;

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
          <DialogTitle className="text-xl">Are you absolutely sure?</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-medium">The License Key for <b>{emailToDelete}</b> will be permanently deleted. To confirm, type "<b>{emailToDelete}</b>" in the box below.</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Email..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          aria-invalid={true}
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <DialogFooter className="relative">
          <Button
            variant="destructive"
            className={`w-full h-auto text-base px-3 py-1.5 dark:bg-destructive dark:hover:bg-destructive/90 text-primary-foreground`}
            onClick={handleDelete}
            disabled={!checkEmail}
          > 
            Yes, delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
