'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FormFields from './form-fields';
import { createOwnerSchema } from '@/lib/validators/owner-validator';
import { addOwner } from '@/actions/owner-actions';
import { Button } from '../ui/button';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function CreateForm() {
  const [isLoadingAdminInfo, setIsLoadingAdminInfo] = useState(false);
  const form = useForm({
    resolver: zodResolver(createOwnerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      sm_username: '',
      picture: '',
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data) {
    const addRes = await addOwner(data);
    if (addRes.status === 'success') {
      form.reset();
      toast.success('Owner created successfully.');
    } else {
      toast.error(addRes.message);
    }
  }

  async function handleFillWithAdminInfo() {
    setIsLoadingAdminInfo(true);

    try {
      const res = await fetch('/api/admins/me');
      if (!res.ok) {
        throw new Error('Failed to load admin info.');
      }

      const admin = await res.json();
      form.setValue('first_name', admin.data.first_name);
      form.setValue('last_name', admin.data.last_name);
      form.setValue('picture', admin.data.picture);

      toast.success('Got your admin info! Now just enter your social media username.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoadingAdminInfo(false);
    } 
  }

  return (
    <>
      <div className="relative inline-block mb-2">
        <Button
          variant="outline"
          className={`h-auto text-base px-3 py-1.5 ${isLoadingAdminInfo ? 'disabled:opacity-100 transition-none' : ''}`}
          onClick={handleFillWithAdminInfo}
          disabled={isLoadingAdminInfo || isSubmitting}
        >
          <span className={isLoadingAdminInfo ? 'opacity-0' : ''}>Use My Admin Info</span>
        </Button>
        {isLoadingAdminInfo && (
          <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
            <Loader2 className="animate-spin" size={16} />
          </div>
        )}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Click to use your admin profile (name and picture) as the owner data.</p>

      <FormFields mode="create" form={form} onSubmit={handleSubmit} />
    </>
  );
}
