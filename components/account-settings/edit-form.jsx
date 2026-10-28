'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { editAccount } from '@/actions/account-settings-action';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import FormFields from '../admin/form-fields';
import { accountSettingsSchema } from '@/lib/validators/account-settings-validator';
import { cmsConfig } from '@/config/cms';
import { callAction } from '@/lib/call-action';

export function EditForm({
  account,
}) {
  const { data: session , update: updateSession } = useSession();
  const form = useForm({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      role: account.role,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      whatsappPhoneNumber: account.whatsappPhoneNumber,
      picture: account.picture,
    },
  });

  async function handleSubmit(data) {
    const editRes = await callAction(() => editAccount(data));
    if (editRes.status === 'success') {
      // update several session data
      if (
        session?.user?.firstName !== data.firstName ||
        session?.user?.lastName !== data.lastName ||
        session?.user?.image !== data.picture
      ) {
        await updateSession({
          firstName: data.firstName,
          lastName: data.lastName,
          picture: data.picture,
        });
      }

      toast.success('Account settings updated successfully.');
    } else {
      toast.error(editRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return <FormFields mode="profile" form={form} onSubmit={handleSubmit} />;
}
