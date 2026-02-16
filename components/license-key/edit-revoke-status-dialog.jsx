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
import { toast } from 'sonner';

export default function EditRevokeStatusDialog({
  onEditRevokeStatus,
  isOpen,
  onIsOpenChange,
  onEditRevokeStatusDataChange,
  editRevokeStatusData,
}) {
  function handleEditRevokeStatus() {
    onIsOpenChange(false);
    onEditRevokeStatusDataChange(null);
    const toastId = toast.loading(
      `${editRevokeStatusData.isRevoked ? 'Unrevoking' : 'Revoking'} license key...`,
    );
    onEditRevokeStatus({ editRevokeStatusData, toastId });
  }

  function handleOpenChange() {
    onIsOpenChange(false);
  }

  let title;
  let description;
  if (editRevokeStatusData?.isRevoked) {
    title = 'Unrevoke License Key';
    description = `License key owned by customer <b>${editRevokeStatusData?.email}</b> for app <b>${editRevokeStatusData?.appName}</b> will be <b>unrevoked</b>. As a result, this license key can be used again to activate and access the application.`;
  } else {
    title = 'Revoke License Key';
    description = `License key owned by customer <b>${editRevokeStatusData?.email}</b> for app <b>${editRevokeStatusData?.appName}</b> will be <b>revoked</b>. As a result, this license key can no longer be used to activate or access the application.`;
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
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription
            className="text-base my-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-bold" 
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-orange-500 dark:bg-orange-600/90 hover:bg-orange-500/90 hover:dark:bg-orange-600/80 focus-visible:ring-orange-400/50"
            onClick={handleEditRevokeStatus}
          > 
            Yes, {editRevokeStatusData?.isRevoked ? 'unrevoke' : 'revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
