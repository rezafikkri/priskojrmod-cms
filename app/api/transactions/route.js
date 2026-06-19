import { countTransactions, getTransactions } from '@/lib/services/transaction-service';
import { cmsConfig } from '@/config/cms';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const pageIndex = parseInt(searchParams.get('pi'));

  const filters = {
    status: searchParams.get('ts'),
    searchKey: searchParams.get('sk'),
  };

  try {
    let dataResponse;

    const transactions = await getTransactions({
      pageIndex,
      pageSize: cmsConfig.pagination.pageSize,
      filters,
    });
    const numberTransactions = await countTransactions(filters);
    dataResponse = {
      items: transactions,
      rowCount: numberTransactions,
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
