'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { createOwnerSchema } from '@/lib/validators/owner-validator';
import { addOwner } from '@/actions/owner-actions';
import { Button } from '../ui/button';
import { useSession } from 'next-auth/react';
import { cmsConfig } from '@/config/cms';
import { callAction } from '@/lib/call-action';
import { CurrencyCode } from '@/constants/enums';

export default function CreateForm() { 
  const { data: session } = useSession();
  const form = useForm({
    resolver: zodResolver(createOwnerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      smProfileUrl: '',
      picture: '',
      donationLinks: [
        { url: '', currencyCode: CurrencyCode.IDR },
        { url: '', currencyCode: CurrencyCode.USD },
      ],
    },
  });
  const isSubmitting = form.formState.isSubmitting;
  
  const { fields: donationLinks } = useFieldArray({
    control: form.control,
    name: 'donationLinks',
  });


  async function handleSubmit(data) {
    const addRes = await callAction(() => addOwner(data));
    if (addRes.status === 'success') {
      form.reset();
      toast.success('Owner created successfully.');
    } else {
      toast.error(addRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  async function handleFillWithAdminInfo() {
    if (session) {
      form.setValue('firstName', session?.user?.firstName);
      form.setValue('lastName', session?.user?.lastName);
      form.setValue('picture', session?.user?.image);

      form.trigger(['firstName', 'lastName', 'picture']);
    }
  }

  return (
    <>
      <div className="relative inline-block mb-2">
        <Button
          variant="outline"
          className="h-auto text-base px-3 py-1.5"
          onClick={handleFillWithAdminInfo}
          disabled={isSubmitting}
        >
          Use my admin info
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Click to use your admin profile (name and picture) as the owner data.</p>

      <FormFields
        mode="create"
        form={form}
        onSubmit={handleSubmit}
        donations={{
          donationLinks,
        }}
      />
    </>
  );
}
