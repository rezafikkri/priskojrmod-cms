import { getFeedbacks } from "@/lib/services/feedback-service";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  // params for filters
  const readStatus = searchParams.get('rs');

  let filters;
  if (readStatus) {
    filters = { is_read: readStatus === 'unread' ? false : true }
  }

  try {
    const feedbacks = await getFeedbacks(filters);
    return Response.json({
      status: 'success',
      data: {
        items: feedbacks,
      },
    });
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, 500);
  }
}
