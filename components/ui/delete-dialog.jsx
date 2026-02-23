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

export default function DeleteDialog({
  onDelete,
  isOpen,
  onClose,
  description,
}) {
  function handleDelete() {
    onClose();
    onDelete();
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
          <DialogTitle className="text-xl">Are you absolutely sure?</DialogTitle>

          <DialogDescription
            className="text-base my-1.5 text-zinc-700 dark:text-zinc-300 [&_b]:font-semibold"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </DialogHeader>

        <DialogFooter className="relative">
          <Button
            variant="destructive"
            className="w-full h-auto text-base px-3 py-1.5 dark:bg-destructive dark:hover:bg-destructive/90 text-primary-foreground"
            onClick={handleDelete}
          >
            Yes, delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

