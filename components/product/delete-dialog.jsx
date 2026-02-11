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
  isOpenDeleteDialog,
  onIsOpenDeleteDialogChange,
  deleteData,
  onDeleteDataChange,
}) {
  const [name, setName] = useState('');

  const targetName = deleteData?.name;
  const isDeleteConfirmed = name === targetName;

  function handleDelete() {
    if (name !== targetName) return false;

    onIsOpenDeleteDialogChange(false);
    onDeleteDataChange(null);
    setName('');
    const toastId = toast.loading('Deleting product...');
    onDelete({ deleteData, toastId });
  }

  function handleOpenChange() {
    onIsOpenDeleteDialogChange(false);
    onDeleteDataChange(null);
    setName('');
  }

  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  return (
    <Dialog open={isOpenDeleteDialog} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Are you absolutely sure?</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            The product <b>{targetName}</b> will be permanently deleted. To confirm, type the product name "{targetName}" in the box below.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Product name..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          aria-invalid={true}
          onChange={(e) => setName(e.target.value)}
          value={name}
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
