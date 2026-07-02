import 'server-only';

import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import path from 'path';
import jsPDF from 'jspdf';
import { readFileSync } from 'fs';
import { autoTable } from 'jspdf-autotable';
import QRCode from 'qrcode';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { CurrencyCode, InvoiceStatus } from '@/constants/enums';
import { formatCurrency } from '../format-currency';
import { BRAND_NAME, BRAND_URL } from '@/constants/brand';
import 'dayjs/locale/id';
import 'dayjs/locale/en';
import prisma from '../prisma';
import NotFoundError from '../errors/NotFoundError';
import { getSubtotalBreakdown } from '../utils';

dayjs.extend(utc);

const dayJsLocale = process.env.NEXT_PUBLIC_LOCALE.split('-')[0];

dayjs.locale(dayJsLocale);

function registerPdfFonts({
  pdf,
  fontName,
}) {
  const fontStyles = [
    'normal',
    'italic',
    'medium',
    'bold',
    'black',
  ];

  for (const fs of fontStyles) {
    // Read font from filesystem
    const fontPath = path.join(process.cwd(), `public/fonts/${fontName}/${fs}.ttf`);
    const fontData = readFileSync(fontPath, 'base64');

    // add font to jsPDF
    pdf.addFileToVFS(`${fontName}-${fs}`, fontData);
    pdf.addFont(`${fontName}-${fs}`, fontName, fs);
  }
}

export async function generateInvoicePdf(invoiceNumber) {
  await verifySession();

  try {
    const aboutUs = await prisma.aboutUs.findFirst({
      select: {
        supportWhatsapp: true,
        supportEmail: true,
      },
    });
    // get transaction from db
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: invoiceNumber },
      select: {
        status: true,
        issuedAt: true,
        transaction: {
          select: {
            paidAt: true,
            code: true,
            currencyCode: true,
            totalAmount: true,
            customerName: true,
            customerEmail: true,
            customerPhoneNumber: true,
            details: {
              select: {
                qty: true,
                productName: true,
                productVersion: true,
                productVariant: true,
                productCurrencyCode: true,
                productPrice: true,
                productDiscount: true,
                productCouponCode: true,
                productCouponDiscount: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) throw new NotFoundError('The invoice was not found.');

    // Default is a4, mm for unit
    const pdf = new jsPDF();

    registerPdfFonts({ pdf, fontName: 'Montserrat' });

    const page = {
      width: 210,
      height: 297,
      marginX: 12,
      marginY: 12,
    };

    const content = {
      right: page.width - page.marginX,
      bottom: page.height - page.marginY,
    };

    const titleToTextGap = 15; // mm
    const lineHeight = 7;

    // Invoice header
    let brandY = page.marginY;
    const logoPath = path.join(process.cwd(), 'public/brand-logo.png');
    const logoBase64 = readFileSync(logoPath, 'base64');
    pdf.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', page.marginX, brandY, 18, 18);

    pdf.setTextColor('#09090b');

    // E-Commerce info
    brandY += 18 + titleToTextGap;
    pdf.setFont('Montserrat', 'bold');
    pdf.setFontSize(12);
    pdf.text(BRAND_NAME, page.marginX, brandY);

    pdf.setFontSize(11);
    pdf.setFont('Montserrat', 'normal');
    brandY += lineHeight;
    pdf.text(BRAND_URL, page.marginX, brandY);

    brandY += lineHeight;
    pdf.text(`${aboutUs.supportEmail}`, page.marginX, brandY);

    brandY += lineHeight;
    pdf.text(`(Whatsapp) ${aboutUs.supportWhatsapp}`, page.marginX, brandY);

    // Invoice title
    let invoiceY = page.marginY + 5;
    const invoiceX = content.right - 95;

    pdf.setFont('Montserrat', 'bold');
    pdf.setFontSize(23);
    pdf.text('Invoice', invoiceX, invoiceY);

    // Invoice info
    pdf.setFont('Montserrat', 'normal');
    pdf.setFontSize(11);
    const transactionCodeLabel = 'Transaction Code:';
    const invoiceValueX = invoiceX + 3 + pdf.getTextWidth(transactionCodeLabel);

    invoiceY += titleToTextGap;
    pdf.text('Invoice Number:', invoiceX, invoiceY);
    pdf.text(invoiceNumber, invoiceValueX, invoiceY);

    invoiceY += lineHeight;
    pdf.text(transactionCodeLabel, invoiceX, invoiceY);
    pdf.text(invoice.transaction.code, invoiceValueX, invoiceY);

    invoiceY += lineHeight;
    pdf.text('Issued Date:', invoiceX, invoiceY);
    const issuedDate = dayjs.unix(Number(invoice.issuedAt)).utc().format('DD MMM YYYY HH:mm:ss [UTC]');
    pdf.text(issuedDate, invoiceValueX, invoiceY);

    invoiceY += lineHeight;
    pdf.text('Paid At:', invoiceX, invoiceY);
    const paidAt = invoice.transaction.paidAt;
    if (paidAt) {
      const paymentDate = dayjs.unix(Number(paidAt)).utc().format('DD MMM YYYY HH:mm:ss [UTC]');
      pdf.text(paymentDate, invoiceValueX, invoiceY);
    } else {
      pdf.text('-', invoiceValueX, invoiceY);
    }

    invoiceY += lineHeight;
    pdf.text('Status:', invoiceX, invoiceY);
    let statusColor = '#15803d';
    if (invoice.status === InvoiceStatus.VOID) statusColor = '#b91c1c';
    pdf.setTextColor(statusColor);
    pdf.text(invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1), invoiceValueX, invoiceY);

    // Buyer info
    pdf.setTextColor('#09090b');
    pdf.setFont('Montserrat', 'bold');
    pdf.setFontSize(13);
    let buyerY = brandY + 23;
    pdf.text('Paid by', page.marginX, buyerY);

    pdf.setFont('Montserrat', 'normal');
    pdf.setFontSize(11);
    buyerY += lineHeight + 3;
    pdf.text(invoice.transaction.customerName, page.marginX, buyerY);
    buyerY += lineHeight;
    pdf.text(invoice.transaction.customerEmail, page.marginX, buyerY);

    if (invoice.transaction.customerPhoneNumber) {
      buyerY += lineHeight;
      pdf.text(invoice.transaction.customerPhoneNumber, page.marginX, buyerY);
    }

    // Table transaction using jspdf-autotable
    const heads = ['Product', 'Unit Price', 'Qty', 'Amount'];
    const rows = [];

    invoice.transaction.details.forEach((detail, index) => {
      const productPrice = detail.productPrice.toNumber();
      let currentAmount = detail.qty * productPrice;

      rows.push({
        rowGroup: index,
        product: `${detail.productName} - ${detail.productVariant} (${detail.productVersion})`,
        qty: detail.qty,
        unit: formatCurrency({
          value: productPrice,
          currencyCode: detail.productCurrencyCode,
        }),
        amount: formatCurrency({
          value: currentAmount,
          currencyCode: detail.productCurrencyCode,
        }),
      });

      const { subtotal, discountPrice, couponPrice } = getSubtotalBreakdown({
        qty: detail.qty,
        price: productPrice,
        currencyCode: detail.productCurrencyCode,
        discount: detail.productDiscount,
        couponDiscount: detail.productCouponDiscount,
      });

      if (discountPrice) {
        rows.push({
          rowGroup: index,
          product: `Discount (${detail.productDiscount}%)`,
          isChild: true,
          amount: `-${formatCurrency({
            value: discountPrice,
            currencyCode: detail.productCurrencyCode,
          })}`,
        });
      }

      if (couponPrice) {
        rows.push({
          rowGroup: index,
          product: `Coupon Upgrade (${detail.productCouponCode}, ${detail.productCouponDiscount}%)`,
          isChild: true,
          amount: `-${formatCurrency({
            value: couponPrice,
            currencyCode: detail.productCurrencyCode,
          })}`,
        });
      }

      rows.push({
        rowGroup: index,
        product: 'Subtotal',
        isChild: true,
        amount: formatCurrency({
          value: subtotal,
          currencyCode: detail.productCurrencyCode,
        }),
      });
    });

    const columns = [
      { header: 'Product', dataKey: 'product' },
      { header: 'Unit Price', dataKey: 'unit' },
      { header: 'Qty', dataKey: 'qty' },
      { header: 'Amount', dataKey: 'amount' },
    ];

    autoTable(pdf, {
      startY: buyerY + 20,
      margin: { left: page.marginX, right: page.marginX, top: page.marginY, bottom: page.marginY },
      head: [heads],
      body: rows,
      styles: {
        font: 'Montserrat',
        fontStyle: 'normal',
        fontSize: 11,
        textColor: '#09090b',
        minCellHeight: 12,
        valign: 'middle',
      },
      columns,
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      headStyles: {
        font: 'Montserrat',
        fontStyle: 'bold',
        fillColor: '#e4e4e7',
      },
      didParseCell: function ({ row, cell, table, column }) {
        // data.row.section → 'body' / 'head' / 'foot'
        if (row.section === 'body') {
          if (row.raw?.isChild) {
            // Set child row style
            cell.styles.minCellHeight = 10;
            cell.styles.valign = 'top';
            cell.styles.fontSize = 10;

            const prevRow = table.body[row.index - 1];

            // Set child row padding
            if (!prevRow.raw?.isChild) {
              cell.styles.cellPadding = { left: 6, top: 2, bottom: 0, right: 2 };
            } else {
              cell.styles.cellPadding = { left: 6, top: 1, bottom: 2, right: 2 };
            }
          }

          // Set row stripped bg
          if (row.raw.rowGroup % 2 !== 0) {
            cell.styles.fillColor = '#f4f4f5';
          } else {
            cell.styles.fillColor = 'white';
          }
        }

        if (row.section === 'head' && [1, 2, 3].includes(column.index)) {
          cell.styles.halign = 'right';
        }
      }
    });

    // Summary info
    let summaryY = pdf.lastAutoTable.finalY + 5;
    if (summaryY + lineHeight + (lineHeight - 3) + 11 > pdf.internal.pageSize.getHeight() - page.marginY) {
      pdf.addPage();
      summaryY = page.marginY;
    }

    const summaryX = content.right - 67;
    const summaryValueX = content.right - 2;

    pdf.setDrawColor('#d4d4d8');
    pdf.line(summaryX - 15, summaryY, content.right, summaryY);

    summaryY += lineHeight;
    pdf.setFont('Montserrat', 'bold');
    pdf.text('Total', summaryX, summaryY, { align: 'right' });
    pdf.text(
      formatCurrency({
        value: invoice.transaction.totalAmount.toNumber(),
        currencyCode: invoice.transaction.currencyCode,
      }),
      summaryValueX,
      summaryY,
      { align: 'right' },
    );

    summaryY += lineHeight - 3;
    pdf.setDrawColor('#d4d4d8');
    pdf.line(summaryX - 15, summaryY, content.right, summaryY);

    // Note
    let noteY = summaryY + 25;
    let qrY = summaryY + 20;

    if (noteY + (lineHeight * 3) + 11 > pdf.internal.pageSize.getHeight() - page.marginY) {
      pdf.addPage();
      noteY = page.marginY;
      qrY = page.marginY - 5;
    }

    pdf.setFont('Montserrat', 'normal');
    pdf.setFontSize(10);
    pdf.text('Note:', page.marginX, noteY);

    let currencyNote = 'Indonesian Rupiah (IDR)';
    if (invoice.transaction.currencyCode === CurrencyCode.USD) {
      currencyNote = 'United States Dollar (USD)';
    }

    noteY += lineHeight;
    pdf.text(`- This transaction is made in ${currencyNote}`, page.marginX + 2, noteY);
    noteY += lineHeight;
    pdf.text('- Tax is not calculated or included in this invoice', page.marginX + 2, noteY);
    noteY += lineHeight;
    pdf.text('- Digitally generated — no signature required', page.marginX + 2, noteY);

    // QR Code
    const invoiceUrl = new URL(`/invoice/${invoiceNumber}/pdf`, process.env.NEXTAUTH_URL).toString();
    const qrBase64 = await QRCode.toDataURL(invoiceUrl, {
      width: 100,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    pdf.addImage(qrBase64, 'PNG', content.right - 24.5, qrY, 27, 27);

    const arrayBuffer = pdf.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  } catch (err) {
    if (err instanceof NotFoundError) throw err;

    console.error(err);
    throw new UnknownError();
  }
}
