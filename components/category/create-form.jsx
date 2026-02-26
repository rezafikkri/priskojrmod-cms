'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { categorySchema } from '@/lib/validators/category-validator';
import { addCategory } from '@/actions/category-actions';
import FormFields from './form-fields';
import { cmsConfig } from '@/config/cms';

export default function CreateForm() {
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
    },
  });

  async function handleSubmit(data) {
    const addRes = await addCategory(data);
    if (addRes.status === 'success') {
      form.reset();
      toast.success('Category created successfully.');
    } else {
      toast.error(addRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return <FormFields mode="create" form={form} onSubmit={handleSubmit} />;
}
