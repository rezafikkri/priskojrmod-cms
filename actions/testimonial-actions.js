'use server';

import { createTestimonial, updateTestimonial } from '@/lib/services/testimonial-service';

export async function addTestimonial(data) {
  try {
    await createTestimonial(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function editTestimonial(data) {
  try {
    await updateTestimonial(data);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
