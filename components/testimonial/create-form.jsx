'use client';

import FormFields from './form-fields';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTestimonialSchema } from '@/lib/validators/testimonial-validator';
import { useRef } from 'react';
import { addTestimonial } from '@/actions/testimonial-actions';
import { toast } from 'sonner';
import { cmsConfig } from '@/config/cms';

export default function CreateForm() {
  const form = useForm({
    resolver: zodResolver(createTestimonialSchema),
    defaultValues: {
      name: '',
      smProfileUrl: '',
      picture: '',
      message: {
        id: '',
        en: '',
      },
    },
  });

  const isResetEditor = useRef(false);

  async function handleSubmit(data) {
    const addRes = await addTestimonial(data);
    if (addRes.status === 'success') {
      isResetEditor.current = true;
      form.reset();
      toast.success('Testimonial created successfully');
    } else {
      toast.error(addRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return <FormFields mode="create" form={form} onSubmit={handleSubmit} isResetEditor={isResetEditor} />;
}
