'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/format-date';

export default function DetailDialog({
  isOpen,
  onIsOpenChange,
  detailData,
  onDetailDataChange
}) {
  function handleOpenChange() {
    onIsOpenChange(false);
    onDetailDataChange(null);
  }

  function handleClickOutside(e) {
    if (e.target && e.target.closest('.toaster.group')) {
      e.preventDefault();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg overflow-y-auto max-h-full"
        onInteractOutside={handleClickOutside}
      >
        <DialogHeader>
          <DialogTitle className="font-semibold text-zinc-800 dark:text-zinc-200 text-lg leading-3">
            {detailData?.name ?? '-'}
          </DialogTitle>
          <div className="text-sm mb-3 text-zinc-700 dark:text-zinc-300/90">
            {detailData?.email ?? '-'}
          </div>

          <p className="mb-5 text-base text-zinc-950 dark:text-foreground leading-7">
            {detailData?.message}
          </p>

          <time className="text-[13px] text-zinc-500 leading-3">
            Created {formatDateTime(detailData?.created_at)}
          </time>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

