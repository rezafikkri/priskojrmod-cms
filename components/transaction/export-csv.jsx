'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { CurrencyCode } from '@/constants/enums';

export default function ExportCSV({ filters }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="text-base px-3 py-1.5 h-auto relative inline-block" variant="outline">
          Export CSV <ChevronDown className="icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
          <Link
            href={`/transaction/csv?cc=${CurrencyCode.IDR}&ts=${filters?.status ?? 'all'}`}
            target='_blank'
          >{CurrencyCode.IDR}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-base py-2 hover:cursor-pointer">
          <Link
            href={`/transaction/csv?cc=${CurrencyCode.USD}&ts=${filters?.status ?? 'all'}`}
            target='_blank'
          >{CurrencyCode.USD}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
