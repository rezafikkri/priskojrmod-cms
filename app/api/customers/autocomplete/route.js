import { getCustomersForAutocomplete } from "@/lib/services/customer-service";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const searchKey = searchParams.get('sk');

  return Response.json({
    message: 'success',
    data: await getCustomersForAutocomplete(searchKey),
  });
}
