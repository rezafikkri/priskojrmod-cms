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
} from '../ui/form';
import { editLicenseKeySchema } from '@/lib/validators/license-key-validator';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { editLicenseKey } from '@/actions/license-key-actions';
import { useQueryClient } from '@tanstack/react-query'
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { formatDateTime } from '@/lib/format-date';

export default function EditForm({ licenseKey }) {
  // Get QueryClient from the context
  const queryClient = useQueryClient();
  const [licenseKeyExpire, setLicenseKeyExpire] = useState(() => {
    return formatDateTime(licenseKey.parsedKey.exp);
  });

  const form = useForm({
    resolver: zodResolver(editLicenseKeySchema),
    defaultValues: {
      id: licenseKey.id,
      change_expiration_date: false,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data) {
    const editRes = await editLicenseKey(data);

    if (editRes.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['licenseKeys'] });
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      form.setValue('change_expiration_date', false);

      if (editRes.data.exp) {
        setLicenseKeyExpire(formatDateTime(editRes.data.exp));
      }

      toast.success('License key updated successfully');
    } else {
      toast.error(editRes.message);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mb-10">
          <FormItem>
            <FormLabel className="text-base">Secret key</FormLabel>
            <p>{licenseKey.appName}</p>
            <FormDescription>What’s displayed here is the app name, which represents the secret key used by this license key. It cannot be changed after creation.</FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel className="text-base">Customer</FormLabel>
            <p>{licenseKey.customer}</p>
            <FormDescription>What’s displayed here is the customer who owns this license key. Updates to the customer’s details won’t affect the license key code.</FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel className="text-base">Device reset status</FormLabel>
            <p>{licenseKey.resetCount} / {process.env.NEXT_PUBLIC_MAX_DEVICE_RESETS_PER_PERIOD} resets used (Period: {licenseKey.resetPeriod})</p>
            <FormDescription>
              This status is managed automatically by the system based on <i>UTC (global) time</i>. It is updated only when the customer resets their device binding through the <strong>My Products</strong> page.
            </FormDescription>
            <FormDescription>
              The device can be reset directly using the action menu in the license key table, but this does <strong>not</strong> affect the reset count or period.
            </FormDescription>
          </FormItem>
          
          <FormField
            control={form.control}
            name="change_expiration_date"
            render={({ field }) => (
              <FormItem className="flex space-x-2 items-start">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-2">
                  <FormLabel className="text-base leading-none">Change expiration date</FormLabel>
                  <FormDescription>Check this if you want to change the license key expiration date. The expiration date will then be extended by 1 year from the current date; ignore otherwise. For now, the license key will expire on {licenseKeyExpire}.</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button asChild variant="outline" className="me-3 mb-0 h-auto text-base px-3 py-1.5 inline-block">
            <Link href="/license-key"><ArrowLeft className="icon" /> Back</Link>
          </Button>
          <div className="relative inline-block">
            <Button
              type="submit"
              className={`disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
              disabled={isSubmitting}
            >
              <span className={isSubmitting ? 'opacity-0' : ''}>Update</span>
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
