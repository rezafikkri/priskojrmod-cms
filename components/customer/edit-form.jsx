'use client';

import FormFields from './form-fields';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { editCustomerSchema } from '@/lib/validators/customer-validator';
import { editCustomer } from '@/actions/customer-actions';
import { useQueryClient } from '@tanstack/react-query';
import { cmsConfig } from '@/config/cms';

export default function EditForm({ customer }) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(editCustomerSchema),
    defaultValues: {
      id: customer.id,
      is_banned: customer.is_banned,
      email: customer.email,
      phone_number: customer.phone_number,
      first_name: customer.first_name,
      last_name: customer.last_name,
      picture: customer.picture ?? '',
    },
  });

  async function handleSubmit(data) {
    const newCustomer = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      picture: data.picture,
    };
    if (customer.is_banned) {
      newCustomer.email = data.email;
    }

    const editRes = await editCustomer(newCustomer);
    if (editRes.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customersSearch'] });
      toast.success('Customer updated successfully');
    } else {
      toast.error(editRes.message, { duration: cmsConfig.toast.duration.error });
    }
  }

  return <FormFields mode="edit" form={form} onSubmit={handleSubmit} />;
}
