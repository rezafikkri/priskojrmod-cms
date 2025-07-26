'use server';

import { createTestimonial } from '@/lib/services/testimonial-service';

export async function addTestimonial(data) {
  try {
    await createTestimonial(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
