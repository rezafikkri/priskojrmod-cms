'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { editLicenseSchema } from '@/lib/validators/license-validator';
import { editLicense } from '@/actions/license-actions';

export default function EditForm({ license }) {
  const form = useForm({
    resolver: zodResolver(editLicenseSchema),
    defaultValues: {
      id: license.id,
      translationId: {
        id: license.translations.id.id,
        en: license.translations.id.en,
      },
      name: {
        id: license.translations.name.id,
        en: license.translations.name.en,
      },
      content: {
        id: license.translations.content.id,
        en: license.translations.content.en,
      },
    },
  });

  async function handleSubmit(data) {
    const editRes = await editLicense(data);
    if (editRes.status === 'success') {
      toast.success('License updated successfully.');
    } else {
      toast.error(editRes.message);
    }
  }

  return <FormFields mode="edit" form={form} onSubmit={handleSubmit} />;
}
