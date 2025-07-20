'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash } from 'lucide-react';
import { accountSettingsSchema } from '@/lib/validators/account-settings-validator';
import { editAccount, removeDonationLink } from '@/actions/account-settings-action';
import { toast } from 'sonner';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { CurrencyCode } from '@/constants/enums';

function generateDonationLinksValues(donationLinks) {
  if (donationLinks.length === 2) return donationLinks;
  if (donationLinks.length < 2 && donationLinks.length > 0) {
    if (donationLinks[0].currency_code === CurrencyCode.IDR) {
      return [
        ...donationLinks,
        { link: '', currency_code: CurrencyCode.USD },
      ];
    }
    return [
      { link: '', currency_code: CurrencyCode.IDR },
      ...donationLinks,
    ];
  }
  return [
    { link: '', currency_code: CurrencyCode.IDR },
    { link: '', currency_code: CurrencyCode.USD },
  ];
}

export function EditForm({
  account,
}) {
  const [deleteState, setDeleteState] = useState(null);
  const { data: session , update: updateSession } = useSession();
  const form = useForm({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      first_name: account.first_name,
      last_name: account.last_name,
      whatsapp_phone_number: account.whatsapp_phone_number,
      picture: account.picture,
      donation_links: generateDonationLinksValues(account.donation_links),
    },
  });
  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donation_links',
    keyName: 'rhfId',
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data) {
    const editRes = await editAccount(data);
    if (editRes.status === 'success') {
      // update several session data
      if (session.user.name !== data.first_name || session.user.image !== data.picture) {
        await updateSession({ first_name: data.first_name, picture: data.picture });
      }
      // set donationLinks id
      const prevDonationLinks = form.getValues('donation_links');
      if ((!prevDonationLinks[0].id || !prevDonationLinks[1].id) && editRes.data.donation_links) {
        form.setValue('donation_links', generateDonationLinksValues(editRes.data.donation_links));
      }
      toast.success('Account Settings updated successfully.');
    } else {
      toast.error(editRes.message);
    }
  }

  async function handleDeleteDonationLink(id) {
    const deleteBtn = document.querySelector(`button#donationLink${id}`);
    const linkInput = deleteBtn.parentElement.previousElementSibling;
    linkInput.setAttribute('disabled', true);
    setDeleteState({ isLoading: true, id });

    const removeRes = await removeDonationLink(id);
    if (removeRes.status === 'success') {
      const prevDonationLinks = form.getValues('donation_links'); 
      form.setValue(
        'donation_links',
        prevDonationLinks.map(dl => {
          if (dl.id === removeRes.data.id) return { link: '', currency_code: dl.currency_code };
          return dl;
        }),
      );
      linkInput.removeAttribute('disabled');
      setDeleteState(null);
      toast.success('Donation Link deleted successfully.');
    } else {
      linkInput.removeAttribute('disabled');
      setDeleteState(null);
      toast.error(removeRes.message);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mb-10">
          <FormItem>
            <FormLabel className="text-base">Email</FormLabel>
            <p>{account.email}</p>
          </FormItem>

          <div className="flex gap-3 items-start">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-base">First Name</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-base">Last Name</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="picture"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base">Profile Picture</FormLabel>
                <div className="rounded-md border size-40 bg-gray-100">
                  <img
                    src={field.value}
                    alt="Picture"
                    className="w-full h-full rounded-md"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormDescription>Enter the URL of the picture.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp_phone_number"
            render={({ field }) => {
              if (field.value.trim() === '') field.value = '+62';
              return (
                <FormItem className="flex-1">
                  <FormLabel className="text-base">WhatsApp Phone Number</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                  </FormControl>
                  <FormDescription>Enter a reachable WhatsApp phone number.</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <div className="space-y-5.5 my-8">
            <h3 className="text-lg font-bold mb-0">Donation Links</h3>
            <h2 className="text-zinc-700 dark:text-zinc-300/80">Donation Links are used for free products and replace the Buy button on the product details page.</h2>

            {donationLinks.map((dl, index) => (
              <FormField
                key={dl.rhfId}
                control={form.control}
                name={`donation_links.${index}.link`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-base">{dl.currency_code} Donation Link.</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          {...field}
                          className="shadow-none md:text-base h-auto px-3 py-1.5"
                        />
                      </FormControl>
                      {dl.id ?
                        <div className="relative inline-block">
                          <Button
                            type="button"
                            id={`donationLink${dl.id}`}
                            variant="secondary"
                            className={`hover:text-destructive dark:hover:text-red-500/90 ${isSubmitting ? '' : 'disabled:opacity-100'}`}
                            onClick={() => handleDeleteDonationLink(dl.id)}
                            disabled={isSubmitting}
                          >
                            <Trash className={(deleteState?.isLoading && deleteState.id === dl.id) ? 'opacity-0' : ''} />
                          </Button>
                          {(deleteState?.isLoading && deleteState.id === dl.id) &&
                            <div
                              className="absolute h-full top-0 left-0 right-0 flex justify-center items-center"
                            >
                              <Loader2 className="animate-spin" size={16} />
                            </div>
                          }
                        </div>
                      : null}
                    </div>
                    <FormDescription>Enter the donation link for {dl.currency_code}.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />           
            ))}
          </div>

          <div className="relative inline-block">
            <Button
              type="submit"
              className={`${deleteState?.isLoading ? '' : 'disabled:opacity-100'} ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
              disabled={isSubmitting || deleteState?.isLoading}
            >
              <span className={isSubmitting ? 'opacity-0' : ''}>Save</span>
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
