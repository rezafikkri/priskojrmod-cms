import ToggleTheme from '@/components/layout/toggle-theme';
import { SignInForm } from '@/components/signin/signin-form';
import SignInFormSkeleton from '@/components/signin/signin-form-skeleton';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sidebar p-6 md:p-10 relative">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex items-center justify-center">
            <img
              src="https://res.cloudinary.com/priskojrmod/image/upload/q_auto/PriskoJrMod.png"
              alt="Prisko Jr Mod Logo"
              className="size-7"
              width={25}
              height={25}
            />
          </div>
          <span>Prisko Jr Mod</span>
        </div>
        <Suspense fallback={<SignInFormSkeleton />}>
          <SignInForm />
        </Suspense>
      </div>

      <div className="fixed right-10 bottom-10">
        <Button variant="outline" asChild>
          <ToggleTheme className="rounded-lg h-auto text-base px-3 py-1.5 inline-block" />
        </Button>
      </div>
    </div>
  )
}

