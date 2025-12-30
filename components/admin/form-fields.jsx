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
import { Loader2, ArrowLeft, Trash } from 'lucide-react';
import Link from 'next/link';
import PhoneNumberFields from '../ui/phone-number-fields';
import FormImagePreview from '../ui/form-image-preview';

export default function FormFields({
  mode,
  form,
  onSubmit,
  donations,
}) {
  const {
    donationLinks,
    onDeleteDonationLink,
    deletingDonationLinkIds,
  } = donations ?? {};
  const isSubmitting = form.formState.isSubmitting;
  const hasDeletingDonationLinks = deletingDonationLinkIds?.length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-10">
        {mode === 'create' ? (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Email</FormLabel>
                <FormControl>
                  <Input type="email" disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormDescription>Enter a valid email address</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormItem>
            <FormLabel className="text-base">Email</FormLabel>
            <p>{form.getValues('email')}</p>
          </FormItem>
        )}

        <FormItem>
          <FormLabel className="text-base">Role</FormLabel>
          <p className="capitalize">{form.getValues('role')}</p>
          {mode === 'create' && (
            <FormDescription>A new admin will automatically be assigned the staff role.</FormDescription>
          )}
        </FormItem>

        <div className="flex gap-3 items-start">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base">First name</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-base">Last name</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="picture"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-base">Profile picture</FormLabel>
              <FormImagePreview src={field.value} />
              <FormControl>
                <Input disabled={isSubmitting} {...field} className="shadow-none md:text-base h-auto px-3 py-1.5" />
              </FormControl>
              <FormDescription>Enter the URL of the picture</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <PhoneNumberFields
          form={form}
          name="whatsapp_phone_number"
          label="WhatsApp Phone Number"
          description="Enter a reachable WhatsApp phone number"
        />

        <div className="space-y-5.5 my-8">
          <h3 className="text-lg font-bold mb-0">Donation Links</h3>
          <h2 className="text-zinc-700 dark:text-zinc-300/80">Donation links are used for free products and replace the Buy button on the product details page.</h2>

          {donationLinks.map((dl, index) => {
            const isDeleting = deletingDonationLinkIds?.includes(dl.dbId);
            return (
              <FormField
                key={dl.id}
                control={form.control}
                name={`donation_links.${index}.url`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-base">{dl.currency_code} donation link</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          {...field}
                          className="shadow-none md:text-base h-auto px-3 py-1.5"
                        />
                      </FormControl>
                      {(mode !== 'create' && dl.dbId) && (
                        <div className="relative inline-block">
                          <Button
                            type="button"
                            variant="secondary"
                            className={`hover:text-destructive dark:hover:text-red-500/90 ${isSubmitting ? '' : 'disabled:opacity-100'}`}
                            onClick={() => onDeleteDonationLink(dl.dbId)}
                            disabled={isSubmitting || isDeleting}
                          >
                            <Trash
                              className={isDeleting ? 'opacity-0' : ''}
                            />
                          </Button>
                          {isDeleting &&
                            <div
                              className="absolute h-full top-0 left-0 right-0 flex justify-center items-center"
                            >
                              <Loader2 className="animate-spin" size={16} />
                            </div>
                          }
                        </div>
                      )}
                    </div>
                    <FormDescription>Enter the donation URL for {dl.currency_code}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />           
            );
          })}
        </div>

        {mode !== 'profile' && (
          <Button asChild variant="outline" className="me-3 mb-0 h-auto inline-block text-base px-3 py-1.5">
            <Link href="/admin"><ArrowLeft className="icon" /> Back</Link>
          </Button>
        )}
        <div className="relative inline-block">
          <Button
            type="submit"
            className={`${hasDeletingDonationLinks ? '' : 'disabled:opacity-100'} ${isSubmitting ? 'transition-none' : ''} h-auto text-base px-3 py-1.5 border border-primary`}
            disabled={isSubmitting || hasDeletingDonationLinks}
          >
            <span className={isSubmitting ? 'opacity-0' : ''}>
              {mode === 'create' ? 'Create' : 'Update'}
            </span>
          </Button>
          {isSubmitting && (
            <div className="absolute h-full top-0 left-0 right-0 flex justify-center items-center">
              <Loader2 className="animate-spin text-primary-foreground" size={16} />
            </div>
          )}
        </div>
      </form>
    </Form>
  );

}
