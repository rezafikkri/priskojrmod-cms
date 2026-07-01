import { CurrencyCode } from "@/constants/enums";

const currencyFormatters = {};

function getFormatter(currencyCode, notation) {
  const formatterKey = `${currencyCode}-${notation}`;

  if (!currencyFormatters[formatterKey]) {
    const locale = process.env.NEXT_PUBLIC_LOCALE;
    const options = {
      style: 'currency',
      currency: currencyCode,
      notation,
    };

    if (currencyCode === CurrencyCode.IDR) options.minimumFractionDigits = 0;

    if (notation === 'compact') {
      currencyFormatters[formatterKey] = new Intl.NumberFormat(locale, {
        ...options,
        maximumFractionDigits: 1,
      });
    } else {
      currencyFormatters[formatterKey] = new Intl.NumberFormat(locale, options);
    }
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
