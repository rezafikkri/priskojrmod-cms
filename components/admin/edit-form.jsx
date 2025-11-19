'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { editAdminSchema } from '@/lib/validators/admin-validator';
import FormFields from './form-fields';
import { editAdmin } from '@/actions/admin-actions';
import { generateDonationLinksValues } from '@/lib/utils';

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
      donation_links: generateDonationLinksValues(admin.donation_links),
    },
  });

  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donation_links',
  });

  const [deleteDonationLinkState, setDeleteDonationLinkState] = useState({});

  function handleDeleteDonationLink(id) {
    // placeholder logic, nanti bisa diisi sesuai kebutuhan
  }

  async function handleSubmit(data) {
    const editRes = await editAdmin(data);
    if (editRes.status === 'success') {
      if (
        editRes.data.donation_links ||
        form.getValues('donation_links').some(dl => 'dbId' in dl)
      ) {
        form.setValue('donation_links', generateDonationLinksValues(editRes.data.donation_links ?? []));
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
        handleDeleteDonationLink,
        deleteDonationLinkState,
      }}
    />
  );
}

