'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { cmsConfig } from '@/config/cms';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      let errorMessage = 'Something went wrong during sign in. Please try again later.';
      if (error === 'AccountNotFound') {
        errorMessage = 'Your account is not registered';
      } else if (error === 'UnableToSignIn') {
        errorMessage = 'Sign in was unsuccessful. Please try again or use a different account.';
      }

      requestAnimationFrame(() => {
        toast.error(errorMessage, {
          duration: cmsConfig.toast.duration.error,
          onDismiss: () => router.replace('/signin'),
          onAutoClose: () => router.replace('/signin'),
        });
      });
    }
  }, [error]);

  return (
    <Card className="border-0">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-base">
          Sign in with your Google account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full text-base h-auto text-base px-3 py-1.5 gap-1.5"
          onClick={() => signIn('google')}
        >
          <img src="https://res.cloudinary.com/priskojrmod/image/upload/q_auto/google-g.png" alt="Google logo" width={16} height={16} />
          <span> Sign in with Google</span>
        </Button>
      </CardContent>
    </Card>
  )
}
