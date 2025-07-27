import { getTestimonial } from '@/lib/services/testimonial-service';
import {
  Alert,
  AlertTitle,
} from '../ui/alert';
import Error404 from '../icon/error-404';
import EditForm from './edit-form';

export default async function TestimonialForm({ id }) {
  const testimonial = await getTestimonial(id);

  if (!testimonial) return (
    <Alert className="lg:max-w-2/3">
      <Error404 />
      <AlertTitle>Testimonial not found.</AlertTitle>
    </Alert>
  );

  return <EditForm testimonial={testimonial} />;
}
