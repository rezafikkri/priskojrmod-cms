import { countTransactions, getTransactions, searchTransactions } from '@/lib/services/transaction-service';
import { cmsConfig } from '@/config/cms';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const pageIndex = parseInt(searchParams.get('pi'));
  const searchKey = searchParams.get('sk');
  // params for filters
  const transactionStatus = searchParams.get('ts');

  let filters;
  if (transactionStatus) {
    filters = { status: transactionStatus };
  }

  try {
    let dataResponse;

    if (searchKey) {
      const transactions = await searchTransactions({
        key: searchKey,
        limit: cmsConfig.search.limit,
        filters,
      });
      dataResponse = {
        items: transactions,
      };

      if (transactions.length > cmsConfig.search.limit) {
        transactions.pop();
        dataResponse.isTooMany = true;
      } else {
        dataResponse.isTooMany = false;
      }
    } else {
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
