import { getTestimonial } from '@/lib/services/testimonial-service';
import EditForm from './edit-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function TestimonialForm({ id }) {
  const testimonial = await getTestimonial(id);

  if (!testimonial) return <NotFoundAlert message="Testimonial not found" />;

  return <EditForm testimonial={testimonial} />;
}
