'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '../ui/input';

export default function EditRevokeStatusDialog({
  onEditRevokeStatus,
  onContinue,
  isOpen,
  onIsOpenChange,
  editRevokeStatusData,
}) {
  const [email, setEmail] = useState('');
  const [appName, setAppName] = useState('');

  const isRevoked = editRevokeStatusData?.isRevoked;
  const targetEmail = editRevokeStatusData?.email;
  const targetAppName = editRevokeStatusData?.appName;
  const isEditRevokeStatusConfirmed = isRevoked || (email === targetEmail && appName === targetAppName);

  // editRevokeStatusData is not reset to null on close, mainly because resetting it
  // alongside setIsOpen(false) gets batched into the same rerender, and the dialog's
  // exit animation keeps it mounted with that null data for a moment, causing a
  // visible layout flash.

  function handleContinue() {
    if (!isRevoked && (email !== targetEmail || appName !== targetAppName)) return false;

    onIsOpenChange(false);
    setEmail('');
    setAppName('');

    if (isRevoked) {
      onEditRevokeStatus({
        id: editRevokeStatusData.id,
        isRevoked,
      });
    } else {
      onContinue(); // open revoke form dialog
    }
  }

  function handleOpenChange() {
    onIsOpenChange(false);

    setEmail('');
    setAppName('');
  }

  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  let title;
  let descriptionP1;
  let descriptionP2;
  if (isRevoked) {
    title = 'Unrevoke License Key';
    descriptionP1 = `License key owned by customer <b>${editRevokeStatusData?.name}</b> <span class="break-all">(${targetEmail})</span> for app <b>${targetAppName}</b> will be <b>unrevoked</b>. As a result, this license key can be used again to activate and access the application.`;
  } else {
    title = 'Revoke License Key';
    descriptionP1 = `License key owned by customer <b>${editRevokeStatusData?.name}</b> <span class="break-all">(${targetEmail})</span> for app <b>${targetAppName}</b> will be <b>revoked</b>.`;
    descriptionP2 = '<b>Make sure this is based on a valid reason</b> — once revoked, this license key can no longer be used to access the application, and an incorrect revoke could harm the customer regarding their license key\'s expired at.';
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription
            className="text-base my-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold" 
            dangerouslySetInnerHTML={{ __html: descriptionP1 }}
          />
          {!isRevoked && (
            <>
              <DialogDescription
                className="text-base mb-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold"
                dangerouslySetInnerHTML={{ __html: descriptionP2 }}
              />
              <DialogDescription className="text-base text-zinc-700 dark:text-zinc-300">
                To confirm, type the email and app name in the fields below.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {!isRevoked && (
          <>
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
          </>
        )}

        <DialogFooter className="relative">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-amber-530 hover:bg-amber-530/90 focus-visible:ring-amber-530/50"
            onClick={handleContinue}
            disabled={!isEditRevokeStatusConfirmed}
          > 
            {isRevoked ? 'Yes, unrevoke' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
