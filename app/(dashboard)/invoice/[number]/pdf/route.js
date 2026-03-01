import NotFoundError from '@/lib/errors/NotFoundError';
import { generateInvoicePdf } from '@/lib/services/invoice-service';

export async function GET(_, { params }) {
  const { number } = await params;

  try {
    const pdfBuffer = await generateInvoicePdf(number);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=${number}.pdf`,
      },
    });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return new Response(err.message, { status: 404 });
    }

    return new Response(err.message, { status: 500 });
  }
}
