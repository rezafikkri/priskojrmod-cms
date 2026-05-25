'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';
import { CurrencyCode } from '@/constants/enums';

export default function ExportCSV({ filters }) {
  function handleExport(currencyCode, transactionStatus) {
    window.open(
      `/transaction/csv?cc=${currencyCode}&ts=${transactionStatus}`,
      '_blank',
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button className="text-base px-3 py-1.5 h-auto relative inline-block" variant="outline">
          Export CSV <ChevronDown className="icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild className="text-base hover:cursor-pointer w-full">
          <button
            onClick={() => handleExport(CurrencyCode.IDR, filters?.status ?? 'all')}
          >{CurrencyCode.IDR}</button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-base hover:cursor-pointer w-full">
          <button
            onClick={() => handleExport(CurrencyCode.USD, filters?.status ?? 'all')}
          >{CurrencyCode.USD}</button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
