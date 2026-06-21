import { countTransactions, getTransactions } from '@/lib/services/transaction-service';
import { cmsConfig } from '@/config/cms';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const pageIndex = parseInt(searchParams.get('pi'));
  const searchKey = searchParams.get('sk');
  const transactionStatus = searchParams.get('ts');

  let filters;
  if (transactionStatus) {
    filters = { status: transactionStatus }
  }

  if (searchKey) {
    filters = { searchKey, ...filters };
  }

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
