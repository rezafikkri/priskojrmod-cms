'use client';

import DataTable from './data-table';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../ui/input';
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
import FiltersPopover from './filters-popover';

export default function CustomersTable() {
  const [columnVisibility, setColumnVisibility] = useState({
    last_active: true,
    created_at: false,
    updated_at: false,
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-3 items-start mb-4">
        <div className="flex space-x-6">
          <TooltipWrapper text="Create customer">
            <Button asChild variant="outline" className="md:w-auto h-auto text-base px-3 py-1.5 inline-block">
              <Link href="/customer/new"><Plus className="icon" /> Create</Link>
            </Button>
          </TooltipWrapper>

          <div className="flex space-x-3">
            <FiltersPopover
              onFilter = {() => {}}
              isFilterActive = {false}
              disabled = {false}
            />
           </div>
        </div>
        <div className="flex space-x-3 max-lg:w-full w-2/5">
          <div className="flex shadow-xs rounded-md flex-1">
            <div className="relative flex items-center -me-[1px] z-1 flex-1">
              <Input
                placeholder="Search with email..."
                className="rounded-e-none shadow-none md:text-base h-auto px-3 py-1.5 pe-9"
                autoComplete="off"
              />
                <TooltipWrapper text="Clear search input">
                  <Button
                    className="absolute right-2 w-4 h-5 p-0 z-1"
                    variant="ghost"
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipWrapper>
            </div>
            <Button
              variant="secondary"
              className="border shadow-none rounded-s-none h-auto text-base px-3 py-1.5 focus:z-2"
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

      <DataTable
        customer={{
          customers: [],
          rowCount: 0,
          isTooMany: false,
        }}
        tableState={{
          columnVisibility,
        }}
        tableHandler={{
          onColumnVisibilityChange: setColumnVisibility,
        }}
      />

      <small className="mt-5 inline-block text-muted-foreground text-sm"><b>Note</b>: <i>Last Active</i> indicates the most recent recorded activity and is updated every 24 hours. This may not reflect real-time status.</small>
    </>
  );
}
