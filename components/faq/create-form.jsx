'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRef } from 'react';
import { createFaqSchema } from '@/lib/validators/faq-validator';
import { addFaq } from '@/actions/faq-actions';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { cmsConfig } from '@/config/cms';

export default function CreateForm() {
  const form = useForm({
    resolver: zodResolver(createFaqSchema),
    defaultValues: {
      title: {
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
    const addRes = await addFaq(data);
    if (addRes.status === 'success') {
      isResetEditor.current = true;
      form.reset();
      toast.success('FAQ created successfully');
    } else {
      toast.error(addRes.message, {
        duration: cmsConfig.toast.duration.error
      });
    }
  }

  return <FormFields mode="create" form={form} onSubmit={handleSubmit} isResetEditor={isResetEditor} />;
}
