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

  let description;
  if (editRevokeStatusData?.isRevoked) {
    description = `The license key for <b>${editRevokeStatusData?.email}</b> under app <b>${editRevokeStatusData?.appName}</b> will be unrevoked. As a result, this license key can be used again to activate and access the application.`;
  } else {
    description = `The license key for <b>${editRevokeStatusData?.email}</b> under app <b>${editRevokeStatusData?.appName}</b> will be revoked. As a result, this license key can no longer be used to activate or access the application.`;
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
          <DialogDescription
            className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-medium" 
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            className={`w-full h-auto text-base px-3 py-1.5 bg-orange-500 hover:bg-orange-500/90 focus-visible:ring-orange-400/50`}
            onClick={handleEditRevokeStatus}
          > 
            Yes, {editRevokeStatusData?.isRevoked ? 'unrevoke' : 'revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
