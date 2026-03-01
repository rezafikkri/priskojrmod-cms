import { getCustomerSuggestions } from '@/lib/services/customer-service';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const searchKey = searchParams.get('sk');

  try {
    return Response.json({
      message: 'success',
      data: await getCustomerSuggestions(searchKey),
    });
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, { status: 500 });
  }
}
