import { countCustomers, getCustomers } from '@/lib/services/customer-service';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const pageIndex = parseInt(searchParams.get('pi'));
  // params for filters
  const filters = { is_banned: searchParams.get('ib') === 'false' ? false : true };

  const customers = await getCustomers({
    pageIndex,
    pageSize: parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE),
    filters,
  });
  const numberCustomers = await countCustomers(filters);

  return Response.json({
    message: 'success',
    data: {
      customers,
      rowCount: numberCustomers,
    },
  });
}
