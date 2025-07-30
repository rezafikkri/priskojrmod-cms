'use client';

import DataTable from './data-table';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import TooltipWrapper from '../ui/tooltip-wrapper';
import FiltersPopover from './filters-popover';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { safeFetch } from '@/lib/safe-fetch';
import TableSekeleton from '../loadings/table-skeleton';
import { ArrowDownToLine } from 'lucide-react';
import { Trash } from 'lucide-react';

export default function FeedbacksTable() {
  // filters state
  const [filters, setFilters] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // determine show table skeleton or not in normal mode
  const shouldShowSkeletonLoading = useRef(true);

  // read state
  const [updatingReadStatusIds, setUpdatingReadStatusIds] = useState([]);

  // table state
  const [rowSelection, setRowSelection] = useState({});

  // This `useRef` is here to **always keep the newest `filtersRef` and more state value**.
  // We need it because our async function (sent to the child) might "remember"
  // an old `searchedCustomer` and more state value, which is called a "stale closure" problem.
  const filtersRef = useRef(filters);
  const updatingBanStatusIdsRef = useRef(updatingReadStatusIds);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // add readStatus filters
  function addFiltersToURL(url, appliedFilters) {
    if (!appliedFilters) return url;

    let newUrl = url;
    if (appliedFilters.rs !== 'all') {
      newUrl += `?rs=${appliedFilters.rs}`;
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
      return [];
      let toastId;
      if (!shouldShowSkeletonLoading.current) {
        toastId = toast.loading('Loading feedbacks...');
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
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 3,
  });

  // set isFilterActive when apply and clear
  function syncIsFilterActive(appliedFilters) {
    if (appliedFilters.readStatus && !isFilterActive) {
      setIsFilterActive(true);
    }
  }

  function handleFilter(newFilters) {
    // set filters for trigger refetch in normal mode
    setFilters(newFilters);
    syncIsFilterActive(newFilters);
  }

  return (
    <>
      <div className="flex gap-6 items-start mb-4">
        <TooltipWrapper text="Pull new feedback from Google Form">
          <Button variant="outline" className="md:w-auto h-auto text-base px-3 py-1.5 inline-block">
            <ArrowDownToLine className="icon" /> Pull New Data
          </Button>
        </TooltipWrapper>

        <FiltersPopover
          onFilter={handleFilter}
          isFilterActive={isFilterActive}
          disabled={isFetchingF}
        />

        <TooltipWrapper text="Delete feedbacks" background="bg-destructive">
          <Button
            variant="outline"
            className="md:w-auto h-auto text-base px-3 py-1.5 inline-block hover:text-destructive dark:hover:text-red-500/90"
            disabled={isFetchingF || Object.keys(rowSelection).length <= 0}
          >
            <Trash className="icon" />
          </Button>
        </TooltipWrapper>
      </div>

      {shouldShowSkeletonLoading.current && isFetchingF ? (
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
          }}
          tableHandler={{
            onRowSelectionChange: setRowSelection,
          }}
        />
      )}
    </>
  );
}
