import { generateTransactionExport } from '@/lib/services/transaction-service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const currencyCode = searchParams.get('cc');
  const transactionStatus = searchParams.get('ts');
  const searchKey = searchParams.get('sk');

  try {
    const stream = await generateTransactionExport({
      transactionStatus,
      currencyCode,
      searchKey,
    });
    const dateTime = dayjs.utc().format('YYYYMMDD-HHmmss[Z]');

    const fileName = [
      `transaction`,
      transactionStatus ? transactionStatus : 'all',
      currencyCode,
      ...(searchKey ? [searchKey] : []),
      dateTime,
    ].join('-') + '.csv';

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
