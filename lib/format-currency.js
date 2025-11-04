import { CurrencyCode } from '@/constants/enums';

const currencyFormatters = {};

function getFormatter(currencyCode, notation) {
  const formatterKey = `${currencyCode}-${notation}`;

  if (!currencyFormatters[formatterKey]) {
    const locale = process.env.NEXT_PUBLIC_LOCALE;
    const maxFraction = currencyCode === CurrencyCode.IDR ? 0 : 2;
    currencyFormatters[formatterKey] = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      notation,
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFraction,
    });
  }

  return currencyFormatters[formatterKey];
}

export function formatCurrency({
  value,
  currencyCode,
  notation = 'standard',
}) {
  const formatter = getFormatter(currencyCode, notation);
  return formatter.format(value);
}
