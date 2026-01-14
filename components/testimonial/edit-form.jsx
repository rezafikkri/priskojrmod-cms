'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { editTestimonialSchema } from '@/lib/validators/testimonial-validator';
import FormFields from './form-fields';
import { editTestimonial } from '@/actions/testimonial-actions';
import { toast } from 'sonner';
import { cmsConfig } from '@/config/cms';

export default function EditForm({ testimonial }) {
  const form = useForm({
    resolver: zodResolver(editTestimonialSchema),
    defaultValues: {
      id: testimonial.id,
      translationId: {
        id: testimonial.translations.id.id,
        en: testimonial.translations.id.en,
      },
      name: testimonial.name,
      smProfileUrl: testimonial.smProfileUrl,
      picture: testimonial.picture,
      message: {
        id: testimonial.translations.message.id,
        en: testimonial.translations.message.en,
      },
    },
  });

  async function handleSubmit(data) {
    const editRes = await editTestimonial(data);
    if (editRes.status === 'success') {
      toast.success('Testimonial updated successfully');
    } else {
      toast.error(editRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return <FormFields mode="edit" form={form} onSubmit={handleSubmit} />;
}
