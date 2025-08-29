import {
  Form,
  FormField,
} from '../ui/form';
import ContentInput from '../ui/content-input';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Language } from '@/constants/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import FormLanguageToggle from '../ui/form-language-toggle';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { createProductContentSchema, editProductContentSchema } from '@/lib/validators/product-validator';
import { useProductFormStore } from '@/lib/providers/product-form-store-provider';
import { contentCustomSchema } from '@/lib/validators/base-validator';
import { version } from 'react-dom';

export default function ContentForm({
  onNextStep,
  onPrevStep,
  mode = 'create'
}) {
  const [activeLang, setActiveLang] = useState(Language.ID);
  const basic = useProductFormStore(state => state.basic);
  const content = useProductFormStore(state => state.content);
  const setContent = useProductFormStore(state => state.setContent);
  let contentSchema;

  let defaultValues = content;
  let setVersionStatus;
  let versionStatus;

  if (mode === 'create') {
    contentSchema = createProductContentSchema;
  } else {
    contentSchema = editProductContentSchema;
    setVersionStatus = useProductFormStore(state => state.setVersionStatus);
    versionStatus = useProductFormStore(state => state.versionStatus);
  }

  const form = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues,
  });
  const errors = form.formState.errors;

  function handleNext(data) {
    // validate changelog in edit mode
    if (mode === 'edit' && basic.version !== basic.dbVersion) {
      const changelogIdResult = contentCustomSchema.safeParse(data.changelog.id);
      const changelogEnResult = contentCustomSchema.safeParse(data.changelog.en);
      let isError = false;

      if (!changelogIdResult.success) {
        form.setError(`changelog.${Language.ID}`, { message: 'Can\'t be empty' });
        isError = true;
      }
      if (!changelogEnResult.success) {
        form.setError(`changelog.${Language.EN}`, { message: 'Can\'t be empty' });
        isError = true;
      }

      if (isError) return;
    }

    setContent(data);
    onNextStep();
  }

  function handlePrev() {
    const data = form.getValues();
    setContent(data);
    onPrevStep();
  }

  useEffect(() => {
    if (mode === 'edit') {
      // If version changed, then set changelog to empty,
      // because changelog must be new when version is new
      if (versionStatus === 'changed') {
        form.setValue('changelog', { id: '', en: '' });
        setVersionStatus('neutralized');
      } else if (versionStatus === 'rollback') {
        form.setValue('changelog', content.dbChangelog);
        setVersionStatus('pristine');
      }
    }
  }, []);

  return (
    <>
      <FormLanguageToggle
        activeLang={activeLang}
        onToggle={setActiveLang}
        errors={errors}
        fieldNames={['description','changelog']}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6 mb-10">
          {activeLang === Language.ID && (
            <>
              <FormField
                control={form.control}
                name={`description.${Language.ID}`}
                render={({ field, formState }) => (
                  <ContentInput
                    field={field}
                    formState={formState}
                    activeLang={Language.ID}
                    label="Description"
                    description="Enter a clear and concise description of the product."
                  />
                )}
              />
              {mode === 'edit' && (
                <FormField
                  control={form.control}
                  name={`changelog.${Language.ID}`}
                  render={({ field, formState }) => (
                    <ContentInput
                      field={field}
                      formState={formState}
                      activeLang={Language.ID}
                      label="Changelog"
                      description="Enter the changes or updates included in this release."
                    />
                  )}
                />
              )}
            </>
          )}
          {activeLang === Language.EN && (
            <>
              <FormField
                control={form.control}
                name={`description.${Language.EN}`}
                render={({ field, formState }) => (
                  <ContentInput
                    field={field}
                    formState={formState}
                    activeLang={Language.EN}
                    label="Description"
                    description="Enter a clear and concise description of the product."
                  />
                )}
              />
              {mode === 'edit' && (
                <FormField
                  control={form.control}
                  name={`changelog.${Language.EN}`}
                  render={({ field, formState }) => (
                    <ContentInput
                      field={field}
                      formState={formState}
                      activeLang={Language.EN}
                      label="Changelog"
                      description="Enter the changes or updates included in this release."
                    />
                  )}
                />
              )}
            </>
          )}

          <Button
            variant="outline"
            className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5"
            onClick={handlePrev}
          >
            <ArrowLeft className="icon" /> Previous
          </Button>

          <Button
            type="submit"
            className={`h-auto text-base px-3 py-1.5 border border-primary inline-block`}
          >
            Next <ArrowRight className="icon" />
          </Button>
        </form>
      </Form>
    </>
  );
}
