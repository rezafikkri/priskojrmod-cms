import { getTestimonials } from '@/lib/services/testimonial-service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import DataTable from './data-table';

export default async function TestimonialsTable() {
  const testimonials = await getTestimonials();

  return (
    <>
      {testimonials.length < 6 && (
        <TooltipWrapper text="Create testimonial">
          <Button asChild variant="outline" className="mb-5 h-auto inline-block text-base px-3 py-1.5">
            <Link href="/testimonial/new"><Plus className="icon" /> Create</Link>
          </Button>
        </TooltipWrapper>
      )}

      <DataTable testimonials={testimonials} />
    </>    
  );
}
