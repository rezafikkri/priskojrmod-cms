'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { CurrencyCode } from '@/constants/enums';
import { createAdminSchema } from '@/lib/validators/admin-validator';
import FormFields from './form-fields';
import { addAdmin } from '@/actions/admin-actions';

export default function CreateForm() {
  const form = useForm({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      whatsapp_phone_number: {
        country_iso: '',
        number: '',
      },
      picture: '',
      donation_links: [
        { link: '', currency_code: CurrencyCode.IDR },
        { link: '', currency_code: CurrencyCode.USD },
      ],
    },
  });
  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donation_links',
    keyName: 'rhfId',
  });

  async function handleSubmit(data) {
    const addRes = await addAdmin(data);
    if (addRes.status === 'success') {
      form.reset();
      toast.success('Admin created successfully.');
    } else {
      toast.error(addRes.message);
    }
  }

  return (
    <FormFields
      mode="create"
      form={form}
      onSubmit={handleSubmit}
      donations={{
        donationLinks,
      }}
    />
  );
}
