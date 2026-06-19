'use client';

import { generatePageInfo } from '@/lib/utils';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';

export default function TablePagination({
  data,
  table,
  pagination,
  isPlaceholderData,
}) {
  const [pageInfo, setPageInfo] = useState(null);

  useEffect(() => {
    if (!isPlaceholderData) {
      const currentCount = data?.items?.length ?? 0;
      setPageInfo(generatePageInfo({
        pageIndex: pagination.pageIndex,
        totalCount: data?.rowCount ?? 0,
        currentCount,
      }));
    }
  }, [isPlaceholderData, pagination, data]);

  return (
    <div
      className="flex max-md:flex-col max-md:items-start gap-3 md:gap-5 md:justify-between mt-4 items-center"
    >
      <span className="text-muted-foreground">{pageInfo}</span>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="h-auto text-base px-3 py-1.5"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={isPlaceholderData || !table.getCanNextPage()}
          className="h-auto text-base px-3 py-1.5"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
