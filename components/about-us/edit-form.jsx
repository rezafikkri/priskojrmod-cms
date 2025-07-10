'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
} from '../ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import FormLanguageToggle from '../ui/form-language-toggle';
import ContentInput from '../ui/content-input';
import { aboutUsSchema } from '@/lib/validators/about-us-validator';
import { addAboutUs, editAboutUs } from '@/actions/about-us-actions';
import { toast } from 'sonner';
import { Language } from '@/constants/enums';

export default function EditForm({ aboutUs }) {
  const [hasAboutUs, setHasAboutUs] = useState(aboutUs !== null);
  // generate form default values
  let defaultValues = {
    content: {
      id: '',
      en: '',
    },
  };
  if (aboutUs) {
    defaultValues = {
      id: aboutUs.id,
      translationId: {
        id: aboutUs.translations.id.id,
        en: aboutUs.translations.id.en,
      },
      content: {
        id: aboutUs.translations.content.id,
        en: aboutUs.translations.content.en,
      },
    };
  }

  const form = useForm({
    resolver: zodResolver(aboutUsSchema),
    defaultValues,
  });

  const [activeLang, setActiveLang] = useState(Language.ID);
  const { isSubmitting, errors } = form.formState;

  async function handleSubmit(data) {
    const saveRes = hasAboutUs
      ? await editAboutUs(data)
      : await addAboutUs(data);

    if (saveRes.status === 'success') {
      let successMessage;
      if (hasAboutUs) {
        successMessage = 'About Us updated successfully.';
      } else {
        successMessage = 'About Us created successfully.';

        // set id to form
        form.register('id');
        form.register('translationId.id');
        form.register('translationId.en');
        form.setValue('id', saveRes.data.id);
        form.setValue('translationId.id', saveRes.data.translations.id.id);
        form.setValue('translationId.en', saveRes.data.translations.id.en);
        
        setHasAboutUs(true);
      }

      toast.success(successMessage);
    } else {
      toast.error(saveRes.message);
    }
  }

  return (
    <>
      <FormLanguageToggle activeLang={activeLang} onToggle={setActiveLang} errors={errors} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 lg:max-w-2/3 mb-10">
          {activeLang === Language.ID && (
            <FormField
              control={form.control}
              name={`content.${Language.ID}`}
              render={({ field, formState }) => (
                <ContentInput
                  field={field}
                  formState={formState}
                  activeLang={Language.ID}
                  description="Enter about us content."
                />
              )}
            />
          )}
          {activeLang === Language.EN && (
            <FormField
              control={form.control}
              name={`content.${Language.EN}`}
              render={({ field, formState }) => (
                <ContentInput
                  field={field}
                  formState={formState}
                  activeLang={Language.EN}
                  description="Enter about us content."
                />
              )}
            />
          )}

          <div className="relative inline-flex">
            <Button
              type="submit"
              className={`disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
              disabled={isSubmitting}
            >
              <span className={isSubmitting ? 'opacity-0' : ''}>
                {hasAboutUs ? 'Update' : 'Create'}
              </span>
            </Button>
            {isSubmitting && 
              <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
                <Loader2 className="animate-spin text-primary-foreground" size={16} />
              </div>
            }
          </div>
        </form>
      </Form>
    </>
  );
}
