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
import { cmsConfig } from '@/config/cms';
import { callAction } from '@/lib/call-action';

export function EditForm({
  account,
}) {
  const { data: session , update: updateSession } = useSession();
  const form = useForm({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      role: account.role,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      whatsappPhoneNumber: account.whatsappPhoneNumber,
      picture: account.picture,
      donationLinks: generateDonationLinkValues(account.donationLinks),
    },
  });
  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donationLinks',
  });

  const [deletingDonationLinkIds, setDeletingDonationLinkIds] = useState([]);

  async function handleDeleteDonationLink(id) {
    setDeletingDonationLinkIds(prevIds => [...prevIds, id]);

    const removeRes = await callAction(() => removeDonationLink(id));

    setDeletingDonationLinkIds(prevIds => prevIds.filter(prevId => prevId !== id));

    if (removeRes.status === 'success') {
      const prevDonationLinks = form.getValues('donationLinks'); 
      form.setValue(
        'donationLinks',
        prevDonationLinks.map(dl => {
          if (dl.dbId === id) return { url: '', currencyCode: dl.currencyCode };
          return dl;
        }),
      );
      toast.success('Donation link deleted successfully.');
    } else {
      toast.error(removeRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  async function handleSubmit(data) {
    const editRes = await callAction(() => editAccount(data));
    if (editRes.status === 'success') {
      // update several session data
      if (
        session?.user?.firstName !== data.firstName ||
        session?.user?.lastName !== data.lastName ||
        session?.user?.image !== data.picture
      ) {
        await updateSession({
          firstName: data.firstName,
          lastName: data.lastName,
          picture: data.picture,
        });
      }

      // update donation link data in form
      if (
        editRes.data.donationLinks ||
        form.getValues('donationLinks').some(dl => 'dbId' in dl)
      ) {
        form.setValue('donationLinks', generateDonationLinkValues(editRes.data.donationLinks ?? []));
      }

      toast.success('Account settings updated successfully.');
    } else {
      toast.error(editRes.message, { duration: cmsConfig.toast.duration.error });
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
