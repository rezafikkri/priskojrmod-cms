'use client';

import { deepEqual } from 'fast-equals';
import { localStorageRemove, localStorageSet } from '@/lib/local-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Columns } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { Button } from '@/components/ui/button';

export default function ColumnVisibilityMenu({
  table,
  defaultColumnVisibility,
  columnVisibility,
  onColumnVisibilityChange,
  filterFn,
}) {
  let columns = table.getAllColumns().filter((column) => column.getCanHide());

  if (filterFn) {
    columns = columns.filter(filterFn);
  }

  function handleResetColumnVisibility() {
    onColumnVisibilityChange(defaultColumnVisibility);
    localStorageRemove('products:column-visibility');
  }

  function formatColumnLabel(columnId) {
    const words = columnId.replace('_', ' ').replace('is','').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  function handleColumnVisibilityChange(column, value) {
    column.toggleVisibility(!!value);
    localStorageSet('products:column-visibility', {
      ...columnVisibility,
      [column.id]: !!value,
    });
  }

  return (
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
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="text-base hover:cursor-pointer"
            checked={column.getIsVisible()}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(value) => handleColumnVisibilityChange(column, value)}
          >
            {formatColumnLabel(column.id)}
          </DropdownMenuCheckboxItem>
        ))}
        {!deepEqual(defaultColumnVisibility, columnVisibility) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-base w-full">
              <button onClick={handleResetColumnVisibility}>Reset to default</button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
