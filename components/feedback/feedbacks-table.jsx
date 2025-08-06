'use client';

import DataTable from './data-table';
import { useState, useRef, useEffect, useCallback } from 'react';
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
import TableSekeleton from '../loadings/table-skeleton';
import { ArrowDownToLine, AlertCircle, Columns } from 'lucide-react';
import { Trash } from 'lucide-react';
import { editFeedbackReadStatus, loadFeedbacks, removeFeedbacks } from '@/actions/feedback-actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

export default function FeedbacksTable() {
  const queryClient = useQueryClient();

  // determine show table skeleton or not in
  const shouldShowSkeletonLoading = useRef(true);

  // pull new data state
  const [isPulling, setIsPulling] = useState(false);
  const [lastPullTime, setLastPullTime] = useState(null);
  useEffect(() => {
    const prevLastPullTime = localStorage.getItem('lastPullTime');
    if (prevLastPullTime) {
      setLastPullTime(prevLastPullTime);
    }
  }, []);

  // table state
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({
    created_at: true,
  });

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

  // Tracks the in-flight deletion and pull toast so it can be updated.
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
      if (!shouldShowSkeletonLoading.current) {
        const activeToastId = deletionToastIdRef.current ?? pullFeedbacksToastIdRef.current;

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
          if (toastId) {
            toast.dismiss(toastId);
          }
        },
      });
      return results.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
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

      toast.info(`Please wait until ${hour}:${minute} to pull new feedback.`);
      return;
    }

    // not show table skeleton loading
    shouldShowSkeletonLoading.current = false;

    // show loading and disabled button
    const toastId = toast.loading('Pulling new feedbacks...');
    setIsPulling(true);

    const loadRes = await loadFeedbacks();

    if (loadRes.status === 'success') {
      // set or update last pull time
      const currentLastPullTime = new Date().toISOString();
      localStorage.setItem('lastPullTime', currentLastPullTime);
      setLastPullTime(currentLastPullTime);

      if (loadRes.data.count > 0) {
        // note the toast id, for updated in queryFn useQuery
        pullFeedbacksToastIdRef.current = toastId;

        await queryClient.invalidateQueries({ queryKey: ['feedbacks'] });

        // reset row selection
        setRowSelection({});

        toast.success(`New feedback pulled successfully for ${loadRes.data.count} entries.`);
      } else {
        // hide loading, in success not need to hide, because already hide when refetch in queryFn useQuery
        toast.dismiss(toastId);
        toast.info('No new feedback was pulled. They may have already been retrieved.');
      }
    } else {
      toast.dismiss(toastId);
      toast.error(loadRes.message);
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
          `Successfully deleted ${removeRes.data.count} feedback entr${removeRes.data.count > 1 ? 'ies' : 'y'}.`
        );
      } else {
        toast.info('No feedback entries were deleted. They may have already been removed.');
      }
    } else {
      // hide loading, in success not need to hide, because already hide when refetch in queryFn useQuery
      toast.dismiss(toastId);
      toast.error(removeRes.message);
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

    let removedSnaphost = { filters };

    // optimistic update feedback
    if (filters?.readStatus === 'unread') {
      // remove item from ui
      queryClient.setQueryData(
        ['feedbacks', filters],
        (oldData) => {
          if (!oldData) return oldData;

          return oldData.filter((feedback, index) => {
            if (feedback.id == id) {
              removedSnaphost = {
                ...removedSnaphost,
                item: feedback,
                index,
              };
              return false;
            }
            return true;
          });
        },
      );

      // if id exist in rowSelection then remove
      setRowSelection(prev => {
        if (!id in prev) return prev;
        const { [id]:_, ...next } = prev;
        return next;
      });
    } else {
      // just change the is_read status = true
      queryClient.setQueryData(
        ['feedbacks', filters],
        (oldData) => {
          if (!oldData) return oldData;

          return oldData.map((feedback) => ({
            ...feedback,
            is_read: feedback.id === id ? true : feedback.is_read,
          }));
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

            return [
              ...oldData.slice(0, removedSnaphost.index),
              removedSnaphost.item,
              ...oldData.slice(removedSnaphost.index),
            ];
          },
        );
      } else {
        // change back is_read = false
        queryClient.setQueryData(
          ['feedbacks', removedSnaphost.filters],
          (oldData) => {
            if (!oldData) return oldData;

            return oldData.map((feedback) => ({
              ...feedback,
              is_read: feedback.id === id ? false : feedback.is_read,
            }));
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
      if (JSON.stringify(removedSnaphost.filters) !== JSON.stringify(filtersRef.current)) {
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

            return oldData.filter((feedback) => feedback.id !== id);
          },
        );

        // if id exist in rowSelection then remove
        setRowSelection(prev => {
          if (!id in prev) return prev;
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

            return oldData.map((feedback) => ({
              ...feedback,
              is_read: feedback.id === id ? true : feedback.is_read,
            }));
          },
        );
      }

      if (filtersRef.current?.readStatus !== 'read') {
        queryClient.invalidateQueries({ queryKey: ['feedbacks'], refetchType: 'none' });
      }

      toast.success('Feedback marked as read successfully.', { id: toastId });
    } else {
      toast.error(editRes.message, { id: toastId });
    }

    if (
      markingAsReadIdsRef.current.length === 0 &&
      shouldInvalidateAfterMarkAsReadRef.current
    ) {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      shouldInvalidateAfterMarkAsReadRef.current = false;
    }
  }, []);

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
            <ArrowDownToLine className="icon" /> Pull New Data
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

          <DropdownMenu>
            <TooltipWrapper text="Manage columns">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-base px-3 py-1.5 h-auto inline-block">
                  <Columns className="icon" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipWrapper>
            <DropdownMenuContent align="end" className="min-w-50" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuLabel className="text-muted-foreground text-[15px]">Columns</DropdownMenuLabel>
              {Object.entries(columnVisibility).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column[0]}
                  className="capitalize text-base hover:cursor-pointer"
                  checked={column[1]}
                  onCheckedChange={(value) =>
                    setColumnVisibility({
                      ...columnVisibility,
                      [column[0]]: value,
                    })}
                >
                  {column[0].replace('_', ' ')}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {(shouldShowSkeletonLoading.current && isFetchingF) ? (
        <TableSekeleton />
      ) : isErrorF ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorF.message}</AlertTitle>
        </Alert>
      ) : (
        <DataTable
          feedbacks={dataF}
          tableState={{
            rowSelection,
            columnVisibility,
            filters,
            markingAsReadIds,
          }}
          tableHandler={{
            onRowSelectionChange: setRowSelection,
            onColumnVisibilityChange: setColumnVisibility,
            onEditReadStatus: handleEditReadStatus,
            onMarkAsRead: handleMarkAsRead,
          }}
        />
      )}
    </>
  );
}
