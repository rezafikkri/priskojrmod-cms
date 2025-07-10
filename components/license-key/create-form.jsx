'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { createLicenseKeySchema } from '@/lib/validators/license-key-validator';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { addLicenseKey } from '@/actions/license-key-actions';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateForm({
  secretKeys
}) {
  // Get QueryClient from the context
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createLicenseKeySchema),
    defaultValues: {
      secret_key_id: '',
      email: '',
      name: '',
      type: 'online',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data) {
    const addRes = await addLicenseKey(data);
    if (addRes.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['licenseKeys'] })
      form.reset();
      toast.success('License Key created successfully.');
    } else {
      toast.error(addRes.message);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 lg:max-w-2/3 mb-10">
          <FormField
            control={form.control}
            name="secret_key_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Secret Key</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value} disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full shadow-none text-base h-auto! px-3 py-1.5">
                      <SelectValue placeholder="Select a secret key" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {secretKeys.map(secretKey => (
                      <SelectItem
                        key={secretKey.id}
                        value={secretKey.id}
                        className="text-base"
                      >
                        {secretKey.app_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select secret key based on application name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Customer Name</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormDescription>Enter the customer name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Email</FormLabel>
                <FormControl>
                  <Input type="email" disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormDescription>Enter the customer email.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base">Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex space-x-2"
                    disabled={isSubmitting}
                  >
                    <FormItem className="flex items-center space-x-1 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="online" />
                      </FormControl>
                      <FormLabel className="font-normal text-base">Online</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-1 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="offline" />
                      </FormControl>
                      <FormLabel className="font-normal text-base">Offline</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormDescription>Select activation type: online or offline.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button asChild variant="outline" className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5">
            <Link href="/license-key"><ArrowLeft className="icon" /> Back</Link>
          </Button>
          <div className="relative inline-flex">
            <Button
              type="submit"
              className={`disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
              disabled={isSubmitting}
            >
              <span className={isSubmitting ? 'opacity-0' : ''}>Create</span>
            </Button>
            {isSubmitting && 
              <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
                <Loader2 className="animate-spin text-primary-foreground" size={16} />
              </div>
            }
          </div>
        </form>
      </Form>
    </>
  );
}
