import { countCustomers, getCustomers, searchCustomers } from '@/lib/services/customer-service';
import { cmsConfig } from '@/config/cms';

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
    picture: true,
    email: true,
    last_active: true,
    created_at: true,
    updated_at: true,
  };

  try {
    let dataResponse;

    if (searchKey) {
      const customers = await searchCustomers({
        select,
        key: searchKey,
        limit: cmsConfig.search.limit,
        filters,
      });
      dataResponse = {
        items: customers,
      };

      if (customers.length > cmsConfig.search.limit) {
        customers.pop();
        dataResponse.isTooMany = true;
      } else {
        dataResponse.isTooMany = false;
      }
    } else {
      const customers = await getCustomers({
        select,
        pageIndex,
        pageSize: cmsConfig.pagination.pageSize,
        filters,
      });
      const numberCustomers = await countCustomers(filters);
      dataResponse = {
        items: customers,
        rowCount: numberCustomers,
      };
    }

    return Response.json({
      message: 'success',
      data: dataResponse,
    });
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, 500);
  }
}
