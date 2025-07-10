'use client';

import { toast } from 'sonner';
import { Language } from '@/constants/enums';
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
import { formatDateTimeWIB } from '@/lib/format-date';
import { addTermsOfService, editTermsOfService } from '@/actions/terms-of-service-actions';
import { termsOfServiceSchema } from '@/lib/validators/terms-of-service-validator';

export default function EditForm({ termsOfService }) {
  const [createdAt, setCreatedAt] = useState(termsOfService?.created_at);
  const [updatedAt, setUpdatedAt] = useState(termsOfService?.updated_at);
  const [hasTermsOfService, setHasTermsOfService] = useState(termsOfService !== null);
  // generate form default values
  let defaultValues = {
    content: {
      id: '',
      en: '',
    },
  };
  if (termsOfService) {
    defaultValues = {
      id: termsOfService.id,
      translationId: {
        id: termsOfService.translations.id.id,
        en: termsOfService.translations.id.en,
      },
      content: {
        id: termsOfService.translations.content.id,
        en: termsOfService.translations.content.en,
      },
    };
  }

  const form = useForm({
    resolver: zodResolver(termsOfServiceSchema),
    defaultValues,
  });

  const [activeLang, setActiveLang] = useState(Language.ID);
  const { isSubmitting, errors } = form.formState;

  async function handleSubmit(data) {
    const saveRes = hasTermsOfService
      ? await editTermsOfService(data)
      : await addTermsOfService(data);

    if (saveRes.status === 'success') {
      let successMessage;
      if (hasTermsOfService) {
        successMessage = 'Terms of Service updated successfully.';
        setUpdatedAt(saveRes.data.updated_at);
      } else {
        successMessage = 'Terms of Service created successfully.';

        // set id to form
        form.register('id');
        form.register('translationId.id');
        form.register('translationId.en');
        form.setValue('id', saveRes.data.id);
        form.setValue('translationId.id', saveRes.data.translations.id.id);
        form.setValue('translationId.en', saveRes.data.translations.id.en);

        setCreatedAt(saveRes.data.created_at);
        setUpdatedAt(saveRes.data.updated_at);
        setHasTermsOfService(true);
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
                  description="Enter term of service content."
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
                  description="Enter term of service content."
                />
              )}
            />
          )}

          {hasTermsOfService && (
            <p className="text-sm text-zinc-600 [&_span]:block space-y-2.5">
              <span>Created on: {formatDateTimeWIB(createdAt)}</span>
              <span>Last updated: {formatDateTimeWIB(updatedAt)}</span>
            </p>
          )}

          <div className="relative inline-flex">
            <Button
              type="submit"
              className={`disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
              disabled={isSubmitting}
            >
              <span className={isSubmitting ? 'opacity-0' : ''}>
                {hasTermsOfService ? 'Update' : 'Create'}
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
