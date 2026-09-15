'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Minus } from 'lucide-react';

export default function MessageDialog({
  isOpen,
  detailData,
  onClose,
}) {
  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg overflow-y-auto max-h-full"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Feedback Message</DialogTitle>

          <div className="space-x-1 mt-1.5 mb-1 text-sm text-zinc-600 dark:text-zinc-400">
            {detailData?.name && detailData?.email ? (
              <>
                <span>{detailData.name}</span>
                <span className="break-all">
                  ({detailData.email})
                </span>
              </>
            ) : detailData?.name || detailData?.email ? (
              <span>{detailData?.name ?? detailData?.email}</span>
            ) : (
              <Minus className="size-4 text-zinc-300" />
            )}
          </div>

          <DialogDescription className="text-base text-zinc-800 dark:text-zinc-300">
            {detailData?.message}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

