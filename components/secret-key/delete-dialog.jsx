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
  setIsOpenDeleteDialog,
  deleteData,
  setDeleteData,
}) {
  const [appName, setAppName] = useState('');

  const targetAppName = deleteData?.appName;
  const isDeleteConfirmed = appName === targetAppName;

  function handleDelete() {
    if (appName !== deleteData.appName) return false;

    setIsOpenDeleteDialog(false);
    setDeleteData(null);
    setAppName('');
    const toastId = toast.loading('Deleting secret key...');
    onDelete({ deleteData, toastId });
  }

  function handleOpenChange() {
    setIsOpenDeleteDialog(false);
    setDeleteData(null);
    setAppName('');
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
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">Secret key for app <b>{targetAppName}</b> will be permanently deleted. To confirm, type the app name in the field below.</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="App name..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          onChange={(e) => setAppName(e.target.value)}
          value={appName}
        />
        <DialogFooter className="relative">
          <Button
            variant="destructive"
            className={`w-full h-auto text-base px-3 py-1.5 dark:bg-destructive dark:hover:bg-destructive/90 text-primary-foreground`}
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
