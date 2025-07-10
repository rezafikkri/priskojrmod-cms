'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { editOwnerSchema } from '@/lib/validators/owner-validator';
import { editOwner } from '@/actions/owner-actions';

export default function EditForm({ owner }) {
  const form = useForm({
    resolver: zodResolver(editOwnerSchema),
    defaultValues: {
      id: owner.id,
      first_name: owner.first_name,
      last_name: owner.last_name,
      sm_username: owner.sm_username,
      picture: owner.picture,
    },
  });

  async function handleSubmit(data) {
    const editRes = await editOwner(data);
    if (editRes.status === 'success') {
      toast.success('Owner updated successfully.');
    } else {
      toast.error(editRes.message);
    }
  }

  return <FormFields mode="edit" form={form} onSubmit={handleSubmit} />
}
