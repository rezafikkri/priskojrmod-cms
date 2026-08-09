'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { editOwnerSchema } from '@/lib/validators/owner-validator';
import { editOwner } from '@/actions/owner-actions';
import { cmsConfig } from '@/config/cms';
import { callAction } from '@/lib/call-action';

export default function EditForm({ owner }) {
  const form = useForm({
    resolver: zodResolver(editOwnerSchema),
    defaultValues: {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      smProfileUrl: owner.smProfileUrl,
      picture: owner.picture,
    },
  });

  async function handleSubmit(data) {
    const editRes = await callAction(() => editOwner(data));
    if (editRes.status === 'success') {
      toast.success('Owner updated successfully.');
    } else {
      toast.error(editRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return <FormFields mode="edit" form={form} onSubmit={handleSubmit} />
}
