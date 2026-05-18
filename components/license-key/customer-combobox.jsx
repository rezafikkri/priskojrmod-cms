'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '../ui/button';
import { ChevronsUpDown, Loader2, Check } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { safeFetch } from '@/lib/safe-fetch';
import { useWatch } from 'react-hook-form';
import { Skeleton } from '../ui/skeleton';

export default function CustomerCombobox({
  form,
  disabled,
}) {
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [searchKey, setSearchKey] = useState('');
  const debouncedKey = useDebounce(searchKey);

  // This state for save selected value
  const [selectedLabel, setSelectedLabel] = useState('');

  const customerId = useWatch({
    control: form.control,
    name: 'customerId',
  });
  useEffect(() => {
    if (!customerId && selectedLabel) {
      setSelectedLabel('');
    }
  }, [customerId]);

  const { data, isError, error, isFetching, isLoading, status } = useQuery({
    queryKey: ['customersAutocomplete', debouncedKey],
    queryFn: async ({ signal }) => {
      const results = await safeFetch({
        url: `/api/customers/autocomplete?sk=${debouncedKey}`,
        signal,
      });
      return results?.data;
    },
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
    enabled: debouncedKey.trim().length > 0,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  return (
    <FormField
      control={form.control}
      name="customerId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="text-base">Customer</FormLabel>
          <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "justify-between w-full shadow-none font-normal text-base min-h-9.5 h-auto px-3 py-1.5",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  {selectedLabel || 'Search a customer'}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0 sm:w-100 lg:w-120" align="start">
              <Command shouldFilter={false}>
                <div className="relative">
                  <CommandInput
                    placeholder="Type email address..."
                    className="text-base"
                    value={searchKey}
                    onValueChange={(value) => setSearchKey(value)}
                  />
                  {isFetching && (
                    <span className="absolute left-1.5 bg-popover top-1 bottom-1 flex items-center px-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </span>
                  )}
                </div>
                <CommandList className="min-h-10">
                  {isLoading && (
                    <div className="py-1 space-y-1.5 px-2">
                      <Skeleton className="w-3/4 h-[27px]" />
                      <Skeleton className="w-4/5 h-[27px]" />
                      <Skeleton className="w-3/4 h-[27px]" />
                    </div>
                  )}

                  {isError ? (
                    <>
                      <div className="p-1">
                        <p className="text-base text-destructive px-2 py-1.5">{error.message}</p>
                      </div>
                      {data?.length > 0 && (
                        <hr className="bg-border mx-1" />
                      )}
                    </>
                  ) : (status !== 'pending' && data?.length < 1) && (
                    <CommandEmpty><span className="text-zinc-600">No results</span></CommandEmpty>
                  )}
                  
                  {data?.length > 0 && (
                    <CommandGroup>
                      {data.map(customer => (
                        <CommandItem
                          className="text-base"
                          value={customer.displayLabel}
                          key={customer.id}
                          onSelect={() => {
                            field.onChange(customer.id);
                            setSelectedLabel(customer.displayLabel);
                            setIsComboboxOpen(false);
                          }}
                        >
                          {customer.displayLabel}
                          <Check
                            className={cn(
                              "ml-auto",
                              customer.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormDescription>
            Search a customer
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
