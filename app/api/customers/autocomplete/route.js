import { getCustomerSuggestions } from '@/lib/services/customer-service';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const searchKey = searchParams.get('sk');

  return Response.json({
    message: 'success',
    data: await getCustomerSuggestions(searchKey),
  });
}
