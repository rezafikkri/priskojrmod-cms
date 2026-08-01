'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { UserRole, CurrencyCode } from '@/constants/enums';
import { createAdminSchema } from '@/lib/validators/admin-validator';
import FormFields from './form-fields';
import { addAdmin } from '@/actions/admin-actions';
import { cmsConfig } from '@/config/cms';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateForm() {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      role: UserRole.STAFF,
      email: '',
      firstName: '',
      lastName: '',
      whatsappPhoneNumber: {
        countryIso: '',
        number: '',
      },
      picture: '',
      donationLinks: [
        { url: '', currencyCode: CurrencyCode.IDR },
        { url: '', currencyCode: CurrencyCode.USD },
      ],
    },
  });
  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donationLinks',
  });

  async function handleSubmit(data) {
    const addRes = await addAdmin(data);
    if (addRes.status === 'success') {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['adminOptions'] });
      
      toast.success('Admin created successfully.');
    } else {
      toast.error(addRes.message, { duration: cmsConfig.toast.duration.error });
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
