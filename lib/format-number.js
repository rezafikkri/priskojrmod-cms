const numberFormatters = {};

function getFormatter(notation) {
  const formatterKey = notation;

  if (!numberFormatters[formatterKey]) {
    numberFormatters[formatterKey] = new Intl.NumberFormat(process.env.NEXT_PUBLIC_LOCALE, {
      notation,
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });;
  }

  return numberFormatters[formatterKey];
}

export function formatNumber({ value, notation = 'standard' }) {
  return getFormatter(notation).format(value);
}
