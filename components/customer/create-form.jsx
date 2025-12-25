'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { createCustomerSchema } from '@/lib/validators/customer-validator';
import { addCustomer } from '@/actions/customer-actions';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateForm() {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      picture: '',
    },
  });

  async function handleSubmit(data) {
    const addRes = await addCustomer(data);
    if (addRes.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customersSearch'] });
      form.reset();
      toast.success('Customer created successfully');
    } else {
      toast.error(addRes.message);
    }
  }
  
  return <FormFields mode="create" form={form} onSubmit={handleSubmit} />;
}
