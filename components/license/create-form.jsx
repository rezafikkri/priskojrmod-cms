'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRef } from 'react';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { createLicenseSchema } from '@/lib/validators/license-validator';
import { addLicense } from '@/actions/license-actions';

export default function CreateForm() {
  const form = useForm({
    resolver: zodResolver(createLicenseSchema),
    defaultValues: {
      name: {
        id: '',
        en: '',
      },
      content: {
        id: '',
        en: '',
      },
    },
  });

  const isResetEditor = useRef(false);

  async function handleSubmit(data) {
    const addRes = await addLicense(data);
    if (addRes.status === 'success') {
      isResetEditor.current = true;
      form.reset();
      toast.success('License created successfully.');
    } else {
      toast.error(addRes.message);
    }
  }

  return <FormFields mode="create" form={form} onSubmit={handleSubmit} isResetEditor={isResetEditor} />;
}
