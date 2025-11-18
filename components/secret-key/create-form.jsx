'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  Loader2,
  ArrowLeft,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { createSecretKeySchema } from '@/lib/validators/secret-key-validator';
import { toast } from 'sonner';
import Link from 'next/link';
import random32Bytes from '@/actions/random-32-bytes-actions';
import { addSecretKey } from '@/actions/secret-key-actions';
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

export default function CreateForm({ products }) {
  const form = useForm({
    resolver: zodResolver(createSecretKeySchema),
    defaultValues: {
      product_id: '',
      key: '',
    },
  });
  const isSubmitting = form.formState.isSubmitting;
  const [loadingKey, setLoadingKey] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)

  async function handleSubmit(data) {
    const addRes = await addSecretKey(data);
    if (addRes.status === 'success') {
      form.reset();
      toast.success('Secret key created successfully.');
    } else {
      toast.error(addRes.message);
    }
  }

  async function handleGenerateKey() {
    setLoadingKey(true);
  
    const keyRes = await random32Bytes();
    form.setValue('key', keyRes.random);
    form.clearErrors('key');

    setLoadingKey(false);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mb-10">
          <FormField
            control={form.control}
            name="product_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-base">Product</FormLabel>
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
                        disabled={isSubmitting}
                      >
                        {field.value
                          ? products.find(
                            (product) => product.id === field.value
                          )?.name
                          : "Select a product"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-auto" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search a product..."
                        className="text-base"
                      />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          {products.map(product => (
                            <CommandItem
                              className="text-base"
                              value={product.name}
                              key={product.id}
                              onSelect={() => {
                                form.setValue('product_id', product.id)
                                setIsComboboxOpen(false);
                              }}
                            >
                              {product.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  product.id === field.value
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
                  Search or select a digital product.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Secret Key</FormLabel>
                <div className="flex w-full items-center">
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      className="md:text-base h-auto px-3 py-1.5 -me-[1px] shadow-none rounded-e-none z-1 relativ"
                      {...field}
                    />
                  </FormControl>
                  <div className="relative">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handleGenerateKey}
                      className={`h-auto text-base px-3 py-1.5 border rounded-s-none ${loadingKey ? 'disabled:opacity-100 transition-none' : ''}`}
                      disabled={loadingKey || isSubmitting}
                    >
                      <span className={loadingKey ? 'opacity-0' : ''}>Generate</span>
                    </Button>
                    {loadingKey && (
                      <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
                        <Loader2 className="animate-spin" size={16} />
                      </div>
                    )}
                  </div>
                </div>
                <FormDescription>Enter a secret key or click the Generate button to create one.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button asChild variant="outline" className="me-3 mb-0 h-auto text-base px-3 py-1.5 inline-block">
            <Link href="/secret-key"><ArrowLeft className="icon" /> Back</Link>
          </Button>
          <div className="relative inline-block">
            <Button
              type="submit"
              className={`h-auto text-base px-3 py-1.5 disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} border border-primary`}
              disabled={isSubmitting}
            >
              <span className={isSubmitting ? 'opacity-0' : ''}>Create</span>
            </Button>
            {isSubmitting && (
              <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
                <Loader2 className="animate-spin text-primary-foreground" size={16} />
              </div>
            )}
          </div>
        </form>
      </Form>
    </>
  );
}
