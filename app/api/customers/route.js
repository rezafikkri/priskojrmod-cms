import { countCustomers, getCustomers } from '@/lib/services/customer-service';
import { cmsConfig } from '@/config/cms';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const pageIndex = parseInt(searchParams.get('pi'));
  const searchKey = searchParams.get('sk');
  // params for filters
  const filters = { showBanned: searchParams.get('sb') };

  try {
    let dataResponse;

    if (searchKey) filters.searchKey = searchKey; 

    const customers = await getCustomers({
      pageIndex,
      pageSize: cmsConfig.pagination.pageSize,
      filters,
    });
    const numberCustomers = await countCustomers(filters);
    dataResponse = {
      items: customers,
      rowCount: numberCustomers,
    };

    return Response.json({
      message: 'success',
      data: dataResponse,
    });
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, { status: 500 });
  }
}
