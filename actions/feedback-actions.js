'use server';

import { pullFeedbacks } from '@/lib/services/feedback-service';

export async function loadFeedbacks() {
  try {
    await pullFeedbacks();
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
