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

export default function BanDialog({
  onBan,
  isOpen,
  onClose,
  banData,
}) {
  function handleBan() {
    onClose();
    onBan(banData);
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
        <DialogHeader>
          <DialogTitle className="text-xl">Ban Customer</DialogTitle>

          <DialogDescription className="text-base mt-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold">
            Customer <b className="break-all">{banData?.email}</b> will be banned.
          </DialogDescription>

          <DialogDescription className="text-base my-1.5 text-zinc-700 dark:text-zinc-300">
            This customer will no longer be able to log in or access any features, including the use of any license key.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="relative block">
          <Button
            className="h-auto text-base w-full px-3 py-1.5 bg-amber-530 hover:bg-amber-530/90 focus-visible:ring-amber-530/50"
            onClick={handleBan}
          >
            Yes, ban
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
