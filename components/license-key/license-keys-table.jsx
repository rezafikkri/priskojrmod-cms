'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { generatePageInfo, isLastPage } from '@/lib/utils';
import { AlertCircle, Search, X } from 'lucide-react';
import DataTable from './data-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import TablePaginationSekeleton from '../loadings/table-pagination-skeleton';
import UnknownError from '@/lib/errors/UnknownError';
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

export default function LicenseKeysTable() {
  const queryClient = useQueryClient();
  const isRerender = useRef(false);
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
  const isPaginationChangeWhenDelete = useRef(false);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({
    regenerated_at: false,
    created_at: false,
    updated_at: false,
  });
  // set can regenerate state
  const [isRegenerating, setIsRegenerating] = useState(false);

  function handlePaginationChange(paginationData) {
    if (!isRerender.current) {
      isRerender.current = true;
    }
    setPagination(paginationData);
  }

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

  // set isFilterActive when apply and clear
  function syncIsFilterActive(appliedFilters) {
    if (appliedFilters && !isFilterActive) {
      setIsFilterActive(true);
    } else if (!appliedFilters && isFilterActive) {
      setIsFilterActive(false);
    }
  }

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
            toastId = toast.loading('Searching License Keys...');
          }
          const res = await fetch(addFiltersToURL(`/api/license-keys?sk=${parsedKey}`, appliedFilters));
          const resJson = await res.json();

          if (toastId) {
            toast.dismiss(toastId);
          }

          setIsSearching(false);
          return resJson;
        },
        staleTime: 10000,
        gcTime: 10000,
      });

      if (!isRerender.current) {
        isRerender.current = true;
      }
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

  const {
    data: dataLK,
    isFetching: isFetchingLK,
    status: statusLK,
    isError: isErrorLK,
    error: errorLK,
    isPlaceholderData: isPlaceholderDataLK,
    isStale: isStaleLK,
  } = useQuery({
    queryKey: ['licenseKeys', pagination.pageIndex, filters],
    queryFn: async () => {
      let toastId;
      if (isRerender.current) {
        toastId = toast.loading('Loading License Keys...');
      }

      const res = await fetch(addFiltersToURL(`/api/license-keys?pi=${pagination.pageIndex}`, filters));
      const resJson = await res.json();

      if (toastId) {
        toast.dismiss(toastId);
      }
      if (!res.ok) {
        throw new UnknownError('An unexpected error occurred. Please try reloading the page!');
      }

      return resJson;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 3,
    enabled: !searchedLicenseKey,
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ deleteData }) => await removeLicenseKey(deleteData.id),
    onMutate: ({ deleteData }) => {
      const targetRow = document.querySelector(`#row${deleteData.id}`);
      const targetActionBtn = targetRow.querySelector('td > button');
      targetRow.classList.add('opacity-50');
      targetActionBtn.setAttribute('disabled', true);
      return { targetRow, targetActionBtn };
    },
    onSuccess: async (deleteRes, { toastId, deleteData }) => {
      if (!isRerender.current) {
        isRerender.current = true;
      }

      if (deleteRes.status !== 'success') throw new Error(deleteRes.message);

      if (searchedLicenseKey) {
        setSearchedLicenseKey({
          ...searchedLicenseKey,
          licenseKeys: searchedLicenseKey.licenseKeys.filter(slk => slk.id !== deleteData.id),
        });
        await queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
        await queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      } else {
        const licenseKey = queryClient.getQueryData(['licenseKeys', pagination.pageIndex, filters]);
        const newLicenseKeys = licenseKey.data.licenseKeys.filter(lk => lk.id !== deleteData.id);
        const newRowCount = licenseKey.data.rowCount - 1;

        if (!isLastPage({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          rowCount: licenseKey.data.rowCount,
        })) {
          queryClient.setQueryData(['licenseKeys', pagination.pageIndex], (oldData) => {
            return {
              ...oldData,
              data: {
                licenseKeys: newLicenseKeys,
                rowCount: newRowCount,
              },
            };
          });
          await queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
        } else {
          if (newLicenseKeys.length <= 0 && newRowCount > 0) {
            isPaginationChangeWhenDelete.current = true;
            setPagination({
              ...pagination,
              pageIndex: pagination.pageIndex - 1,
            });
          } else {
            queryClient.setQueryData(['licenseKeys', pagination.pageIndex], (oldData) => {
              return {
                ...oldData,
                data: {
                  licenseKeys: newLicenseKeys,
                  rowCount: newRowCount,
                },
              };
            });
          }
        }

        await queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      }

      toast.success(`License Key for ${deleteData.email} was successfully deleted.`, { id: toastId });
    },
    onError: (err, { toastId }) => {
      toast.error(err.message, { id: toastId });
    },
    onSettled: (_d, _e, _v, { targetRow, targetActionBtn }) => {
      targetRow.classList.remove('opacity-50');
      targetActionBtn.removeAttribute('disabled');
    },
  });

  async function handleFilter({
    action,
    newFilters,
  }) {
    if (!isRerender.current) {
      isRerender.current = true;
    }

    if (action === 'apply') {
      if (!searchedLicenseKey) {
        await queryClient.invalidateQueries({
          queryKey: ['licenseKeys', pagination.pageIndex, newFilters],
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ['licenseKeysSearch', searchRef.current.value, newFilters],
        });
        handleSearch(newFilters);
      }

      // set filters in the future
      setFilters(newFilters);
    } else {
      if (!searchedLicenseKey) {
        await queryClient.invalidateQueries({
          queryKey: ['licenseKeys', pagination.pageIndex, null],
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ['licenseKeysSearch', searchRef.current.value, null],
        });
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

    if (!isRerender.current) {
      isRerender.current = true;
    }

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

  // if after delete action, pagination changed
  useEffect(() => {
    if (isPaginationChangeWhenDelete.current && !isStaleLK) {
      queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
    }

    if (isPaginationChangeWhenDelete.current) isPaginationChangeWhenDelete.current = false;
  }, [pagination, isPaginationChangeWhenDelete.current]);

  let licenseKey;
  if (searchedLicenseKey) {
    licenseKey = searchedLicenseKey;
  } else if (dataLK) {
    licenseKey = dataLK.data;
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
                    disabled={isSearching}
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

      {statusLK === 'pending'
        || (isFetchingLK && !isRerender.current)
        || (isSearching && !searchedLicenseKey) ? (
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
          tableState={{ pagination, rowSelection, columnVisibility }}
          tableHandler={{ 
            onPaginationChange: handlePaginationChange,
            onRowSelectionChange: setRowSelection,
            onColumnVisibilityChange: setColumnVisibility,
            onDelete: deleteMutation.mutate,
          }}
          isPlaceholderData={isPlaceholderDataLK}
          hasSearched={!!searchedLicenseKey}
        />
      )}

      <small className="mt-5 inline-block text-muted-foreground text-sm"><b>Note</b>: <i>Activate</i> indicates that the License Key has been used to activate the application, while <i>Download</i> indicates that the License Key has been used to download something associated with the application. For example, the Sider Manager app has a Default Addon; this means <i>Download</i> indicates the License Key has been used to download this Default Addon.</small>
    </>
  );
}
