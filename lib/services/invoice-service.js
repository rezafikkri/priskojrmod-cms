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
    pdf.text('Invoice', content.right - 90, invoiceY);

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
    pdf.text('October 7, 2025', invoiceValueX, invoiceY);

    invoiceY += lineHeight;
    pdf.text('Status:', invoiceX, invoiceY);
    pdf.setTextColor('#15803d');
    pdf.text('Active', invoiceValueX, invoiceY);

    // Buyer info
    pdf.setTextColor('#09090b');
    pdf.setFont('Montserrat', 'bold');
    pdf.setFontSize(13);
    let buyerY = brandY + 25;
    pdf.text('Paid By:', page.marginX, buyerY);

    pdf.setFont('Montserrat', 'normal');
    pdf.setFontSize(11);
    buyerY += lineHeight + 5;
    pdf.text('Reza Sariful Fikri', page.marginX, buyerY);
    buyerY += lineHeight;
    pdf.text('fikkri.reza@gmail.com', page.marginX, buyerY);

    // Seller info
    pdf.setFont('Montserrat', 'bold');
    pdf.setFontSize(13);
    let sellerY = brandY + 25;
    pdf.text('Sold By:', invoiceX, sellerY);

    pdf.setFont('Montserrat', 'normal');
    pdf.setFontSize(11);
    sellerY += lineHeight + 5;
    pdf.text('Prisko Arjuna', invoiceX, sellerY);
    sellerY += lineHeight;
    pdf.text('prisko@gmail.com', invoiceX, sellerY);
    sellerY += lineHeight;
    pdf.text('Bengkulu, Indonesia', invoiceX, sellerY);

    // Table transaction using jspdf-autotable
    const heads = ['Product', 'Qty', 'Unit Price', 'Amount'];
    const rows = [
      { rowGroup: 0, product: 'Product A v2', qty: '1', unit: 'Rp 250.000', amount: 'Rp 250.000' },
      { rowGroup: 0, product: '• Discount (10%)', isChild: true, amount: '-Rp 25.000' },
      { rowGroup: 0, product: '• Coupon Upgrade (UPG-A-V2, 20%)', isChild: true, amount: '-Rp 50.000' },

      { rowGroup: 1, product: 'Product B v3', qty: '2', unit: 'Rp 150.000', amount: 'Rp 300.000' },
      { rowGroup: 1, product: '• Coupon Upgrade (UPG-B-V3, 10%)', isChild: true, amount: '-Rp 30.000' },
    ];
    const columns = [
      { header: 'Product', dataKey: 'product' },
      { header: 'Qty', dataKey: 'qty' },
      { header: 'Unit Price', dataKey: 'unit' },
      { header: 'Amount', dataKey: 'amount' },
    ];

    autoTable(pdf, {
      startY: sellerY + 20,
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
    pdf.text('Rp170.000', summaryValueX, summaryY, { align: 'right' });

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

    noteY += lineHeight;
    pdf.text('- The transaction is made in Indonesian Rupiah (IDR).', page.marginX + 2, noteY);
    noteY += lineHeight;
    pdf.text('- Tax is not calculated or included in this invoice.', page.marginX + 2, noteY);
    noteY += lineHeight;
    pdf.text('- Digitally generated — no signature required.', page.marginX + 2, noteY);

    // QR Code
    const invoiceUrl = new URL(`/invoices/${invoiceNumber}/pdf`, process.env.NEXTAUTH_URL).toString();
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
