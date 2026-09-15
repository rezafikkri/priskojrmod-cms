'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import NotFoundAlert from '../ui/not-found-alert';
import { safeFetch } from '@/lib/safe-fetch';

function RevokeNoteContent({
  isError,
  error,
  note,
}) {
  if (isError) {
    return (
      <Alert variant="destructive" className="mt-1.5 border-destructive/50 text-base items-baseline">
        <AlertCircle />
        <AlertTitle className="line-clamp-0">{error.message}</AlertTitle>
      </Alert>
    );
  }

  if (!note) {
    return (
      <NotFoundAlert
        className="mt-1.5"
        message="License key not found. Please refresh the table."
      />
    );
  }

  return (
    <>
      <div className="mt-1.5 mb-1 text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
        <div className="space-x-1">
          <span>{note.customerName}</span>
          <span className="break-all">
            ({note.customerEmail})
          </span>
        </div>

        <span className="me-1">{note.secretKey.product.name}</span>
        <Badge
          variant="secondary"
          className="p-0 px-1 rounded-sm text-zinc-600 dark:text-zinc-400"
        >
          app name
        </Badge>
      </div>

      <DialogDescription className="text-base text-zinc-800 dark:text-zinc-300">
        {note.revokeNote}
      </DialogDescription>
    </>
  );
}

export default function RevokeNoteDialog({
  isOpen,
  onClose,
  revokeNoteData,
}) {
  const { data: note, isError, error, isFetching } = useQuery({
    queryKey: ['licenseKeyRevokeNote', revokeNoteData?.id],
    queryFn: async ({ signal }) => {
      const results = await safeFetch({
        url: `/api/license-keys/${revokeNoteData?.id}/revoke-note`,
        signal,
      });
      return results?.data;
    },
    staleTime: 1000 * 60 * 5, //1000 * 30,
    enabled: isOpen,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });


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
          <DialogTitle className="text-xl">License Key Revoke Note</DialogTitle>
          
          {isFetching ? (
            <>
              <div className="mt-1.5 mb-1 space-y-1">
                <Skeleton className="w-1/2 flex-auto h-[20px] rounded-sm" />
                <Skeleton className="w-1/3 flex-auto h-[20px] rounded-sm" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="w-full flex-auto h-[24px] rounded-sm" />
                <Skeleton className="w-full flex-auto h-[24px] rounded-sm" />
                <Skeleton className="w-4/5 flex-auto h-[24px] rounded-sm" />
                <Skeleton className="w-2/3 flex-auto h-[24px] rounded-sm" />
              </div>             
            </>
          ) : ( 
            <RevokeNoteContent
              isError={isError}
              error={error}
              note={note}
            />
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
