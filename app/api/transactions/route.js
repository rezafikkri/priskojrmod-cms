import { countTransactions, getTransactions, searchTransactions } from "@/lib/services/transaction-service";

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

  const select = {
    id: true,
    code: true,
    status: true,
    total_amount: true,
    currency_code: true,
    customer_email: true,
    created_at: true,
    updated_at: true,
    invoices: {
      select: {
        invoice_number: true,
      },
      take: 1,
      orderBy: { issued_at: 'desc' },
    },
  };

  try {
    let dataResponse;

    if (searchKey) {
      const transactions = await searchTransactions({
        select,
        key: searchKey,
        limit: parseInt(process.env.SEARCH_LIMIT),
        filters,
      });
      dataResponse = {
        items: transactions,
      };

      if (transactions.length > process.env.SEARCH_LIMIT) {
        transactions.pop();
        dataResponse.isTooMany = true;
      } else {
        dataResponse.isTooMany = false;
      }
    } else {
      const transactions = await getTransactions({
        select,
        pageIndex,
        pageSize: parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE),
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
