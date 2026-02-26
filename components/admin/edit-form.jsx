'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { editAdminSchema } from '@/lib/validators/admin-validator';
import FormFields from './form-fields';
import { editAdmin, removeDonationLink } from '@/actions/admin-actions';
import { generateDonationLinkValues } from '@/lib/utils';
import { cmsConfig } from '@/config/cms';

export default function EditForm({ admin }) {
  const form = useForm({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      whatsappPhoneNumber: admin.whatsappPhoneNumber,
      picture: admin.picture,
      role: admin.role,
      donationLinks: generateDonationLinkValues(admin.donationLinks),
    },
  });

  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donationLinks',
  });

  const [deletingDonationLinkIds, setDeletingDonationLinkIds] = useState([]);

  async function handleDeleteDonationLink(id) {
    setDeletingDonationLinkIds(prevIds => [...prevIds, id]);

    const removeRes = await removeDonationLink(id, admin.id);

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
    const editRes = await editAdmin(data);
    if (editRes.status === 'success') {
      if (
        editRes.data.donationLinks ||
        form.getValues('donationLinks').some(dl => 'dbId' in dl)
      ) {
        form.setValue('donationLinks', generateDonationLinkValues(editRes.data.donationLinks ?? []));
      }
      toast.success('Admin updated successfully.');
    } else {
      toast.error(res.message, { duration: cmsConfig.toast.duration.error });
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

