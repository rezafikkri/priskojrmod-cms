'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { editAdminSchema } from '@/lib/validators/admin-validator';
import FormFields from './form-fields';
import { editAdmin } from '@/actions/admin-actions';
import { cmsConfig } from '@/config/cms';
import { useQueryClient } from '@tanstack/react-query';
import { callAction } from '@/lib/call-action';

export default function EditForm({ admin }) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      whatsappPhoneNumber: admin.whatsappPhoneNumber,
      picture: admin.picture,
      role: admin.role,
    },
  });

  async function handleSubmit(data) {
    const editRes = await callAction(() => editAdmin(data));
    if (editRes.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['adminOptions'] });

      toast.success('Admin updated successfully.');
    } else {
      toast.error(res.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return <FormFields mode="edit" form={form} onSubmit={handleSubmit} />;
}

