const shortFormatter = new Intl.NumberFormat(process.env.NEXT_PUBLIC_LOCALE, {
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function shortNumber(value) {
  return shortFormatter.format(value);
}
