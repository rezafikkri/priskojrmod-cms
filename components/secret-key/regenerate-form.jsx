'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import random32Bytes from '@/actions/random-32-bytes-actions';
import { regenerateSecretKeySchema } from '@/lib/validators/secret-key-validator';
import { toast } from 'sonner';
import { applyRegeneratedSecretKey } from '@/actions/secret-key-actions';

export default function RegenerateForm({ secretKey }) {
  const [oldKey, setOldKey] = useState(secretKey.key);
  const form = useForm({
    resolver: zodResolver(regenerateSecretKeySchema),
    defaultValues: {
      id: secretKey.id,
      key: '',
    },
  });
  const isSubmitting = form.formState.isSubmitting;
  const [loadingKey, setLoadingKey] = useState(false);

  async function handleSubmit(data) {
    const applyRes = await applyRegeneratedSecretKey(data);
    form.reset();
    if (applyRes.status === 'success') {
      setOldKey(applyRes.data.key);
      toast.success('Secret key regenerated successfully');
    } else {
      toast.error(applyRes.message);
    }
  }

  async function handleGenerateKey() {
    setLoadingKey(true);
  
    const keyRes = await random32Bytes();
    form.setValue('key', keyRes.random);
    form.clearErrors('key');

    setLoadingKey(false);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mb-10">
          <FormItem>
            <FormLabel className="text-base">Product</FormLabel>
            <p>{secretKey.app_name}</p>
          </FormItem>

          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Secret key</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Old key: <span className="font-mono">{oldKey}</span>
                </p>
                <div className="flex w-full items-center">
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      className="md:text-base h-auto px-3 py-1.5 -me-[1px] shadow-none rounded-e-none z-3 relativ"
                      {...field}
                    />
                  </FormControl>
                  <div className="relative">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handleGenerateKey}
                      className={`h-auto text-base px-3 py-1.5 border rounded-s-none ${loadingKey ? 'disabled:opacity-100 transition-none' : ''}`}
                      disabled={loadingKey || isSubmitting}
                    >
                      <span className={loadingKey ? 'opacity-0' : ''}>Generate</span>
                    </Button>
                    {loadingKey && (
                      <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
                        <Loader2 className="animate-spin" size={16} />
                      </div>
                    )}
                  </div>
                </div>
                <FormDescription>Enter a secret key or click the Generate button to create one.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button asChild variant="outline" className="me-3 mb-0 h-auto text-base px-3 py-1.5 inline-block">
            <Link href="/secret-key"><ArrowLeft className="icon" /> Back</Link>
          </Button>
          <div className="relative inline-block">
            <Button
              type="submit"
              className={`h-auto text-base px-3 py-1.5 disabled:opacity-100 ${isSubmitting ? 'transition-none' : ''} border border-primary`}
              disabled={isSubmitting}
            >
              <span className={isSubmitting ? 'opacity-0' : ''}>Save</span>
            </Button>
            {isSubmitting && (
              <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
                <Loader2 className="animate-spin text-primary-foreground" size={16} />
              </div>
            )}
          </div>
        </form>
      </Form>
    </>
  );
}
