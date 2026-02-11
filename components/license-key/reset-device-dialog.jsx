'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function ResetDeviceDialog({
  onReset,
  isOpen,
  onIsOpenChange,
  onResetDataChange,
  resetData,
}) {
  function handleReset() {
    onIsOpenChange(false);
    onResetDataChange(null);
    const toastId = toast.loading('Resetting device...');
    onReset({ resetData, toastId });
  }

  function handleOpenChange() {
    onIsOpenChange(false);
    onResetDataChange(null);
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
          <DialogTitle className="text-xl">Reset Device</DialogTitle>
          <DialogDescription className="text-base my-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            This action will reset the device bound to the license key for <b>{resetData?.email}</b> under the app <b>{resetData?.appName}</b>, allowing the customer to activate it on a new device.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            variant="destructive"
            className="h-auto text-base w-full px-3 py-1.5 bg-orange-500 dark:bg-orange-600/90 hover:bg-orange-500/90 hover:dark:bg-orange-600/80 focus-visible:ring-orange-400/50"
            onClick={handleReset}
          >
            Yes, reset device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
