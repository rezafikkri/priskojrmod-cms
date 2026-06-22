'use client';

import DataTable from './data-table';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/safe-fetch';
import {
  ArrowDownToLine,
  Minus,
  RotateCw,
  Trash,
} from 'lucide-react';
import { editFeedbackReadStatus, loadFeedbacks, removeFeedbacks } from '@/actions/feedback-actions';
import {
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { localStorageGet, localStorageSet } from '@/lib/local-storage';
import { Checkbox } from '../ui/checkbox';
import { formatDateTime, formatTime } from '@/lib/format-date';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import TableColumnVisibility from '../ui/table-column-visibility';
import TableSelectionAlert from '../ui/table-selection-alert';
import DetailDialog from './detail-dialog';
import { cmsConfig } from '@/config/cms';
import DeleteDialog from '../ui/delete-dialog';
import { useDialog } from '@/hooks/use-dialog';
import { getUnixTimestamp } from '@/lib/utils';
import { useCheckQueryStale } from '@/hooks/use-check-query-stale';
import { deepEqual } from 'fast-equals';
import TableErrorAlert from '../ui/table-error-alert';
import { useStableTopLoader } from '@/hooks/use-stable-top-loader';
import TableActionDropdown from '../ui/table-action-dropdown';
import TableSkeleton from '../loadings/table-skeleton';
import TableResultCount from '../ui/table-result-count';
import TableTwoLineCell from '../ui/table-two-line-cell';

const defaultColumnVisibility = {
  createdAt: true,
};
const STALE_TIME = 1000 * 20;

export default function FeedbacksTable() {
  const queryClient = useQueryClient();
  const isQueryStale = useCheckQueryStale();
  const { start: startProgress, done: doneProgress } = useStableTopLoader();

  // pull new data state
  const [isPulling, setIsPulling] = useState(false);
  const [lastPulledAt, setLastPulledAt] = useState(() =>
    localStorageGet('lastPulledAt') ?? null
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

  // filters and fetch action state
  const [filters, setFilters] = useState(null);
  // Tracks user-triggered refetches.
  // Controls progress bar visibility and disables related UI buttons while fetching.
  // 'refresh' | 'filter' | 'bulk-refresh' (triggered after a successful bulk action) | null
  const [fetchAction, setFetchAction] = useState(null);
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
  function addParamsToURL(url, { filters }) {
    if (!filters) return url;

    let newUrl = url;
    if (filters.readStatus && filters.readStatus !== 'all') {
      newUrl += `?rs=${filters.readStatus}`;
    }
    return newUrl;
  }

  const {
    data: dataF,
    isPending: isPendingF,
    isRefetching: isRefetchingF,
    isError: isErrorF,
    error: errorF,
  } = useQuery({
    queryKey: ['feedbacks', filters],
    queryFn: async ({ signal }) => {
      const results = await safeFetch({
        url: addParamsToURL('/api/feedbacks', { filters }),
        signal,
      });
      return results?.data;
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  });

  // manage toast loading
  useEffect(() => {
    if (isRefetchingF) {
      const activeActionToastId = deletionToastIdRef.current ?? pullFeedbacksToastIdRef.current;

      if (fetchAction === 'bulk-refresh' && activeActionToastId) {
        toast.loading('Refreshing feedback...', { id: activeActionToastId });
      }

      if (fetchAction !== 'bulk-refresh') {
        startProgress();
      }
    } else if (!isRefetchingF) {
      doneProgress();

      // reset fetchAction
      setFetchAction(null);
    }
  }, [isRefetchingF, fetchAction, startProgress, doneProgress]);

  function handleRefresh() {
    setFetchAction('refresh');
    // reset rowSelection
    setRowSelection({});

    queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
  }

  function handleFilter(newFilters) {
    const queryKey = ['feedbacks', newFilters];
    const isStale = isQueryStale(queryKey, STALE_TIME);

    if (isStale) {
      setFetchAction('filter');

      if (deepEqual(filters, newFilters)) {
        queryClient.invalidateQueries({ queryKey, exact: true });
      }
    }
    
    // reset rowSelection
    setRowSelection({});
    // set filters for trigger refetch
    setFilters(newFilters);
  }

  async function handlePullFeedbacks() {
    if (lastPulledAt) {
      // only each 1 hour can pull again
      const nextPullAllowedAt = lastPulledAt + (60 * 60);
      if (getUnixTimestamp() < nextPullAllowedAt) {
        // Round up to the nearest full minute to avoid displaying an incomplete minute.
        const reminder = nextPullAllowedAt % 60;
        const roundedForDisplay = reminder === 0 ? nextPullAllowedAt : nextPullAllowedAt + (60 - reminder);

        toast.info(`Please wait until ${formatTime(roundedForDisplay)} to pull new feedback.`);
        return;
      }
    }

    // show loading and disabled button
    const toastId = toast.loading('Pulling new feedback...');
    setIsPulling(true);

    const loadRes = await loadFeedbacks();

    if (loadRes.status === 'success') {
      if (loadRes.data.count > 0) {
        // set or update last pull time
        const currentTime = getUnixTimestamp();
        localStorageSet('lastPulledAt', currentTime, true);
        setLastPulledAt(currentTime);

        let refreshFailed = false;
        setFetchAction('bulk-refresh');
        // note the toast id, for updated in queryFn useQuery
        pullFeedbacksToastIdRef.current = toastId;

        try {
          await queryClient.invalidateQueries({ queryKey: ['feedbacks'] }, { throwOnError: true });
        } catch (err) {
          refreshFailed = true;
        }

        // reset row selection
        setRowSelection({});
        pullFeedbacksToastIdRef.current = null;

        let successMessage = `New feedback pulled successfully for ${loadRes.data.count} entries.`;
        if (refreshFailed) {
          successMessage += ' Please refresh the table manually.';
        }
        toast.success(successMessage, { id: toastId });
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

    // show loading and disabled button
    const toastId = toast.loading('Deleting feedback...');
    setIsDeleting(true);

    const removeRes = await removeFeedbacks(ids);

    if (removeRes.status === 'success') {
      let refreshFailed = false;

      try {
        if (removeRes.data.count > 0) {
          setFetchAction('bulk-refresh');
          // note the toast id, for updated in queryFn useQuery
          deletionToastIdRef.current = toastId;

          await queryClient.invalidateQueries({ queryKey: ['feedbacks'] }, { throwOnError: true });
        }
      } catch (err) {
        refreshFailed = true;
      }
      
      // reset row selection
      setRowSelection({});

      if (removeRes.data.count > 0) {
        deletionToastIdRef.current = null;

        let successMessage = `Successfully deleted ${removeRes.data.count} feedback entr${removeRes.data.count > 1 ? 'ies' : 'y'}.`;
        if (refreshFailed) {
          successMessage += ' Please refresh the table manually.';
        }
        toast.success(successMessage, { id: toastId });

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

    // Snapshot for this edit action execution.
    // Intentionally captures current `filters` (stale closure)
    // and stores removed item data for safe concurrent rollback.
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
    } else if (removedSnaphost.filters?.readStatus === 'unread' && removedSnaphost.item) {
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

    // remove id from updatingReadStatusIdsRef.current
    updatingReadStatusIdsRef.current = updatingReadStatusIdsRef.current
      .filter(updatingId => updatingId !== id);
  }

  const handleMarkAsRead = useCallback(async (id) => {
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
      accessorKey: 'sender',
      header: 'Sender',
      enableHiding: false,
      cell: ({ row }) => (
        row.original.name && row.original.email ? (
          <TableTwoLineCell
            primary={row.original.name}
            secondary={row.original.email}
            secondaryClassName={!row.original.isRead && 'font-medium'}
          />
        ) : row.original.name || row.original.email ? (
          <span>{row.original.name ?? row.original.email}</span>
        ) : (
          <Minus className="size-4 text-zinc-300" />
        )
      )
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
        <TableActionDropdown
          visible={!row.original.isRead}
          disabled={markingAsReadIds.includes(row.original.id)}
        >
          <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
          <DropdownMenuItem className="w-full text-base" asChild>
            <button onClick={() => handleMarkAsRead(row.original.id)}>
              Mark as read
            </button>
          </DropdownMenuItem>
        </TableActionDropdown>
      ),
    },
  ], [markingAsReadIds, handleMarkAsRead]);

  const defaultData = useMemo(() => [], []);
  const table = useReactTable({
    data: dataF?.items ?? defaultData,
    columns,
    state: {
      rowSelection,
      columnVisibility,
    },
    manualPagination: true,
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
            disabled={isPendingF || isPulling}
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
                disabled={isPendingF || fetchAction === 'refresh'}
                onClick={handleRefresh}
              >
                <RotateCw className="icon" />
              </Button>
            </TooltipWrapper>

            <FiltersPopover
              onFilter={handleFilter}
              filters={filters}
              disabled={isPendingF || fetchAction === 'filter'}
            />

            <TooltipWrapper text="Delete feedback" background="bg-destructive">
              <Button
                variant="outline"
                className="h-auto text-base px-3 py-1.5 inline-block hover:text-destructive dark:hover:text-red-500/90"
                disabled={isPendingF
                  || fetchAction !== null
                  || Object.keys(rowSelection).length <= 0
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

      {isPendingF
        ? <TableSkeleton />
        : (
          <>
            <TableErrorAlert
              isError={isErrorF}
              isRefetching={isRefetchingF}
              message={errorF?.message}
            />
            <TableSelectionAlert table={table} />
            <DataTable
              table={table}
              onOpenDetailDialog={openDetailDialog}
              onEditReadStatus={handleEditReadStatus}
            />
            <TableResultCount data={dataF?.items} />
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
