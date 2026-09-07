'use client';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EditRevokeStatusDialog({
  onEditRevokeStatus,
  isOpen,
  onClose,
  editRevokeStatusData,
}) {
  function handleEditRevokeStatus() {
    onClose();
    onEditRevokeStatus(editRevokeStatusData);
  }

  let title;
  let descriptionP1;
  let descriptionP2;
  if (editRevokeStatusData?.isRevoked) {
    title = 'Unrevoke License Key';
    descriptionP1 = `License key owned by customer <b>${editRevokeStatusData?.name}</b> <span class="break-all">(${editRevokeStatusData?.email})</span> for app <b>${editRevokeStatusData?.appName}</b> will be <b>unrevoked</b>. As a result, this license key can be used again to activate and access the application.`;
  } else {
    title = 'Revoke License Key';
    descriptionP1 = `License key owned by customer <b>${editRevokeStatusData?.name}</b> <span class="break-all">(${editRevokeStatusData?.email})</span> for app <b>${editRevokeStatusData?.appName}</b> will be <b>revoked</b>.`;
    descriptionP2 = 'As a result, this license key can no longer be used to activate or access the application. <b>Make sure this is based on a valid reason</b>, as an incorrect revoke could harm the customer regarding their license key\'s expired at.';
  }

  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription
            className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold" 
            dangerouslySetInnerHTML={{ __html: descriptionP1 }}
          />
          {descriptionP2 && (
            <DialogDescription
              className="text-base text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold"
              dangerouslySetInnerHTML={{ __html: descriptionP2 }}
            />
          )}
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-amber-530 hover:bg-amber-530/90 focus-visible:ring-amber-530/50"
            onClick={handleEditRevokeStatus}
          > 
            Yes, {editRevokeStatusData?.isRevoked ? 'unrevoke' : 'revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
