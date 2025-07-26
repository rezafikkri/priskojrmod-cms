import CreateForm from '@/components/testimonial/create-form';

export const metadata = {
  title: 'Create Testimonial',
};

export default function TestimonialCreatePage() {
  return (
    <section className="lg:max-w-2/3">
      <h1 className="text-2xl mb-7 font-bold">Create Testimonial</h1>
      <CreateForm />
    </section>
  );
}
