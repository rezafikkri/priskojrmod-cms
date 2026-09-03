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
import ContentInput from '../ui/content-input';
import { privacyPolicySchema } from '@/lib/validators/privacy-policy-validator';
import { addPrivacyPolicy, editPrivacyPolicy } from '@/actions/privacy-policy-actions';
import { formatDateTime } from '@/lib/format-date';
import { cmsConfig } from '@/config/cms';
import { callAction } from '@/lib/call-action';

export default function EditForm({ privacyPolicy }) {
  const [createdAt, setCreatedAt] = useState(privacyPolicy?.createdAt);
  const [updatedAt, setUpdatedAt] = useState(privacyPolicy?.updatedAt);
  const [hasPrivacyPolicy, setHasPrivacyPolicy] = useState(privacyPolicy !== null);
  // generate form default values
  let defaultValues = {
    content: {
      id: '',
      en: '',
    },
  };
  if (privacyPolicy) {
    defaultValues = {
      id: privacyPolicy.id,
      translationId: {
        id: privacyPolicy.translations.id.id,
        en: privacyPolicy.translations.id.en,
      },
      content: {
        id: privacyPolicy.translations.content.id,
        en: privacyPolicy.translations.content.en,
      },
    };
  }

  const form = useForm({
    resolver: zodResolver(privacyPolicySchema),
    defaultValues,
  });

  const [activeLang, setActiveLang] = useState(cmsConfig.defaults.language);
  const { isSubmitting } = form.formState;

  async function handleSubmit(data) {
    const saveRes = hasPrivacyPolicy
      ? await callAction(() => editPrivacyPolicy(data))
      : await callAction(() => addPrivacyPolicy(data));

    if (saveRes.status === 'success') {
      let successMessage;
      if (hasPrivacyPolicy) {
        successMessage = 'Privacy policy updated successfully.';
        setUpdatedAt(saveRes.data.updatedAt);
      } else {
        successMessage = 'Privacy policy created successfully.';

        // set id to form
        form.register('id');
        form.register('translationId.id');
        form.register('translationId.en');
        form.setValue('id', saveRes.data.id);
        form.setValue('translationId.id', saveRes.data.translations.id.id);
        form.setValue('translationId.en', saveRes.data.translations.id.en);

        setCreatedAt(saveRes.data.createdAt);
        setUpdatedAt(saveRes.data.updatedAt);
        setHasPrivacyPolicy(true);
      }

      toast.success(successMessage);
    } else {
      toast.error(saveRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mb-10">
        {activeLang === Language.ID && (
          <FormField
            control={form.control}
            name={`content.${Language.ID}`}
            render={({ field }) => (
              <ContentInput
                field={field}
                activeLang={activeLang}
                onActivelangChange={setActiveLang}
                description="Enter privacy policy content"
                disabled={isSubmitting}
              />
            )}
          />
        )}
        {activeLang === Language.EN && (
          <FormField
            control={form.control}
            name={`content.${Language.EN}`}
            render={({ field }) => (
              <ContentInput
                field={field}
                activeLang={activeLang}
                onActivelangChange={setActiveLang}
                description="Enter privacy policy content"
                disabled={isSubmitting}
              />
            )}
          />
        )}

        {hasPrivacyPolicy && (
          <p className="text-sm text-zinc-600 [&_span]:block space-y-2.5">
            <span>Created on: {formatDateTime(createdAt)}</span>
            <span>Last updated: {formatDateTime(updatedAt)}</span>
          </p>
        )}

        <div className="relative inline-flex">
          <Button
            type="submit"
            className={`disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
            disabled={isSubmitting}
          >
            <span className={isSubmitting ? 'opacity-0' : ''}>
              {hasPrivacyPolicy ? 'Update' : 'Create'}
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
  );
}
