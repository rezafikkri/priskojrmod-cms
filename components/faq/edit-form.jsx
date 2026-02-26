'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { editFaqSchema } from '@/lib/validators/faq-validator';
import FormFields from './form-fields';
import { editFaq } from '@/actions/faq-actions';
import { toast } from 'sonner';
import { cmsConfig } from '@/config/cms';

export default function EditForm({ faq }) {
  const form = useForm({
    resolver: zodResolver(editFaqSchema),
    defaultValues: {
      id: faq.id,
      translationId: {
        id: faq.translations.id.id,
        en: faq.translations.id.en,
      },
      title: {
        id: faq.translations.title.id,
        en: faq.translations.title.en,
      },
      content: {
        id: faq.translations.content.id,
        en: faq.translations.content.en,
      },
    },
  });

  async function handleSubmit(data) {
    const editRes = await editFaq(data);
    if (editRes.status === 'success') {
      toast.success('FAQ updated successfully.');
    } else {
      toast.error(editRes.message, {
        duration: cmsConfig.toast.duration.error
      });
    }
  }

  return <FormFields mode="edit" form={form} onSubmit={handleSubmit} />;
}
