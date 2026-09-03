import {
  Form,
  FormField,
} from '../ui/form';
import ContentInput from '../ui/content-input';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Language } from '@/constants/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  createProductContentSchema,
  editProductContentSchema,
  withChangelogSuperRefine,
} from '@/lib/validators/product-validator';
import { useProductFormStore } from '@/lib/providers/product-form-store-provider';
import { cmsConfig } from '@/config/cms';

export default function ContentForm({
  onNextStep,
  onPrevStep,
  mode = 'create'
}) {
  const [activeLang, setActiveLang] = useState(cmsConfig.defaults.language);
  const basic = useProductFormStore(state => state.form.basic);
  const content = useProductFormStore(state => state.form.content);
  const setContent = useProductFormStore(state => state.setContent);
  let contentSchema;

  let defaultValues = content;
  let setVersionStatus;
  let versionStatus;
  let dbVersion;
  let dbChangelog;

  if (mode === 'create') {
    contentSchema = createProductContentSchema;
  } else {
    dbVersion = useProductFormStore(state => state.reference.dbVersion);
    contentSchema = withChangelogSuperRefine({
      schema: editProductContentSchema,
      version: basic.version,
      dbVersion,
    });
    setVersionStatus = useProductFormStore(state => state.setVersionStatus);
    versionStatus = useProductFormStore(state => state.meta.versionStatus);
    dbChangelog = useProductFormStore(state => state.reference.dbChangelog);
  }

  const form = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues,
  });

  function handleNext(data) {
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
        form.setValue('changelog', dbChangelog);
        setVersionStatus('pristine');
      }
    }
  }, []);

  const shouldShowChangelogInput = 
    mode === 'edit' &&
    (
      content.versionTranslationId ||
      basic.version !== dbVersion
    );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6 mb-10">
          {activeLang === Language.ID && (
            <>
              <FormField
                control={form.control}
                name={`description.${Language.ID}`}
                render={({ field }) => (
                  <ContentInput
                    field={field}
                    activeLang={activeLang}
                    onActivelangChange={setActiveLang}
                    label="Description"
                    description="Enter a clear and concise description of the product."
                  />
                )}
              />
              {shouldShowChangelogInput && (
                <FormField
                  control={form.control}
                  name={`changelog.${Language.ID}`}
                  render={({ field }) => (
                    <ContentInput
                      field={field}
                      activeLang={activeLang}
                      onActivelangChange={setActiveLang}
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
                render={({ field }) => (
                  <ContentInput
                    field={field}
                    activeLang={activeLang}
                    onActivelangChange={setActiveLang}
                    label="Description"
                    description="Enter a clear and concise description of the product."
                  />
                )}
              />
              {shouldShowChangelogInput && (
                <FormField
                  control={form.control}
                  name={`changelog.${Language.EN}`}
                  render={({ field }) => (
                    <ContentInput
                      field={field}
                      activeLang={activeLang}
                      onActivelangChange={setActiveLang}
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
