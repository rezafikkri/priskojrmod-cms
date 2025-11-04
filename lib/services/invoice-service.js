import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import UnknownError from '../errors/UnknownError';
import verifySession from '../verifySession';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import path from 'path';
import jsPDF from 'jspdf';
import { readFileSync } from 'fs';
import { autoTable } from 'jspdf-autotable';
import QRCode from 'qrcode';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { CurrencyCode, InvoiceStatus } from '@/constants/enums';
import { formatCurrency } from '../format-currency';
import 'dayjs/locale/id';
import 'dayjs/locale/en';

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
  const session = await verifySession();
  if (!session) throw new UnauthenticatedError();

  try {
    // get transaction from db
    const invoice = await pjmeDBPrismaClient.Invoice.findUnique({
      where: { invoice_number: invoiceNumber },
      select: {
        status: true,
        issued_at: true,
        transaction: {
          select: {
            currency_code: true,
            total_amount: true,
            customer_name: true,
            customer_email: true,
            details: {
              select: {
                quantity: true,
                product_name: true,
                product_version: true,
                product_currency_code: true,
                product_price: true,
                product_discount: true,
                product_coupon_code: true,
                product_coupon_discount: true,
              },
            },
          },
        },
      },
    });

    // Default is a4, mm for unit
    const pdf = new jsPDF();

    registerPdfFonts({ pdf, fontName: 'Montserrat' });

    const page = {
      width: 210,
      height: 297,
      marginX: 20,
      marginY: 20,
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
    const brandName = process.env.NEXT_PUBLIC_BRAND_NAME;
    const brandUrl = process.env.NEXT_PUBLIC_BRAND_URL;
    pdf.setFontSize(12);
    pdf.text(brandName, page.marginX, brandY);

    pdf.setFontSize(11);
    pdf.setFont('Montserrat', 'normal');
    brandY += lineHeight;
    pdf.text(brandUrl, page.marginX, brandY);

    // Invoice title
    let invoiceY = page.marginY + 5;
    const invoiceX = content.right - 90;

    pdf.setFont('Montserrat', 'bold');
    pdf.setFontSize(23);
    pdf.text('Invoice', invoiceX, invoiceY);

    // Invoice info
    pdf.setFont('Montserrat', 'normal');
    pdf.setFontSize(11);

    const invoiceNumberLabel = 'Invoice Number:';
    const invoiceValueX = invoiceX + 3 + pdf.getTextWidth(invoiceNumberLabel);

    invoiceY += titleToTextGap;
    pdf.text(invoiceNumberLabel, invoiceX, invoiceY);
    pdf.text(invoiceNumber, invoiceValueX, invoiceY);

    invoiceY += lineHeight;
    pdf.text('Issued Date:', invoiceX, invoiceY);
    const issuedDate = dayjs.unix(Number(invoice.issued_at)).utc().format('DD MMM YYYY HH:mm:ss [UTC]');
    pdf.text(issuedDate, invoiceValueX, invoiceY);

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
    pdf.text(invoice.transaction.customer_name, page.marginX, buyerY);
    buyerY += lineHeight;
    pdf.text(invoice.transaction.customer_email, page.marginX, buyerY);

    // Table transaction using jspdf-autotable
    const heads = ['Product', 'Qty', 'Unit Price', 'Amount'];
    const rows = [];

    invoice.transaction.details.forEach((detail, index) => {
      const productPrice = detail.product_price.toNumber();
      let currentAmount = detail.quantity * productPrice;

      rows.push({
        rowGroup: index,
        product: `${detail.product_name} - ${detail.product_version}`,
        qty: detail.quantity,
        unit: formatCurrency({
          value: productPrice,
          currencyCode: detail.product_currency_code,
        }),
        amount: formatCurrency({
          value: currentAmount,
          currencyCode: detail.product_currency_code,
        }),
      });

      if (detail.product_discount) {
        let discountPrice = currentAmount * (detail.product_discount / 100);
        if (detail.product_currency_code === CurrencyCode.IDR) discountPrice = Math.round(discountPrice);
        currentAmount -= discountPrice;

        rows.push({
          rowGroup: index,
          product: `• Discount (${detail.product_discount}%)`,
          isChild: true,
          amount: `-${formatCurrency({
            value: discountPrice,
            currencyCode: detail.product_currency_code,
          })}`,
        });
      }

      if (detail.product_coupon_discount) {
        let couponPrice = currentAmount * (detail.product_coupon_discount / 100);
        if (detail.product_currency_code === CurrencyCode.IDR) couponPrice = Math.round(couponPrice);

        rows.push({
          rowGroup: index,
          product: `• Coupon Upgrade (${detail.product_coupon_code}, ${detail.product_coupon_discount}%)`,
          isChild: true,
          amount: `-${formatCurrency({
            value: couponPrice,
            currencyCode: detail.product_currency_code,
          })}`,
        });
      }
    });

    const columns = [
      { header: 'Product', dataKey: 'product' },
      { header: 'Qty', dataKey: 'qty' },
      { header: 'Unit Price', dataKey: 'unit' },
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
    pdf.line(summaryX - 15, summaryY, 190, summaryY);

    summaryY += lineHeight;
    pdf.setFont('Montserrat', 'bold');
    pdf.text('Total', summaryX, summaryY, { align: 'right' });
    pdf.text(
      formatCurrency({
        value: invoice.transaction.total_amount.toNumber(),
        currencyCode: invoice.transaction.currency_code,
      }),
      summaryValueX,
      summaryY,
      { align: 'right' },
    );

    summaryY += lineHeight - 3;
    pdf.setDrawColor('#d4d4d8');
    pdf.line(summaryX - 15, summaryY, 190, summaryY);

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
    if (invoice.transaction.currency_code === CurrencyCode.USD) {
      currencyNote = 'United States Dollar (USD)';
    }

    noteY += lineHeight;
    pdf.text(`- The transaction is made in ${currencyNote}.`, page.marginX + 2, noteY);
    noteY += lineHeight;
    pdf.text('- Tax is not calculated or included in this invoice.', page.marginX + 2, noteY);
    noteY += lineHeight;
    pdf.text('- Digitally generated — no signature required.', page.marginX + 2, noteY);

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
    console.error(err);
    throw new UnknownError();
  }
}
