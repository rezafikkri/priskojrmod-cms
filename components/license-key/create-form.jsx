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
import CustomerCombobox from './customer-combobox';
import { cmsConfig } from '@/config/cms';

export default function CreateForm({ secretKeys }) {
  // Get QueryClient from the context
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createLicenseKeySchema),
    defaultValues: {
      secret_key_id: '',
      customer_id: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data) {
    const addRes = await addLicenseKey(data);
    if (addRes.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      form.reset();
      toast.success('License key created successfully');
    } else {
      toast.error(addRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mb-10">
          <FormField
            control={form.control}
            name="secret_key_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Secret key</FormLabel>
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
                        value={secretKey.id.toString()}
                        className="text-base"
                      >
                        {secretKey.app_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select secret key based on application name</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <CustomerCombobox form={form} disabled={isSubmitting} />
          
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
