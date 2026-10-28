'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { editOwnerSchema } from '@/lib/validators/owner-validator';
import { editOwner, removeDonationLink } from '@/actions/owner-actions';
import { cmsConfig } from '@/config/cms';
import { callAction } from '@/lib/call-action';
import { generateDonationLinkValues } from '@/lib/utils';
import { useState } from 'react';

export default function EditForm({ owner }) {
  const form = useForm({
    resolver: zodResolver(editOwnerSchema),
    defaultValues: {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      smProfileUrl: owner.smProfileUrl,
      picture: owner.picture,
      donationLinks: generateDonationLinkValues(owner.donationLinks),
    },
  });

  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donationLinks',
  });

  const [deletingDonationLinkIds, setDeletingDonationLinkIds] = useState([]);

  async function handleDeleteDonationLink(id) {
    setDeletingDonationLinkIds(prevIds => [...prevIds, id]);

    const removeRes = await callAction(() => removeDonationLink(id, owner.id));

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
    const editRes = await callAction(() => editOwner(data));
    if (editRes.status === 'success') {
      if (
        editRes.data.donationLinks ||
        form.getValues('donationLinks').some(dl => 'dbId' in dl)
      ) {
        form.setValue('donationLinks', generateDonationLinkValues(editRes.data.donationLinks ?? []));
      }

      toast.success('Owner updated successfully.');
    } else {
      toast.error(editRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return (
    <FormFields
      mode="edit"
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
