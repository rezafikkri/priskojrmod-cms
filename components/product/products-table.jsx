'use client';

import DataTable from './data-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Columns, AlertCircle } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TableSkeleton from '../loadings/table-skeleton';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { PriceType } from '@/constants/enums';
import { editProductPinnedStatus, editProductPublishedStatus, removeProduct } from '@/actions/product-actions';
import { toast } from 'sonner';
import { safeFetch } from '@/lib/safe-fetch';

export default function ProductsTable() {
  const queryClient = useQueryClient();
  const [columnVisibility, setColumnVisibility] = useState({
    is_published: true,
    released_at: true,
    created_at: false,
    updated_at: false,
  });
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
    select: (products) => {
      return products.map(product => {
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
      });
    },
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

        let updatedProduct = { ...oldData.find(data => data.id === editRes.data.id) };
        updatedProduct.updated_at = editRes.data.updated_at;
        updatedProduct.is_pinned = !isPinned;

        const targetIndex = oldData.findLastIndex(data => data.is_pinned);
        const filteredProducts = oldData.filter(data => data.id !== editRes.data.id);

        if (!isPinned) {
          return [updatedProduct, ...filteredProducts];
        } else {
          filteredProducts.splice(targetIndex, 0, updatedProduct);
          return filteredProducts;
        }
      });

      toast.success(
        !isPinned
          ? 'Product pinned successfully.'
          : 'Product unpinned successfully.',
        { id: toastId },
      );
    } else {
      toast.error(editRes.message, { id: toastId });
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

        let updatedProduct = { ...oldData.find(data => data.id === editRes.data.id) };
        updatedProduct.updated_at = editRes.data.updated_at;
        updatedProduct.is_published = !isPublished;

        let targetIndex = oldData.findIndex(data => !data.is_pinned);
        const filteredProducts = oldData.filter(data => data.id !== editRes.data.id);

        if (updatedProduct.is_pinned) {
          return [updatedProduct, ...filteredProducts];
        } else {
          filteredProducts.splice(targetIndex, 0, updatedProduct);
          return filteredProducts;
        }
      });

      toast.success(
        !isPublished
          ? 'Product published successfully.'
          : 'Product unpublished successfully.',
        { id: toastId },
      );
    } else {
      toast.error(editRes.message, { id: toastId });
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

        return [...oldData.filter((data) => data.id !== deleteData.id)];
      });

      toast.success('Product deleted successfully.', {
        id: toastId,
      });
    } else {
      toast.error(removeRes.message, { id: toastId });
    }
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 mb-4">
        <TooltipWrapper text="Create product">
          <Button asChild variant="outline" className="h-auto inline-block text-base px-3 py-1.5">
            <Link href="/product/new"><Plus className="icon" /> Create</Link>
          </Button>
        </TooltipWrapper>

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
                {column[0].replace('_', ' ').replace('is','')}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isFetchingP ? (
        <TableSkeleton />
      ) : isErrorP ? (
        <Alert variant="destructive" className="border-destructive/50 text-base">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorP.message}</AlertTitle>
        </Alert>
      ) : (
        <DataTable
          products={dataP}
          tableState={{
            columnVisibility,
            updatingPinnedStatusIds,
            updatingPublishedIds,
            deletingIds,
          }}
          tableHandler={{
            onColumnVisibilityChange: setColumnVisibility,
            onEditPinnedStatus: handleEditPinnedStatus,
            onEditPublishedStatus: handleEditPublishedStatus,
            onDelete: handleDelete,
          }}
        />
      )}

      <p className="mt-5 inline-block text-muted-foreground text-sm"><b>Notes</b>:</p>
      <ul className="text-muted-foreground text-sm list-disc list-inside">
        <li>Pinned products will have higher display priority on the Products page and the homepage. A maximum of 4 products can be pinned.</li>
        <li>Prices are displayed using each currency’s standard number format.</li>
      </ul>
    </>
  );
}
