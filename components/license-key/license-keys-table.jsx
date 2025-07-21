'use client';

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { generatePageInfo, isLastPage } from '@/lib/utils';
import { AlertCircle, Search, X } from 'lucide-react';
import DataTable from './data-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import TablePaginationSekeleton from '../loadings/table-pagination-skeleton';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { removeLicenseKey, setCanRegenerateKeys } from '@/actions/license-key-actions';
import { toast } from 'sonner';
import { searchKeySchema } from '@/lib/validators/base-validator';
import { Input } from '../ui/input';
import FiltersPopover from './filters-popover';
import { Button } from '../ui/button';
import { Columns } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import TooltipWrapper from '../ui/tooltip-wrapper';
import { safeFetch } from '@/lib/safe-fetch';

export default function LicenseKeysTable() {
  const queryClient = useQueryClient();

  // seearc state
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLicenseKey, setSearchedLicenseKey] = useState(null);
  const searchRef = useRef(null);

  // filters state
  const [filters, setFilters] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // table state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({
    regenerated_at: false,
    created_at: false,
    updated_at: false,
  });

  // deleting ids and ban/unban state
  const [deletingIds, setDeletingIds] = useState([]);

  // Ensures that in normal mode and not on the last page,
  // invalidateQueries is still triggered even if not all deletions or banning succeed.
  const hasSuccessfulDeleteRef = useRef(false);

  // This `useRef` is here to **always keep the newest `searchedLicenseKey and more state` value**.
  // We need it because our async function (sent to the child) might "remember"
  // an old `searchedLicenseKey and more state` value, which is called a "stale closure" problem.
  const searchedLicenseKeyRef = useRef(searchedLicenseKey);
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const deletingIdsRef = useRef(deletingIds);

  useEffect(() => {
    searchedLicenseKeyRef.current = searchedLicenseKey;
    filtersRef.current = filters;
    paginationRef.current = pagination;
  }, [searchedLicenseKey, filters, pagination]);

  // set can regenerate state
  const [isRegenerating, setIsRegenerating] = useState(false);

  // add secretKeyId and canRegenerate filters
  function addFiltersToURL(url, appliedFilters) {
    if (!appliedFilters) return url;

    let newUrl = url;
    if (appliedFilters.secretKeyId !== 'all') {
      newUrl += `&ski=${appliedFilters.secretKeyId}`;
    }
    if (appliedFilters.canRegenerate !== 'all') {
      newUrl += `&cr=${appliedFilters.canRegenerate}`;
    }
    return newUrl;
  }

  const {
    data: dataLK,
    isFetching: isFetchingLK,
    status: statusLK,
    isError: isErrorLK,
    error: errorLK,
    isPlaceholderData: isPlaceholderDataLK,
  } = useQuery({
    queryKey: ['licenseKeys', pagination.pageIndex, filters],
    queryFn: async () => {
      let toastId;
      if (statusLK !== 'pending') {
        toastId = toast.loading('Loading license keys...');
      }

      const results = await safeFetch({
        url: addFiltersToURL(`/api/license-keys?pi=${pagination.pageIndex}`, filters),
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
    enabled: !searchedLicenseKey,
  });

  async function handleSearch(appliedFilters) {
    const keyResult = searchKeySchema.safeParse(searchRef.current.value);
    if (!keyResult.success) return false;
    const parsedKey = keyResult.data;
    
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['licenseKeysSearch', parsedKey, appliedFilters],
        queryFn: async () => {
          setIsSearching(true);
          // if previoesly searchedLicenseKey is null, then show skeleton loading
          // for all table, besides that, then show toast loading only
          let toastId;
          if (searchedLicenseKey) {
            toastId = toast.loading('Searching license keys...');
          }

          return await safeFetch({
            url: addFiltersToURL(`/api/license-keys?sk=${parsedKey}`, appliedFilters),
            onFinally: () => {
              if (toastId) {
                toast.dismiss(toastId);
              }

              setIsSearching(false);
            },
            errorMessage: 'Something went wrong while searching. Please try again.',
          });
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 5,
      });

      setSearchedLicenseKey(result.data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleEnterSearch(e) {
    if (e.key === 'Enter') {
      handleSearch(filters);
    }
  }

  function handleClearSearchInput() {
    setPagination({
      ...pagination,
      pageIndex: 0,
    });
    setSearchedLicenseKey(null);
    searchRef.current.value = '';
  }

  async function handleDelete({ deleteData, toastId }) {
    // This is for add opacity-50 style to deleted row
    setDeletingIds((prev) => {
      const newIds = [...prev, deleteData.id];
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const removeRes = await removeLicenseKey(deleteData.id);

    setDeletingIds((prev) => {
      const newIds = prev.filter(id => id !== deleteData.id);
      deletingIdsRef.current = newIds;
      return newIds;
    });

    const licenseKey = queryClient.getQueryData([
      'licenseKeys',
      paginationRef.current.pageIndex,
      filtersRef.current,
    ]);

    if (removeRes.status === 'success') {
      if (searchedLicenseKeyRef.current) {
        setSearchedLicenseKey((prevLicenseKey) => ({
          ...prevLicenseKey,
          licenseKeys: prevLicenseKey.licenseKeys.filter(slk => slk.id !== deleteData.id),
        }));

        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      } else {
        const newLicenseKeys = licenseKey.licenseKeys.filter(lk => lk.id !== deleteData.id);
        const newRowCount = licenseKey.rowCount - 1;

        if (!isLastPage({
          pageIndex: paginationRef.current.pageIndex,
          pageSize: paginationRef.current.pageSize,
          rowCount: licenseKey.rowCount,
        })) {
          queryClient.setQueryData(
            ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
            { licenseKeys: newLicenseKeys, rowCount: newRowCount },
          );

          if (!hasSuccessfulDeleteRef.current) {
            hasSuccessfulDeleteRef.current = true;
          }
        } else {
          if (newLicenseKeys.length === 0 && newRowCount > 0) {
            queryClient.removeQueries({
              queryKey: ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
              exact: true,
            });

            queryClient.setQueryData(
              ['licenseKeys', paginationRef.current.pageIndex - 1, filtersRef.current],
              (oldData) => ({ ...oldData, rowCount: newRowCount }),
            );

            setPagination((pagination) => ({
              ...pagination,
              pageIndex: pagination.pageIndex - 1,
            }));
          } else {
            queryClient.setQueryData(
              ['licenseKeys', paginationRef.current.pageIndex, filtersRef.current],
              { licenseKeys: newLicenseKeys, rowCount: newRowCount },
            );
          }

          queryClient.invalidateQueries({ queryKey: ['licenseKeys'], refetchType: 'none' });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      toast.success(`License key deleted successfully.`, { id: toastId });
    } else {
      toast.error(removeRes.message, { id: toastId });
    }

    // For still invalidateQueries licenseKeys, when not in last page, last delete item fails, and 
    // at least one delete succeeded.
    if (
      !searchedLicenseKeyRef.current &&
      deletingIdsRef.current.length === 0 &&
      hasSuccessfulDeleteRef.current
    ) {
      if (!isLastPage({
        pageIndex: paginationRef.current.pageIndex,
        pageSize: paginationRef.current.pageSize,
        rowCount: licenseKey.rowCount,
      })) {
        queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      }

      hasSuccessfulDeleteRef.current = false;
    }
  }

  // set isFilterActive when apply and clear
  function syncIsFilterActive(appliedFilters) {
    if (appliedFilters && !isFilterActive) {
      setIsFilterActive(true);
    } else if (!appliedFilters && isFilterActive) {
      setIsFilterActive(false);
    }
  }

  async function handleFilter({
    action,
    newFilters,
  }) {
    if (action === 'apply') {
      if (searchedLicenseKey) {
        handleSearch(newFilters);
      }

      // set filters in the future
      setFilters(newFilters);
    } else {
      if (searchedLicenseKey) {
        handleSearch(null);
      }

      // set filters untuk request kedepannya
      setFilters(null);
    }

    syncIsFilterActive(newFilters);
  }

  async function handleSetCanRegenerate() {
    const rowSelections = Object.keys(rowSelection);
    if (rowSelections.length <= 0) return false;

    setIsRegenerating(true);
    // show loading
    const toastId = toast.loading('Enabling Regeneration...');

    // not use try/catch because in actions already using try/catch
    const setCanRegenerateRes = await setCanRegenerateKeys(rowSelections);
    if (setCanRegenerateRes.status === 'success') {
      await queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      await queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      setRowSelection({});

      if (setCanRegenerateRes.data.count > 0) {
        toast.success(`Regeneration enabled successfully for ${setCanRegenerateRes.data.count} license keys.`, {
          id: toastId,
        });
      } else {
        toast.info('No license keys were updated. They may have already been deleted.', {
          id: toastId,
        });
      }
    } else {
      toast.error(setCanRegenerateRes.message, {
        id: toastId,
      });
    }

    setIsRegenerating(false);
  }

  let licenseKey;
  if (searchedLicenseKey) {
    licenseKey = searchedLicenseKey;
  } else if (dataLK) {
    licenseKey = dataLK;
  }

  // generate pageInfo like this: 1-10 of 20
  const pageInfo = useMemo(() => {
    return generatePageInfo({
      pageIndex: pagination.pageIndex,
      totalData: licenseKey?.rowCount,
      totalDataPerPage: licenseKey?.licenseKeys?.length,
      searchKey: searchRef?.current?.value,
      isTooMany: licenseKey?.isTooMany,
    });
  }, [licenseKey]);

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 items-start mb-4">
        <div className="flex space-x-6">
          <TooltipWrapper text="Create license key">
            <Button asChild variant="outline" className="md:w-auto h-auto text-base px-3 py-1.5 inline-block">
              <Link href="/license-key/new"><Plus className="icon" /> Create</Link>
            </Button>
          </TooltipWrapper>

          <div className="flex space-x-3">
            <FiltersPopover
              onFilter={handleFilter}
              isFilterActive={isFilterActive}
              disabled={isFetchingLK || isSearching}
            />
            <Button
              variant="outline"
              className="text-base px-3 py-1.5 h-auto"
              disabled={isFetchingLK
                || isSearching
                || Object.keys(rowSelection).length <= 0
                || isRegenerating}
              onClick={handleSetCanRegenerate}
            >Set Can Regenerate</Button>
          </div>
        </div>
        <div className="flex space-x-3 max-lg:w-full w-2/5">
          <div className="flex shadow-xs rounded-md flex-1">
            <div className="relative flex items-center -me-[1px] z-1 flex-1">
              <Input
                placeholder="Search with email..."
                className="rounded-e-none shadow-none md:text-base h-auto px-3 py-1.5 pe-9"
                disabled={isFetchingLK || isSearching}
                ref={searchRef}
                onKeyUp={handleEnterSearch}
                autoComplete="off"
              />
              {searchedLicenseKey ? (
                <TooltipWrapper text="Clear search input">
                  <Button
                    className="absolute right-2 w-4 h-5 p-0 z-1"
                    variant="ghost"
                    onClick={handleClearSearchInput}
                    disabled={isFetchingLK || isSearching}
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipWrapper>
              ) : null}
            </div>
            <Button
              variant="secondary"
              className="border shadow-none rounded-s-none h-auto text-base px-3 py-1.5 focus:z-2"
              disabled={isFetchingLK || isSearching}
              onClick={() => handleSearch(filters)}
            >
              <Search />
            </Button>
          </div>

          <DropdownMenu>
            <TooltipWrapper text="Manage columns">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-3 py-1.5 h-auto">
                  <Columns />
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

      {statusLK === 'pending' || (isSearching && !searchedLicenseKey) ? (
        <TablePaginationSekeleton pagination={!isSearching} />
      ) : isErrorLK ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorLK.message}</AlertTitle>
        </Alert>
      ) : (
        <DataTable
          licenseKey={licenseKey}
          pageInfo={pageInfo}
          tableState={{
            pagination,
            rowSelection,
            columnVisibility,
            deletingIds,
          }}
          tableHandler={{ 
            onPaginationChange: setPagination,
            onRowSelectionChange: setRowSelection,
            onColumnVisibilityChange: setColumnVisibility,
            onDelete: handleDelete,
          }}
          isPlaceholderData={isPlaceholderDataLK}
          hasSearched={!!searchedLicenseKey}
        />
      )}

      <small className="mt-5 inline-block text-muted-foreground text-sm"><b>Note</b>: <i>Activate</i> indicates that the license key has been used to activate the application, while <i>Download</i> indicates that the license key has been used to download something associated with the application. For example, the Sider Manager app has a Default Addon; this means <i>Download</i> indicates the license key has been used to download this Default Addon.</small>
    </>
  );
}
