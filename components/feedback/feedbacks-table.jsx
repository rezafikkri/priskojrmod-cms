'use client';

import DataTable from './data-table';
import { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { safeFetch } from '@/lib/safe-fetch';
import {
  ArrowDownToLine,
  AlertCircle,
  MoreHorizontal,
  Minus,
  RotateCw,
} from 'lucide-react';
import { Trash } from 'lucide-react';
import { editFeedbackReadStatus, loadFeedbacks, removeFeedbacks } from '@/actions/feedback-actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { localStorageGet, localStorageSet } from '@/lib/local-storage';
import { Checkbox } from '../ui/checkbox';
import { formatDateTime, FormatTime } from '@/lib/format-date';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import TableColumnVisibility from '../ui/table-column-visibility';
import TableSelectionAlert from '../ui/table-selection-alert';
import TablePagination from '../ui/table-pagination';
import DetailDialog from './detail-dialog';
import TablePaginationSkeleton from '../loadings/table-pagination-skeleton';
import { cmsConfig } from '@/config/cms';
import DeleteDialog from '../ui/delete-dialog';
import { useDialog } from '@/hooks/use-dialog';
import { getUnixTimestamp } from '@/lib/utils';

const defaultColumnVisibility = {
  createdAt: true,
};

export default function FeedbacksTable() {
  const queryClient = useQueryClient();

  // determine show table skeleton or not in
  const shouldShowSkeletonLoading = useRef(true);

  // pull new data state
  const [isPulling, setIsPulling] = useState(false);
  const [lastPulledAt, setLastPulledAt] = useState(() =>
    localStorageGet('lastPulledAt', true) ?? null
  );

  // table state
  const [rowSelection, setRowSelection] = useState({});
  const columnVisibilityStorageKey = 'feedbacks:column-visibility';
  const [columnVisibility, setColumnVisibility] = useState(() => 
    localStorageGet(columnVisibilityStorageKey) ?? defaultColumnVisibility,
  );

  // dialog state
  const {
    data: detailData,
    isOpen: isOpenDetailDialog,
    open: openDetailDialog,
    close: closeDetailDialog,
  } = useDialog();

  const {
    data: deleteData,
    isOpen: isOpenDeleteDialog,
    open: openDeleteDialog,
    close: closeDeleteDialog,
  } = useDialog();

  // filters state
  const [filters, setFilters] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // mark as read status state
  const [markingAsReadIds, setMarkingAsReadIds] = useState([]);
  
  // Prevents duplicate read status updates
  // from handleEditReadStatus (optimistic) and handleMarkAsRead (user-triggered)
  const updatingReadStatusIdsRef = useRef([]);
  const markingAsReadIdsRef = useRef(markingAsReadIds);

  // isDeleting state
  const [isDeleting, setIsDeleting] = useState(false);

  // Used to persist toast ID for deletion and pullFeedbacks action,
  // allowing us to update the loading toast instead of showing a new one.
  const deletionToastIdRef = useRef(null);
  const pullFeedbacksToastIdRef = useRef(null);

  // add readStatus filters
  function addFiltersToURL(url, appliedFilters) {
    if (!appliedFilters) return url;

    let newUrl = url;
    if (appliedFilters.readStatus !== 'all') {
      newUrl += `?rs=${appliedFilters.readStatus}`;
    }
    return newUrl;
  }

  const {
    data: dataF,
    isFetching: isFetchingF,
    isError: isErrorF,
    error: errorF,
  } = useQuery({
    queryKey: ['feedbacks', filters],
    queryFn: async () => {
      let toastId;
      const activeToastId = deletionToastIdRef.current ?? pullFeedbacksToastIdRef.current;

      if (!shouldShowSkeletonLoading.current) {
        if (activeToastId) {
          toastId = toast.loading('Refreshing feedback...', { id: activeToastId });

          if (deletionToastIdRef.current) {
            deletionToastIdRef.current = null;
          } else {
            pullFeedbacksToastIdRef.current = null;
          }
        } else {
          toastId = toast.loading('Loading feedback...');
        }
      }

      const results = await safeFetch({
        url: addFiltersToURL(`/api/feedbacks`, filters),
        onFinally: () => {
          if (toastId && !activeToastId) {
            toast.dismiss(toastId);
          }
        },
      });
      return results.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 3,
  });

  function handleRefresh() {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;
    queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
  }

  // set isFilterActive when apply and clear
  function syncIsFilterActive(appliedFilters) {
    if (appliedFilters) {
      setIsFilterActive(true);
    } else {
      setIsFilterActive(false);
    }
  }

  function handleFilter(newFilters) {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    // reset row selection
    setRowSelection({});
    
    // set filters for trigger refetch
    setFilters(newFilters);
    syncIsFilterActive(newFilters);
  }

  async function handlePullFeedbacks() {
    if (lastPulledAt) {
      // only each 1 hour can pull again
      const nextPullAllowedAt = lastPulledAt + (60 * 60);
      if (getUnixTimestamp() < nextPullAllowedAt) {
        const reminder = nextPullAllowedAt % 60;
        const roundedForDisplay = reminder === 0 ? nextPullAllowedAt : nextPullAllowedAt + (60 - reminder);

        toast.info(`Please wait until ${FormatTime(roundedForDisplay)} to pull new feedback`);
        return;
      }
    }

    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    // show loading and disabled button
    const toastId = toast.loading('Pulling new feedbacks...');
    setIsPulling(true);

    const loadRes = await loadFeedbacks();

    if (loadRes.status === 'success') {
      if (loadRes.data.count > 0) {
        // set or update last pull time
        const currentTime = getUnixTimestamp();
        localStorageSet('lastPulledAt', currentTime, true);
        setLastPulledAt(currentTime);

        // note the toast id, for updated in queryFn useQuery
        pullFeedbacksToastIdRef.current = toastId;

        await queryClient.invalidateQueries({ queryKey: ['feedbacks'] });

        // reset row selection
        setRowSelection({});

        toast.success(
          `New feedback pulled successfully for ${loadRes.data.count} entries`,
          { id: toastId },
        );
      } else {
        // hide loading, in success not need to hide, because already hide when refetch in queryFn useQuery
        toast.info('No new feedback was pulled. They may have already been retrieved.', { id: toastId });
      }
    } else {
      toast.error(loadRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // enabled button
    setIsPulling(false);
  }

  async function handleDelete({ selectedId }) {
    // check selected row <= 0
    const ids = Object.keys(selectedId);
    if (ids.length <= 0) return false;

    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    // show loading and disabled button
    const toastId = toast.loading('Deleting feedback...');
    setIsDeleting(true);

    const removeRes = await removeFeedbacks(ids);

    if (removeRes.status === 'success') {
      // note the toast id, for updated in queryFn useQuery
      deletionToastIdRef.current = toastId;

      await queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      
      // reset row selection
      setRowSelection({});

      if (removeRes.data.count > 0) {
        toast.success(
          `Successfully deleted ${removeRes.data.count} feedback entr${removeRes.data.count > 1 ? 'ies' : 'y'}`,
          { id: toastId },
        );
      } else {
        toast.info('No feedback entries were deleted. They may have already been removed.', {
          id: toastId,
        });
      }
    } else {
      // hide loading, in success not need to hide, because already hide when refetch in queryFn useQuery
      toast.error(removeRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    // enabled button
    setIsDeleting(false);
  }

  async function handleEditReadStatus(id, isRead) {
    if (
      isRead ||
      updatingReadStatusIdsRef.current.includes(id) ||
      markingAsReadIdsRef.current.includes(id)
    ) return false;

    // Note the id to state to prevent double process
    updatingReadStatusIdsRef.current = [ ...updatingReadStatusIdsRef.current, id ];

    // Per-invocation snapshot object for this edit action.
    // Captures the current `filters` state (intentional stale closure)
    // and any optimistic-removed item data for safe concurrent rollback
    // and conditional query invalidation.
    let removedSnaphost = { filters };

    // optimistic update feedback
    if (filters?.readStatus === 'unread') {
      // remove item from ui
      queryClient.setQueryData(
        ['feedbacks', filters],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            items: oldData.items.filter((feedback, index) => {
              if (feedback.id == id) {
                removedSnaphost = {
                  ...removedSnaphost,
                  item: feedback,
                  index,
                };
                return false;
              }
              return true;
            }),
          };
        },
      );

      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!(id in prev)) return prev;
        const { [id]:_, ...next } = prev;
        return next;
      });
    } else {
      // just change the isRead status = true
      queryClient.setQueryData(
        ['feedbacks', filters],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            items: oldData.items.map((feedback) => ({
              ...feedback,
              isRead: feedback.id === id ? true : feedback.isRead,
            })),
          };
        },
      );
    }

    const editRes = await editFeedbackReadStatus(id, true);

    if (editRes.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'], refetchType: 'none' });
    } else {
      // if readStatus filters = unread and removedSnaphost item is exist
      if (removedSnaphost.filters?.readStatus === 'unread' && removedSnaphost.item) {
        // add back data to ui
        queryClient.setQueryData(
          ['feedbacks', removedSnaphost.filters],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              items: [
                ...oldData.items.slice(0, removedSnaphost.index),
                removedSnaphost.item,
                ...oldData.items.slice(removedSnaphost.index),
              ],
            };
          },
        );
      } else {
        // change back isRead = false
        queryClient.setQueryData(
          ['feedbacks', removedSnaphost.filters],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              items: oldData.items.map((feedback) => ({
                ...feedback,
                isRead: feedback.id === id ? false : feedback.isRead,
              })),
            };
          },
        );
      }
    }

    // remove id from updatingReadStatusIdsRef.current
    updatingReadStatusIdsRef.current = updatingReadStatusIdsRef.current
      .filter(updatingId => updatingId !== id);
  }

  const handleMarkAsRead = useCallback(async (id) => {
    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    // This is for add opacity-50 style to updated row
    setMarkingAsReadIds((prev) => {
      const newIds = [...prev, id];
      markingAsReadIdsRef.current = newIds;
      return newIds;
    });
    const toastId = toast.loading('Marking feedback as read...');

    const editRes = await editFeedbackReadStatus(id, true);

    setMarkingAsReadIds((prev) => {
      const newIds = prev.filter(prevId => prevId !== id);
      markingAsReadIdsRef.current = newIds;
      return newIds;
    });

    if (editRes.status === 'success') {
      if (filters?.readStatus === 'unread') {
        queryClient.setQueryData(
          ['feedbacks', filters],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              items: oldData.items.filter((feedback) => feedback.id !== id),
            };
          },
        );

        // if id exist in rowSelection then remove
        setRowSelection(prev => {
          if (!(id in prev)) return prev;
          const { [id]:_, ...next } = prev;
          return next;
        });
      } else {
        queryClient.setQueryData(
          ['feedbacks', filters],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              items: oldData.items.map((feedback) => ({
                ...feedback,
                isRead: feedback.id === id ? true : feedback.isRead,
              })),
            };
          },
        );
      }

      queryClient.invalidateQueries({ queryKey: ['feedbacks'], refetchType: 'none' });
      toast.success('Feedback marked as read successfully.', { id: toastId });
    } else {
      toast.error(editRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }
  }, [filters]);

  // TABLE definition
  const columns = useMemo(() => [
    {
      id: 'select',
      enableSorting: false,
      header: ({ table }) => (
        <div className="flex items-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="shadow-none bg-background"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="shadow-none bg-background"
          />
        </div>
      ),
    },
    {
      accessorKey: 'userInfo',
      header: 'User Info',
      enableHiding: false,
      cell: ({ row }) => 
        row.getValue('userInfo') ?? <Minus className="size-4 text-zinc-300" />,
    },
    {
      accessorKey: 'message',
      header: 'Message',
      enableHiding: false,
      cell: ({ row }) => 
        row.getValue('message').length > 50
          ? `${row.getValue('message').substring(0, 50).trimEnd()}...`
          : row.getValue('message')
    },
    {
      accessorKey: 'createdAt',
      header: () => 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`size-8 p-0 focus-visible:ring-ring ${row.original.isRead ? 'invisible' : ''}`}
              disabled={markingAsReadIds.includes(row.original.id)}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-50">
            <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
            <DropdownMenuItem
              className="w-full text-base"
              asChild
            >
              <button onClick={() => handleMarkAsRead(row.original.id)}>
                Mark as read
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [markingAsReadIds, handleMarkAsRead]);
  const table = useReactTable({
    data: dataF?.items,
    columns,
    state: {
      rowSelection,
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.id,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <>
      <div className="flex gap-6 items-start mb-4 flex-wrap">
        <TooltipWrapper text="Pull new feedback from Google Form">
          <Button
            variant="outline"
            className="h-auto text-base px-3 py-1.5 inline-block"
            onClick={handlePullFeedbacks}
            disabled={isFetchingF || isPulling}
          >
            <ArrowDownToLine className="icon" /> Pull new data
          </Button>
        </TooltipWrapper>

        <div className="flex gap-3 items-start justify-between flex-1">
          <div className="flex gap-3 items-start">
            <TooltipWrapper text="Refresh">
              <Button
                variant="outline"
                className="text-base px-3 py-1.5 h-auto inline-block"
                disabled={isFetchingF}
                onClick={handleRefresh}
              >
                <RotateCw className="icon" />
              </Button>
            </TooltipWrapper>

            <FiltersPopover
              onFilter={handleFilter}
              isFilterActive={isFilterActive}
              disabled={isFetchingF || isPulling}
            />

            <TooltipWrapper text="Delete feedback" background="bg-destructive">
              <Button
                variant="outline"
                className="h-auto text-base px-3 py-1.5 inline-block hover:text-destructive dark:hover:text-red-500/90"
                disabled={isFetchingF
                  || Object.keys(rowSelection).length <= 0
                  || isPulling
                  || isDeleting}
                onClick={() => openDeleteDialog({
                  selectedId: rowSelection,
                })}
              >
                <Trash className="icon" />
              </Button>
            </TooltipWrapper>
          </div>

          <TableColumnVisibility
            table={table}
            defaultColumnVisibility={defaultColumnVisibility}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            storageKey={columnVisibilityStorageKey}
          />
        </div>
      </div>

      {(shouldShowSkeletonLoading.current && isFetchingF) ? (
        <TablePaginationSkeleton showPagination={false} />
      ) : isErrorF ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorF.message}</AlertTitle>
        </Alert>
      ) : (
        <>
          <TableSelectionAlert table={table} />
          <DataTable
            table={table}
            onOpenDetailDialog={openDetailDialog}
            processingIds={markingAsReadIds} 
            onEditReadStatus={handleEditReadStatus}
          />
          <TablePagination
            data={dataF}
            showNavigation={false}
          />
        </>
      )}

      <DetailDialog
        isOpen={isOpenDetailDialog}
        detailData={detailData}
        onClose={closeDetailDialog}
      />

      <DeleteDialog
        onDelete={() => handleDelete(deleteData)}
        isOpen={isOpenDeleteDialog}
        onClose={closeDeleteDialog}
        title="Delete Feedback"
        description={`Feedback (${Object.keys(rowSelection).length}) will be permanently deleted.`}
      />
    </>
  );
}
