'use client';

import { useQuery } from '@tanstack/react-query';
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
    name: 'customer_id',
  });
  useEffect(() => {
    if (!customerId && selectedLabel) {
      setSelectedLabel('');
    }
  }, [customerId]);

  const { data, isFetching } = useQuery({
    queryKey: ['customers-autocomplete', debouncedKey],
    queryFn: async () => {
      const results = await safeFetch({ url: `/api/customers/autocomplete?sk=${debouncedKey}` });
      return results.data;
    },
    placeholderData: [],
    staleTime: 20_000,
    enabled: debouncedKey.length > 0,
  });

  return (
    <FormField
      control={form.control}
      name="customer_id"
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
            <PopoverContent className="p-0 w-auto" align="start">
              <Command>
                <div className="relative">
                  <CommandInput
                    placeholder="Search with email..."
                    className="text-base"
                    value={searchKey}
                    onValueChange={(value) => setSearchKey(value)}
                  />
                  {isFetching && (
                    <span className="absolute left-1.5 bg-white top-1 bottom-1 flex items-center px-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </span>
                  )}
                </div>
                <CommandList>
                  {isFetching ? (
                    <CommandEmpty>Searching...</CommandEmpty>
                  ) : (
                    <CommandEmpty>No customer found.</CommandEmpty>
                  )}
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
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormDescription>
            Search a customer.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
