'use client';

import DataTable from './data-table';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { formatDateTime } from '@/lib/format-date';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import TableColumnVisibility from '../ui/table-column-visibility';
import TableSelectionAlert from '../ui/table-selection-alert';
import TablePagination from '../ui/table-pagination';
import DetailDialog from './detail-dialog';
import TablePaginationSkeleton from '../loadings/table-pagination-skeleton';
import { deepEqual } from 'fast-equals';
import { cmsConfig } from '@/config/cms';

const defaultColumnVisibility = {
  createdAt: true,
};

export default function FeedbacksTable() {
  const queryClient = useQueryClient();

  // determine show table skeleton or not in
  const shouldShowSkeletonLoading = useRef(true);

  // pull new data state
  const [isPulling, setIsPulling] = useState(false);
  const [lastPullTime, setLastPullTime] = useState(() =>
    localStorageGet('lastPullTime', true) ?? null
  );

  // table state
  const [rowSelection, setRowSelection] = useState({});
  const columnVisibilityStorageKey = 'feedbacks:column-visibility';
  const [columnVisibility, setColumnVisibility] = useState(() => 
    localStorageGet(columnVisibilityStorageKey) ?? defaultColumnVisibility,
  );

  // detail dialog state
  const [detailData, setDetailData] = useState(null);
  const [isOpenDetailDialog, setIsOpenDetailDialog] = useState(false);

  // filters state
  const [filters, setFilters] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  // This is for prevent double editFeedbackReadStatus process and prevent unnecessary multiple refetches 
  // when running multiple editReadStatus concurrently
  const updatingReadStatusIdsRef = useRef([]);

  // Works in conjunction with `updatingReadStatusIdsRef` to control
  // when a single refetch should occur after a batch update.
  const hasSuccessfulEditReadStatusRef = useRef(false);

  // mark as read status state
  const [markingAsReadIds, setMarkingAsReadIds] = useState([]);
  /**
   * True if markAsRead is pending and filters.readStatus was changed to "read"
   * during that time. Used to decide if a single invalidateQueries should occur
   * and to avoid multiple unnecessary refetches.
   */
  const shouldInvalidateAfterMarkAsReadRef = useRef(false);

  /**
   * This `useRef` is here to **always keep the newest `filtersRef` and more state value**.
   * We need it because our async function (sent to the child) might "remember"
   * an old `searchedCustomer` and more state value, which is called a "stale closure" problem.
   */
  const filtersRef = useRef(filters);
  // This same as filtersRef but, This is too for handleMarkAsRead actions process, that used for ui,
  // like add opacity-50 to targeted row, disable button `mark as read`, and more
  const markingAsReadIdsRef = useRef(markingAsReadIds);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

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
    // check if now - lastPullTime > 1 hour, then pull, otherwise show alert
    const lastPulledAt = new Date(lastPullTime);
    if ((Date.now() - lastPulledAt.getTime()) < 60 * 60 * 1000) {
      const nextPullTime = new Date(lastPulledAt);
      nextPullTime.setHours(
        lastPulledAt.getHours() + 1,
        lastPulledAt.getMinutes() + 1,
      );

      const hour = nextPullTime.getHours().toString().padStart(2, '0');
      const minute = nextPullTime.getMinutes().toString().padStart(2, '0');

      toast.info(`Please wait until ${hour}:${minute} to pull new feedback`);
      return;
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
        const currentLastPullTime = new Date().toISOString();
        localStorageSet('lastPullTime', currentLastPullTime, true);
        setLastPullTime(currentLastPullTime);

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

  async function handleDelete() {
    // check selected row <= 0
    const rowSelections = Object.keys(rowSelection);
    if (rowSelections.length <= 0) return false;

    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    // show loading and disabled button
    const toastId = toast.loading('Deleting feedback...');
    setIsDeleting(true);

    const removeRes = await removeFeedbacks(rowSelections);

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
      hasSuccessfulEditReadStatusRef.current = true;
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

    // For still invalidateQueries feedbacks, when last updating item fails, filters is changed while
    // updating is pending and at least one editReadStatus succeeded.
    if (
      updatingReadStatusIdsRef.current.length === 0 &&
      hasSuccessfulEditReadStatusRef.current
    ) {
      // Only directly trigger refetch when the filters changed while process is still pending
      if (!deepEqual(removedSnaphost.filters, filtersRef.current)) {
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      } else {
        // invalidate all queryKey, but not trigger refetch for current active queryKey
        queryClient.invalidateQueries({ queryKey: ['feedbacks'], refetchType: 'none' });
      }

      hasSuccessfulEditReadStatusRef.current = false;
    }
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
      if (filtersRef.current?.readStatus === 'unread') {
        queryClient.setQueryData(
          ['feedbacks', filtersRef.current],
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
      } else if (filtersRef.current?.readStatus === 'read') {
        shouldInvalidateAfterMarkAsReadRef.current = true;
      } else {
        queryClient.setQueryData(
          ['feedbacks', filtersRef.current],
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

      if (filtersRef.current?.readStatus !== 'read') {
        queryClient.invalidateQueries({ queryKey: ['feedbacks'], refetchType: 'none' });
      }

      toast.success('Feedback marked as read successfully', { id: toastId });
    } else {
      toast.error(editRes.message, {
        id: toastId,
        duration: cmsConfig.toast.duration.error
      });
    }

    if (
      markingAsReadIdsRef.current.length === 0 &&
      shouldInvalidateAfterMarkAsReadRef.current
    ) {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      shouldInvalidateAfterMarkAsReadRef.current = false;
    }
  }, []);

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
      accessorKey: 'user_info',
      header: 'User Info',
      enableHiding: false,
      cell: ({ row }) => 
        row.getValue('user_info') ?? <Minus className="size-4 text-zinc-300" />,
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
  ], [markingAsReadIds]);
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

        <div className="flex space-x-6 items-start justify-between flex-1">
          <div className="flex space-x-6 items-start">
            <FiltersPopover
              onFilter={handleFilter}
              isFilterActive={isFilterActive}
              disabled={isFetchingF || isPulling}
            />

            <TooltipWrapper text="Delete feedbacks" background="bg-destructive">
              <Button
                variant="outline"
                className="h-auto text-base px-3 py-1.5 inline-block hover:text-destructive dark:hover:text-red-500/90"
                disabled={isFetchingF
                  || Object.keys(rowSelection).length <= 0
                  || isPulling
                  || isDeleting}
                onClick={handleDelete}
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
            onDetailDataChange={setDetailData}
            onIsOpenDetailDialogChange={setIsOpenDetailDialog}
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
        onIsOpenChange={setIsOpenDetailDialog}
        detailData={detailData}
        onDetailDataChange={setDetailData}
      />
    </>
  );
}
