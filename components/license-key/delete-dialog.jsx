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
  const [appName, setAppName] = useState('');

  const targetEmail = deleteData?.email;
  const targetAppName = deleteData?.appName;
  const isDeleteConfirmed = email === targetEmail && appName === targetAppName;

  function handleDelete() {
    if (email !== targetEmail || appName !== targetAppName) return false;

    onIsOpenChange(false);
    onDeleteDataChange(null);
    setEmail('');
    setAppName('');
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
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Delete License Key</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            License key owned by customer <b>{targetEmail}</b> for app <b>{targetAppName}</b> will be permanently deleted.
          </DialogDescription>
          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300">
            To confirm, type the email and app name in the fields below.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Email..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <Input
          placeholder="App name..."
          className="mb-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          onChange={(e) => setAppName(e.target.value)}
          value={appName}
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
