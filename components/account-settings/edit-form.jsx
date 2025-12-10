'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { editAccount, removeDonationLink } from '@/actions/account-settings-action';
import { toast } from 'sonner';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { generateDonationLinkValues } from '@/lib/utils';
import FormFields from '../admin/form-fields';
import { accountSettingsSchema } from '@/lib/validators/account-settings-validator';

export function EditForm({
  account,
}) {
  const { data: session , update: updateSession } = useSession();
  const form = useForm({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      role: account.role,
      email: account.email,
      first_name: account.first_name,
      last_name: account.last_name,
      whatsapp_phone_number: account.whatsapp_phone_number,
      picture: account.picture,
      donation_links: generateDonationLinkValues(account.donation_links),
    },
  });
  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donation_links',
  });

  const [deletingDonationLinkIds, setDeletingDonationLinkIds] = useState([]);

  async function handleDeleteDonationLink(id) {
    setDeletingDonationLinkIds(prevIds => [...prevIds, id]);

    const removeRes = await removeDonationLink(id);

    setDeletingDonationLinkIds(prevIds => prevIds.filter(prevId => prevId !== id));

    if (removeRes.status === 'success') {
      const prevDonationLinks = form.getValues('donation_links'); 
      form.setValue(
        'donation_links',
        prevDonationLinks.map(dl => {
          if (dl.dbId === id) return { url: '', currency_code: dl.currency_code };
          return dl;
        }),
      );
      toast.success('Donation link deleted successfully.');
    } else {
      toast.error(removeRes.message);
    }
  }

  async function handleSubmit(data) {
    const editRes = await editAccount(data);
    if (editRes.status === 'success') {
      // update several session data
      if (
        session?.user?.first_name !== data.first_name ||
        session?.user?.last_name !== data.last_name ||
        session?.user?.image !== data.picture
      ) {
        await updateSession({
          first_name: data.first_name,
          last_name: data.last_name,
          picture: data.picture,
        });
      }

      // update donation link data in form
      if (
        editRes.data.donation_links ||
        form.getValues('donation_links').some(dl => 'dbId' in dl)
      ) {
        form.setValue('donation_links', generateDonationLinkValues(editRes.data.donation_links ?? []));
      }

      toast.success('Account settings updated successfully.');
    } else {
      toast.error(editRes.message);
    }
  }

  return (
    <FormFields
      mode="profile"
      form={form}
      onSubmit={handleSubmit}
      donations={{
        donationLinks,
        onDeleteDonationLink: handleDeleteDonationLink,
        deletingDonationLinkIds,
      }}
    />
  );
}
