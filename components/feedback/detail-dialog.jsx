'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/format-date';
import { Minus } from 'lucide-react';

export default function DetailDialog({
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
          {detailData?.name && detailData?.email ? (
            <>
              <DialogTitle className="font-semibold text-zinc-800 dark:text-zinc-200 text-lg leading-3">
                {detailData.name}
              </DialogTitle>
              <div className="text-sm text-zinc-700 dark:text-zinc-300/90">
                {detailData.email}
              </div>
            </>
          ) : detailData?.name || detailData?.email ? (
            <DialogTitle className="font-semibold text-zinc-800 dark:text-zinc-200 text-lg leading-3">
              {detailData.name ?? detailData.email}
            </DialogTitle>
          ) : (
            <DialogTitle>
              <Minus className="size-4 text-zinc-300" />
            </DialogTitle>
          )}

          <p className="mb-5 mt-3 text-base text-zinc-950 dark:text-foreground leading-7">
            {detailData?.message}
          </p>

          <time className="text-[13px] text-zinc-500 leading-3">
            Created {formatDateTime(detailData?.createdAt)}
          </time>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

