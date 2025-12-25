'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { createOwnerSchema } from '@/lib/validators/owner-validator';
import { addOwner } from '@/actions/owner-actions';
import { Button } from '../ui/button';
import { useSession } from 'next-auth/react';

export default function CreateForm() {
  const { data: session } = useSession();
  const form = useForm({
    resolver: zodResolver(createOwnerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      sm_profile_url: '',
      picture: '',
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data) {
    const addRes = await addOwner(data);
    if (addRes.status === 'success') {
      form.reset();
      toast.success('Owner created successfully');
    } else {
      toast.error(addRes.message);
    }
  }

  async function handleFillWithAdminInfo() {
    if (session) {
      form.setValue('first_name', session?.user?.first_name);
      form.setValue('last_name', session?.user?.last_name);
      form.setValue('picture', session?.user?.image);
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

      <FormFields mode="create" form={form} onSubmit={handleSubmit} />
    </>
  );
}
