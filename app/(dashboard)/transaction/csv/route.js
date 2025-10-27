import { generateTransactionExport } from '@/lib/services/transaction-service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const transactionStatus = searchParams.get('ts') ?? 'all';
  const currencyCode = searchParams.get('cc') ?? 'IDR';

  const stream = await generateTransactionExport({
    transactionStatus,
    currencyCode,
  });

  const dateTime = dayjs.utc().format('YYYYMMDD-HHmmss[Z]');

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="transaction-${transactionStatus.toUpperCase()}-${currencyCode}-${dateTime}.csv"`,
    },
  });
}
