import { countCustomers, getCustomers, searchCustomers } from '@/lib/services/customer-service';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const pageIndex = parseInt(searchParams.get('pi'));
  const searchKey = searchParams.get('sk');
  // params for filters
  const filters = { is_banned: searchParams.get('ib') === 'false' ? false : true };
  const select = {
    id: true,
    oauth_id: true,
    is_banned: true,
    first_name: true,
    last_name: true,
    email: true,
    last_active: true,
    created_at: true,
    updated_at: true,
  };
  let dataResponse;

  if (searchKey) {
    const customers = await searchCustomers({
      select,
      key: searchKey,
      limit: parseInt(process.env.SEARCH_LIMIT),
      filters,
    });
    dataResponse = {
      customers,
    };

    if (customers.length > process.env.SEARCH_LIMIT) {
      customers.pop();
      dataResponse.isTooMany = true;
    } else {
      dataResponse.isTooMany = false;
    }
  } else {
    const customers = await getCustomers({
      select,
      pageIndex,
      pageSize: parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE),
      filters,
    });
    const numberCustomers = await countCustomers(filters);
    dataResponse = {
      customers,
      rowCount: numberCustomers,
    };
  }

  return Response.json({
    message: 'success',
    data: dataResponse,
  });
}
