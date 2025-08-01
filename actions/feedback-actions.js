'use server';

import { pullFeedbacks } from '@/lib/services/feedback-service';

export async function loadFeedbacks() {
  try {
    const pulledCount = await pullFeedbacks();
    return { status: 'success', data: pulledCount };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export async function removeFeedbacks(ids) {
  try {
    const updatedCount = await deleteFeedbacks(ids);
    return { status: 'success', data: updatedCount };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
