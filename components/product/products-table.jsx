'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Plus,
  AlertCircle,
  MoreHorizontal,
  Check,
  Minus,
} from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { PriceType, CurrencyCode } from '@/constants/enums';
import { editProductPinnedStatus, editProductPublishedStatus, removeProduct } from '@/actions/product-actions';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/safe-fetch';
import Dot from '../icon/Dot';
import { formatDateTime } from '@/lib/format-date';
import { formatCurrency } from '@/lib/format-currency';
import { Badge } from '../ui/badge';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { localStorageGet } from '@/lib/local-storage';
import TablePaginationSkeleton from '../loadings/table-pagination-skeleton';
import TableColumnVisibility from '../ui/table-column-visibility';
import DataTable from '../ui/data-table';
import TablePagination from '../ui/table-pagination';
import DeleteDialog from './delete-dialog';
import { cmsConfig } from '@/config/cms';

const defaultColumnVisibility = {
  category: false,
  is_published: true,
  released_at: true,
  admin: false,
  created_at: false,
  updated_at: false,
};

export default function ProductsTable({
  isOwner,
}) {
  const queryClient = useQueryClient();

  // table state
  const columnVisibilityStorageKey = 'products:column-visibility';
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorageGet(columnVisibilityStorageKey);
    if (saved) {
      if (!isOwner && saved.admin) {
        saved.admin = false;
      }

      return saved;
    }

    return defaultColumnVisibility;
  });

  const [priceCurrency, setPriceCurrency] = useState(process.env.NEXT_PUBLIC_DEFAULT_DATA_CURR);

  // delete dialog state
  const [deleteData, setDeleteData] = useState(null);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const [updatingPinnedStatusIds, setUpdatingPinnedStatusIds] = useState([]);
  const [updatingPublishedIds, setUpdatingPublishedIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  const {
    data: dataP,
    isFetching: isFetchingP,
    isError: isErrorP,
    error: errorP,
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await safeFetch({ url: '/api/products' })).data,
    select: (product) => ({
      items: product.items.map(product => {
        let newProduct = { ...product };

        // mapping prices
        if (newProduct.price_type === PriceType.PAID) {
          const prices = newProduct.variants.flatMap(variant => variant.prices);
          newProduct.prices = prices.reduce((acc, { currency_code, price }) => {
            if (!acc[currency_code]) {
              acc[currency_code] = { min: price, max: price };
            } else {
              if (acc[currency_code].min > price) acc[currency_code].min = price;
              if (acc[currency_code].max < price) acc[currency_code].max = price;
            }
            return acc;
          }, {});
        }
        delete newProduct.variants;

        // mapping released_at
        newProduct.released_at = newProduct.versions[0].released_at;
        delete newProduct.versions;

        return newProduct;
      }),
    }),
    staleTime: 1000 * 20,
    gcTime: 1000 * 60,
  });

  async function handleEditPinnedStatus(id, isPinned) {
    // This is for add opacity-50 style to deleted row
    setUpdatingPinnedStatusIds((prevUpdatingPinnedStatusIds) => [...prevUpdatingPinnedStatusIds, id]);
    // show loading
    const toastId = toast.loading(!isPinned ? 'Pinning product...' : 'Unpinning product...');

    const editRes = await editProductPinnedStatus(id, !isPinned);

    setUpdatingPinnedStatusIds((prevUpdatingPinnedStatusIds) =>
      prevUpdatingPinnedStatusIds.filter((updatingId) => updatingId !== id)
    );

    if (editRes.status === 'success') {
      queryClient.setQueryData(['products'], (oldData) => {
        if (!oldData) return oldData;

        let updatedProduct = { ...oldData.items.find(data => data.id === editRes.data.id) };
        updatedProduct.updated_at = editRes.data.updated_at;
        updatedProduct.is_pinned = !isPinned;

        const targetIndex = oldData.items.findLastIndex(data => data.is_pinned);
        const filteredProducts = oldData.items.filter(data => data.id !== editRes.data.id);

        if (!isPinned) {
          return { items: [updatedProduct, ...filteredProducts] };
        } else {
          filteredProducts.splice(targetIndex, 0, updatedProduct);
          return { items: filteredProducts };
        }
      });

      toast.success(
        !isPinned
          ? 'Product pinned successfully'
          : 'Product unpinned successfully',
        { id: toastId },
      );
    } else {
      toast.error(editRes.message, { id: toastId, duration: cmsConfig.toast.duration.error });
    }
  }

  async function handleEditPublishedStatus(id, isPublished) {
    // This is for add opacity-50 style to deleted row
    setUpdatingPublishedIds((prevUpdatingPublishedIds) => [...prevUpdatingPublishedIds, id]);

    // show loading
    const toastId = toast.loading(!isPublished ? 'Publishing product...' : 'Unpublishing product...');

    const editRes = await editProductPublishedStatus(id, !isPublished);

    setUpdatingPublishedIds((prevUpdatingPublishedIds) =>
      prevUpdatingPublishedIds.filter((updatingId) => updatingId !== id)
    );

    if (editRes.status === 'success') {
      queryClient.setQueryData(['products'], (oldData) => {
        if (!oldData) return oldData;

        let updatedProduct = { ...oldData.items.find(data => data.id === editRes.data.id) };
        updatedProduct.updated_at = editRes.data.updated_at;
        updatedProduct.is_published = !isPublished;

        let targetIndex = oldData.items.findIndex(data => !data.is_pinned);
        const filteredProducts = oldData.items.filter(data => data.id !== editRes.data.id);

        if (updatedProduct.is_pinned) {
          return { items: [updatedProduct, ...filteredProducts] };
        } else {
          filteredProducts.splice(targetIndex, 0, updatedProduct);
          return { items: filteredProducts };
        }
      });

      toast.success(
        !isPublished
          ? 'Product published successfully'
          : 'Product unpublished successfully',
        { id: toastId },
      );
    } else {
      toast.error(editRes.message, { id: toastId, duration: cmsConfig.toast.duration.error });
    }
  }

  async function handleDelete({ deleteData, toastId }) {
    // This is for add opacity-50 style to deleted row
    setDeletingIds((prevDeletingIds) => [...prevDeletingIds, deleteData.id]);

    const removeRes = await removeProduct(deleteData.id);

    setDeletingIds((prevDeletingIds) =>
      prevDeletingIds.filter((id) => id !== deleteData.id)
    );

    if (removeRes.status === 'success') {
      queryClient.setQueryData(['products'], (oldData) => {
        if (!oldData) return oldData;

        return {
          items: oldData.items.filter((data) => data.id !== deleteData.id),
        };
      });

      toast.success('Product deleted successfully', {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, { id: toastId, duration: cmsConfig.toast.duration.error });
    }
  }

  // TABLE definition
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      enableHiding: false,
      cell: ({ row }) => {
        if (row.original.is_pinned) {
          return (
            <>
              <span>{row.getValue('name')}</span>
              <Badge
                variant="secondary"
                className="bg-green-50 dark:bg-green-900 ms-3 text-xs text-green-700 dark:text-green-300"
              >
                Pinned
              </Badge>
            </>
          );
        }
        return row.getValue('name');
      },
    },
    {
      id: 'category',
      accessorKey: 'category.name',
      header: 'Category',
    },
    {
      accessorKey: 'prices',
      enableHiding: false,
      header: () => (
        <>
          <span>Price</span>
          <div className="ms-4 inline-block space-x-1">
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${priceCurrency === CurrencyCode.IDR ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setPriceCurrency(CurrencyCode.IDR)}
            >
              IDR
            </Button>
            <Button
              variant="outline"
              className={`px-2 py-0.5 text-xs h-auto shadow-none ${priceCurrency === CurrencyCode.USD ? 'text-accent-foreground bg-accent' : ''}`}
              onClick={() => setPriceCurrency(CurrencyCode.USD)}
            >
              USD
            </Button>
          </div>
        </>
      ),
      cell: ({ row }) => {
        if (row.original.price_type === PriceType.PAID) {
          const prices = row.getValue('prices')[priceCurrency];
          const min = formatCurrency({
            value: prices.min,
            currencyCode: priceCurrency,
          });
          const max = formatCurrency({
            value: prices.max,
            currencyCode: priceCurrency,
          });

          if (!prices) return <Minus className="size-4 text-zinc-300" />;
          if (prices.min === prices.max) {
            return <span className="tabular-nums">{min}</span>;
          }
          
          return <span className="tabular-nums">{min}&ndash;{max}</span>;
        }
        
        return PriceType.FREE[0].toUpperCase() + PriceType.FREE.substring(1);
      },
    },
    {
      accessorKey: 'is_published',
      header: <div className="text-center">Published</div>,
      cell: ({ row }) => (
        <div className="text-center">{
          row.getValue('is_published')
            ? <Check className="size-4 inline-block" />
            : <Dot className="size-4 text-zinc-300 dark:text-zinc-700 inline-block" />
        }</div>
      ),
    },
    {
      accessorKey: 'released_at',
      header: 'Released At',
      cell: ({ row }) => formatDateTime(row.getValue('released_at')),
    },
    {
      id: 'admin',
      header: 'Admin',
      cell: ({ row }) => (
        <div>
          {row.original.admin?.isCurrentUser ? (
            <p>Myself</p>
          ) : (
            <>
              <p>{row.original.admin?.first_name} {row.original.admin?.last_name}</p>
              <p className="text-sm text-zinc-600">{row.original.admin?.email}</p>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => formatDateTime(row.getValue('created_at')),
    },
    {
      accessorKey: 'updated_at',
      header: 'Updated At',
      cell: ({ row }) => formatDateTime(row.getValue('updated_at')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 focus-visible:ring-ring"
                disabled={
                  updatingPinnedStatusIds.includes(row.original.id) ||
                  updatingPublishedIds.includes(row.original.id) ||
                  deletingIds.includes(row.original.id)
                }
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-50">
              <DropdownMenuLabel className="text-muted-foreground text-[15px]">Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
                <Link href={`/product/${row.original.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="w-full text-base"
                asChild
              >
                <button
                  onClick={() => handleEditPinnedStatus(
                    row.original.id,
                    row.original.is_pinned,
                  )}
                >
                  {row.original.is_pinned ? 'Unpin' : 'Pin'}
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="w-full text-base"
                asChild
              >
                <button
                  onClick={() => handleEditPublishedStatus(
                    row.original.id,
                    row.original.is_published,
                  )}
                >
                  {row.getValue('is_published') ? 'Unpublish' : 'Publish'}
                </button>
              </DropdownMenuItem>
              {!row.original.is_pinned && !row.getValue('is_published') && (
                <>
                  <DropdownMenuSeparator className="-mx-1.5" />
                  <DropdownMenuItem
                    className="w-full text-base focus:bg-red-100/70 dark:focus:bg-red-300/10"
                    asChild
                  >
                    <button
                      onClick={() => {
                        setDeleteData({ id: row.original.id, name: row.getValue('name') });
                        setIsOpenDeleteDialog(true);
                      }}
                    >
                      Delete
                    </button>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ], [priceCurrency, updatingPinnedStatusIds, updatingPublishedIds, deletingIds]);
  const table = useReactTable({
    data: dataP?.items,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 mb-4">
        <TooltipWrapper text="Create product">
          <Button asChild variant="outline" className="h-auto inline-block text-base px-3 py-1.5">
            <Link href="/product/new"><Plus className="icon" /> Create</Link>
          </Button>
        </TooltipWrapper>

        <TableColumnVisibility
          table={table}
          defaultColumnVisibility={defaultColumnVisibility}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          storageKey={columnVisibilityStorageKey}
          filterFn={(column) =>
            column.id === 'admin'
              ? isOwner
              : true
          }
        />
      </div>

      {isFetchingP ? (
        <TablePaginationSkeleton showPagination={false} />
      ) : isErrorP ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorP.message}</AlertTitle>
        </Alert>
      ) : (
        <>
          <DataTable
            table={table}
            processingIds={[
              ...updatingPinnedStatusIds,
              ...updatingPublishedIds,
              ...deletingIds,
            ]}
          />
          <TablePagination
            data={dataP}
            showNavigation={false}
          />
        </>
      )}

      <p className="mt-5 inline-block text-muted-foreground text-sm"><b>Notes</b>:</p>
      <ul className="text-muted-foreground text-sm list-disc list-inside">
        <li>Pinned products will have higher display priority on the Products page and the homepage. A maximum of 4 products can be pinned.</li>
        <li>Prices are displayed using each currency’s standard number format.</li>
      </ul>

      <DeleteDialog
        onDelete={handleDelete}
        isOpenDeleteDialog={isOpenDeleteDialog}
        onIsOpenDeleteDialogChange={setIsOpenDeleteDialog}
        deleteData={deleteData}
        onDeleteDataChange={setDeleteData}
      />
    </>
  );
}
