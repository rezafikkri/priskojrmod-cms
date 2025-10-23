import { generateInvoicePdf } from '@/lib/services/invoice-service';

export async function GET(req, { params }) {
  const { number } = await params;

  const pdfBuffer = await generateInvoicePdf(number);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=${number}.pdf`,
    },
  });
}
