'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { categorySchema } from '@/lib/validators/category-validator';
import { editCategory } from '@/actions/category-actions';
import FormFields from './form-fields';
import { cmsConfig } from '@/config/cms';

export default function EditForm({ category }) {
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: category.id,
      name: category.name,
    },
  });

  async function handleSubmit(data) {
    const addRes = await editCategory(data);
    if (addRes.status === 'success') {
      toast.success('Category updated successfully');
    } else {
      toast.error(addRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return <FormFields mode="edit" form={form} onSubmit={handleSubmit} />
}
