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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { editLicenseKeySchema } from '@/lib/validators/license-key-validator';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { editLicenseKey } from '@/actions/license-key-actions';
import { useQueryClient } from '@tanstack/react-query'
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { formatDateTimeWIB } from '@/lib/format-date';

export default function EditForm({ licenseKey }) {
  // Get QueryClient from the context
  const queryClient = useQueryClient();
  const [licenseKeyExpire, setLicenseKeyExpire] = useState(() => {
    return formatDateTimeWIB(licenseKey.parsedKey.exp);
  });

  const form = useForm({
    resolver: zodResolver(editLicenseKeySchema),
    defaultValues: {
      id: licenseKey.id,
      type: licenseKey.parsedKey.type,
      used_for_activate: licenseKey.used_for_activate,
      used_for_download: licenseKey.used_for_download,
      change_expiration_date: false,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data) {
    const editRes = await editLicenseKey(data);

    if (editRes.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['licenseKeys'] })
      queryClient.invalidateQueries({ queryKey: ['licenseKeysSearch'] });
      form.setValue('change_expiration_date', false);
      if (editRes.data.exp) {
        setLicenseKeyExpire(formatDateTimeWIB(editRes.data.exp));
      }
      toast.success('License key updated successfully.');
    } else {
      toast.error(editRes.message);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 lg:max-w-2/3 mb-10">
          <FormItem>
            <FormLabel className="text-base">Secret Key</FormLabel>
            <p>{licenseKey.appName}</p>
            <FormDescription>What’s displayed here is the app name, which represents the Secret Key used by this license key. It cannot be changed after creation.</FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel className="text-base">Customer</FormLabel>
            <p>{licenseKey.customer}</p>
            <FormDescription>This customer information is for reference only, indicating the owner of the license key. Changes to the customer data do not affect the contents of the license key payload.</FormDescription>
          </FormItem>

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

          <FormField
            control={form.control}
            name="used_for_activate"
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
                  <FormLabel className="text-base leading-none">Used For Activate</FormLabel>
                  <FormDescription>
                    Check this if the License Key has been used to activate the application.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="used_for_download"
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
                  <FormLabel className="text-base leading-none">Used For Download</FormLabel>
                  <FormDescription>
                    Check this if the customer has downloaded the file associated with the application (e.g., Default Addon).
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
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
                  <FormLabel className="text-base leading-none">Change Expiration Date</FormLabel>
                  <FormDescription>Check this if you want to change the License Key expiration date. The expiration date will then be extended by 1 year from the current date; ignore otherwise. For now, the License Key will expire on {licenseKeyExpire}.</FormDescription>
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
