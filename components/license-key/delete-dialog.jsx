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
  const [appName, setAppName] = useState('');

  function handleDelete() {
    if (email !== deleteData.email || appName !== deleteData.appName) return false;

    onIsOpenChange(false);
    onDeleteDataChange(null);
    setEmail('');
    setAppName('');
    const toastId = toast.loading(`Deleting license key...`);
    onDelete({ deleteData, toastId });
  }

  const isEmailConfirmed = email === deleteData?.email;
  const isAppConfirmed = appName === deleteData?.appName;
  const emailToDelete = deleteData?.email ? deleteData.email : email;
  const appNameToDelete = deleteData?.appName ? deleteData.appName : appName;

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
          <DialogTitle className="text-xl">Are you absolutely sure?</DialogTitle>
          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-medium">
            The license key for <b>{emailToDelete}</b> under app <b>{appNameToDelete}</b> will be permanently deleted.
          </DialogDescription>
          <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-medium">
            To confirm, type the email <b>{emailToDelete}</b> and app name <b>{appNameToDelete}</b> in the fields below.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Email..."
          className="mt-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          aria-invalid={true}
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <Input
          placeholder="App name..."
          className="mb-1.5 md:text-base h-auto px-3 py-1.5 shadow-none"
          aria-invalid={true}
          onChange={(e) => setAppName(e.target.value)}
          value={appName}
        />

        <DialogFooter className="relative">
          <Button
            variant="destructive"
            className={`w-full h-auto text-base px-3 py-1.5 dark:bg-destructive dark:hover:bg-destructive/90 text-primary-foreground`}
            onClick={handleDelete}
            disabled={!isEmailConfirmed || !isAppConfirmed}
          > 
            Yes, delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
