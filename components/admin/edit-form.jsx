'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { editAdminSchema } from '@/lib/validators/admin-validator';
import FormFields from './form-fields';
import { editAdmin, removeDonationLink } from '@/actions/admin-actions';
import { generateDonationLinkValues } from '@/lib/utils';

export default function EditForm({ admin }) {
  const form = useForm({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {
      id: admin.id,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      whatsapp_phone_number: admin.whatsapp_phone_number,
      picture: admin.picture,
      role: admin.role,
      donation_links: generateDonationLinkValues(admin.donation_links),
    },
  });

  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donation_links',
  });

  const [deletingDonationLinkIds, setDeletingDonationLinkIds] = useState([]);

  async function handleDeleteDonationLink(id) {
    setDeletingDonationLinkIds(prevIds => [...prevIds, id]);

    const removeRes = await removeDonationLink(id, admin.id);

    setDeletingDonationLinkIds(prevIds => prevIds.filter(prevId => prevId !== id));

    if (removeRes.status === 'success') {
      const prevDonationLinks = form.getValues('donation_links'); 
      form.setValue(
        'donation_links',
        prevDonationLinks.map(dl => {
          if (dl.dbId === id) return { link: '', currency_code: dl.currency_code };
          return dl;
        }),
      );
      toast.success('Donation link deleted successfully.');
    } else {
      toast.error(removeRes.message);
    }
  }

  async function handleSubmit(data) {
    const editRes = await editAdmin(data);
    if (editRes.status === 'success') {
      if (
        editRes.data.donation_links ||
        form.getValues('donation_links').some(dl => 'dbId' in dl)
      ) {
        form.setValue('donation_links', generateDonationLinkValues(editRes.data.donation_links ?? []));
      }
      toast.success('Admin updated successfully.');
    } else {
      toast.error(res.message);
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

